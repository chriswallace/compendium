import * as readline from 'readline';
import chalk from 'chalk';
import ora from 'ora';
import { OllamaClient } from './llm/client.js';
import { Config, updateConfig } from './utils/config.js';
import { AgentCore } from './core/agent.js';
import {
  formatError,
  formatSuccess,
  formatInfo,
  formatToolCall,
  formatToolResult,
  formatModelInfo,
  formatHeader,
} from './utils/display.js';

export class CLI {
  private agent: AgentCore;
  private config: Config;
  private rl: readline.Interface | null = null;

  constructor(client: OllamaClient, config: Config) {
    this.config = config;
    this.agent = new AgentCore(client, config, {
      onToolCall: (event) => {
        console.log(formatToolCall(event.toolName, event.params));
      },
      onToolResult: (event) => {
        console.log(formatToolResult(event.result));
      },
    });
  }

  async initialize(): Promise<void> {
    const messageCount = await this.agent.initialize();
    if (messageCount > 0) {
      console.log(formatInfo(`Loaded ${messageCount} messages from history`));
    }
  }

  private printWelcome(): void {
    console.log(formatHeader('Compendium - Local AI Coding Assistant'));
    console.log(formatModelInfo(this.agent.getModel(), this.config.ollamaUrl));
    console.log(chalk.gray('Type /help for commands, /exit to quit\n'));
  }

  private printHelp(): void {
    console.log(`
${chalk.cyan('Commands:')}
  ${chalk.yellow('/help')}           Show this help message
  ${chalk.yellow('/clear')}          Clear conversation history
  ${chalk.yellow('/model <name>')}   Switch to a different model
  ${chalk.yellow('/models')}         List available models
  ${chalk.yellow('/history')}        Show conversation history
  ${chalk.yellow('/exit')}           Exit the assistant

${chalk.cyan('Tips:')}
  - Ask questions about your code
  - Request file edits or creation
  - Run shell commands through the assistant
  - The assistant remembers context within a session
`);
  }

  private async handleCommand(input: string): Promise<boolean> {
    const [command, ...args] = input.slice(1).split(' ');

    switch (command.toLowerCase()) {
      case 'help':
        this.printHelp();
        return true;

      case 'exit':
      case 'quit':
        console.log(chalk.gray('Goodbye!'));
        process.exit(0);

      case 'clear':
        await this.agent.clearHistory();
        console.log(formatSuccess('Conversation cleared'));
        return true;

      case 'model':
        if (args.length === 0) {
          console.log(formatInfo(`Current model: ${this.agent.getModel()}`));
        } else {
          const newModel = args.join(' ');
          this.agent.setModel(newModel);
          await updateConfig({ model: newModel });
          console.log(formatSuccess(`Switched to model: ${newModel}`));
        }
        return true;

      case 'models':
        try {
          const spinner = ora('Fetching models...').start();
          const models = await this.agent.listModels();
          spinner.stop();
          console.log(chalk.cyan('Available models:'));
          models.forEach((m) => {
            const current = m === this.agent.getModel() ? chalk.green(' (current)') : '';
            console.log(`  - ${m}${current}`);
          });
        } catch (error) {
          console.log(formatError(`Failed to list models: ${error}`));
        }
        return true;

      case 'history':
        const messages = this.agent.getMessages();
        if (messages.length === 0) {
          console.log(formatInfo('No conversation history'));
        } else {
          console.log(chalk.cyan('Conversation history:'));
          messages.forEach((msg, i) => {
            const role = msg.role === 'user' ? chalk.green('You') : chalk.blue('Assistant');
            const content = msg.content.length > 100
              ? msg.content.substring(0, 100) + '...'
              : msg.content;
            console.log(`${i + 1}. ${role}: ${content}`);
          });
        }
        return true;

      default:
        console.log(formatError(`Unknown command: /${command}`));
        return true;
    }
  }

  private async processUserInput(input: string): Promise<void> {
    const spinner = ora('Thinking...').start();

    try {
      spinner.stop();
      process.stdout.write(chalk.blue('Assistant: '));

      await this.agent.streamMessage(input, (event) => {
        if (event.type === 'chunk') {
          process.stdout.write(event.data as string);
        } else if (event.type === 'tool_call') {
          const data = event.data as { toolName: string; params: unknown };
          console.log('\n' + formatToolCall(data.toolName, data.params));
        } else if (event.type === 'tool_result') {
          const data = event.data as { result: string };
          console.log(formatToolResult(data.result));
          process.stdout.write(chalk.blue('Assistant: '));
        }
      });

      console.log('\n');
    } catch (error) {
      spinner.stop();
      console.log(formatError(`Error: ${error}`));
    }
  }

  async run(): Promise<void> {
    await this.initialize();
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
          await this.processUserInput(trimmed);
        }

        prompt();
      });
    };

    this.rl.on('close', () => {
      console.log(chalk.gray('\nGoodbye!'));
      process.exit(0);
    });

    prompt();
  }
}
