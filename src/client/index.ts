import * as readline from 'readline';
import chalk from 'chalk';
import ora, { type Ora } from 'ora';
import { v4 as uuidv4 } from 'uuid';
import { WebSocketConnection } from './connection.js';
import { ServerMessage } from '../server/protocol.js';
import {
  formatError,
  formatSuccess,
  formatInfo,
  formatToolCall,
  formatToolResult,
  formatHeader,
} from '../utils/display.js';

export class RemoteClient {
  private connection: WebSocketConnection;
  private rl: readline.Interface | null = null;
  private serverUrl: string;
  private currentModel: string = '';
  private sessionId: string = '';
  private pendingResponses: Map<string, {
    resolve: () => void;
    spinner?: Ora;
  }> = new Map();

  constructor(serverUrl: string, token: string) {
    this.serverUrl = serverUrl;
    this.connection = new WebSocketConnection({
      url: serverUrl,
      token,
      reconnect: true,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.connection.on('message', (message: ServerMessage) => {
      this.handleMessage(message);
    });

    this.connection.on('disconnected', () => {
      console.log(chalk.yellow('\nDisconnected from server'));
    });

    this.connection.on('reconnecting', (attempt: number) => {
      console.log(chalk.yellow(`Reconnecting... (attempt ${attempt})`));
    });

    this.connection.on('reconnect_failed', () => {
      console.log(formatError('Failed to reconnect to server'));
      process.exit(1);
    });

    this.connection.on('error', (error: Error) => {
      console.log(formatError(`Connection error: ${error.message}`));
    });
  }

  private handleMessage(message: ServerMessage): void {
    switch (message.type) {
      case 'system':
        this.handleSystemMessage(message);
        break;

      case 'stream':
        process.stdout.write(message.delta);
        break;

      case 'tool_call':
        console.log(formatToolCall(message.tool, message.params));
        break;

      case 'tool_result':
        console.log(formatToolResult(message.result));
        break;

      case 'complete':
        console.log('\n');
        const pending = this.pendingResponses.get(message.id);
        if (pending) {
          pending.spinner?.stop();
          this.pendingResponses.delete(message.id);
          pending.resolve();
        }
        break;

      case 'error':
        console.log(formatError(message.message));
        const errorPending = this.pendingResponses.get(message.id);
        if (errorPending) {
          errorPending.spinner?.stop();
          this.pendingResponses.delete(message.id);
          errorPending.resolve();
        }
        break;
    }
  }

  private handleSystemMessage(message: ServerMessage & { type: 'system' }): void {
    switch (message.event) {
      case 'connected':
        const data = message.data as { sessionId?: string; model?: string; machines?: unknown[] };
        if (data?.sessionId) {
          this.sessionId = data.sessionId;
        }
        if (data?.model) {
          this.currentModel = data.model;
        }
        if (data?.machines) {
          console.log(formatInfo(`Connected machines: ${JSON.stringify(data.machines)}`));
        }
        break;

      case 'model_changed':
        const modelData = message.data as { model: string };
        this.currentModel = modelData.model;
        console.log(formatSuccess(`Model: ${this.currentModel}`));
        break;

      case 'history_cleared':
        console.log(formatSuccess('Conversation cleared'));
        break;

      case 'models_list':
        const modelsData = message.data as { models: string[]; current: string };
        console.log(chalk.cyan('Available models:'));
        modelsData.models.forEach((m) => {
          const current = m === modelsData.current ? chalk.green(' (current)') : '';
          console.log(`  - ${m}${current}`);
        });
        break;
    }
  }

  async connect(): Promise<void> {
    const spinner = ora('Connecting to server...').start();

    try {
      await this.connection.connect();
      spinner.succeed(`Connected to ${this.serverUrl}`);
    } catch (error) {
      spinner.fail('Failed to connect');
      throw error;
    }
  }

  private printWelcome(): void {
    console.log(formatHeader('Compendium - Remote Client'));
    console.log(chalk.gray(`Server: ${chalk.cyan(this.serverUrl)}`));
    console.log(chalk.gray(`Model: ${chalk.cyan(this.currentModel || 'unknown')}`));
    console.log(chalk.gray('Type /help for commands, /exit to quit\n'));
  }

  private printHelp(): void {
    console.log(`
${chalk.cyan('Commands:')}
  ${chalk.yellow('/help')}           Show this help message
  ${chalk.yellow('/clear')}          Clear conversation history
  ${chalk.yellow('/model <name>')}   Switch to a different model
  ${chalk.yellow('/models')}         List available models
  ${chalk.yellow('/machines')}       List connected machines
  ${chalk.yellow('/exit')}           Exit the client

${chalk.cyan('Tips:')}
  - Ask questions about your code
  - Request file edits or creation
  - Run shell commands through the assistant
  - Specify machine for remote execution
`);
  }

  private async handleCommand(input: string): Promise<void> {
    const [command, ...args] = input.slice(1).split(' ');
    const id = uuidv4();

    switch (command.toLowerCase()) {
      case 'help':
        this.printHelp();
        break;

      case 'exit':
      case 'quit':
        console.log(chalk.gray('Goodbye!'));
        this.connection.disconnect();
        process.exit(0);

      case 'clear':
        this.connection.send({
          type: 'command',
          id,
          command: 'clear',
        });
        break;

      case 'model':
        this.connection.send({
          type: 'command',
          id,
          command: 'model',
          args: args.length > 0 ? args : undefined,
        });
        break;

      case 'models':
        this.connection.send({
          type: 'command',
          id,
          command: 'models',
        });
        break;

      case 'machines':
        this.connection.send({
          type: 'command',
          id,
          command: 'machines',
        });
        break;

      default:
        console.log(formatError(`Unknown command: /${command}`));
    }
  }

  private async sendChat(content: string): Promise<void> {
    const id = uuidv4();
    const spinner = ora('Thinking...').start();

    return new Promise((resolve) => {
      this.pendingResponses.set(id, { resolve, spinner });

      spinner.stop();
      process.stdout.write(chalk.blue('Assistant: '));

      this.connection.send({
        type: 'chat',
        id,
        content,
      });
    });
  }

  async run(): Promise<void> {
    this.printWelcome();

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const prompt = (): void => {
      this.rl!.question(chalk.green('> '), async (input) => {
        const trimmed = input.trim();

        if (!trimmed) {
          prompt();
          return;
        }

        if (trimmed.startsWith('/')) {
          await this.handleCommand(trimmed);
        } else {
          await this.sendChat(trimmed);
        }

        prompt();
      });
    };

    this.rl.on('close', () => {
      console.log(chalk.gray('\nGoodbye!'));
      this.connection.disconnect();
      process.exit(0);
    });

    prompt();
  }
}
