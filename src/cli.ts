import * as readline from 'readline';
import chalk from 'chalk';
import ora from 'ora';
import { OllamaClient, Message, ToolCall } from './llm/client.js';
import { executeTool } from './tools/index.js';
import { loadConfig, updateConfig, Config } from './utils/config.js';
import {
  loadConversation,
  saveConversation,
  clearConversation,
} from './history/store.js';
import {
  formatError,
  formatSuccess,
  formatInfo,
  formatToolCall,
  formatToolResult,
  formatModelInfo,
  formatHeader,
  formatDivider,
} from './utils/display.js';

export class CLI {
  private client: OllamaClient;
  private config: Config;
  private messages: Message[] = [];
  private rl: readline.Interface | null = null;

  constructor(client: OllamaClient, config: Config) {
    this.client = client;
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Load conversation history
    if (this.config.historyEnabled) {
      this.messages = await loadConversation();
      if (this.messages.length > 0) {
        console.log(formatInfo(`Loaded ${this.messages.length} messages from history`));
      }
    }
  }

  private printWelcome(): void {
    console.log(formatHeader('Compendium - Local AI Coding Assistant'));
    console.log(formatModelInfo(this.client.getModel(), this.config.ollamaUrl));
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
  • Ask questions about your code
  • Request file edits or creation
  • Run shell commands through the assistant
  • The assistant remembers context within a session
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
        this.messages = [];
        await clearConversation();
        console.log(formatSuccess('Conversation cleared'));
        return true;

      case 'model':
        if (args.length === 0) {
          console.log(formatInfo(`Current model: ${this.client.getModel()}`));
        } else {
          const newModel = args.join(' ');
          this.client.setModel(newModel);
          await updateConfig({ model: newModel });
          console.log(formatSuccess(`Switched to model: ${newModel}`));
        }
        return true;

      case 'models':
        try {
          const spinner = ora('Fetching models...').start();
          const models = await this.client.listModels();
          spinner.stop();
          console.log(chalk.cyan('Available models:'));
          models.forEach((m) => {
            const current = m === this.client.getModel() ? chalk.green(' (current)') : '';
            console.log(`  • ${m}${current}`);
          });
        } catch (error) {
          console.log(formatError(`Failed to list models: ${error}`));
        }
        return true;

      case 'history':
        if (this.messages.length === 0) {
          console.log(formatInfo('No conversation history'));
        } else {
          console.log(chalk.cyan('Conversation history:'));
          this.messages.forEach((msg, i) => {
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

  private async handleToolCall(toolCall: ToolCall): Promise<string> {
    let params: unknown;
    try {
      params = JSON.parse(toolCall.function.arguments);
    } catch {
      params = {};
    }

    console.log(formatToolCall(toolCall.function.name, params));

    const result = await executeTool(toolCall.function.name, params);

    console.log(formatToolResult(result));

    return result;
  }

  private async processUserInput(input: string): Promise<void> {
    // Add user message
    this.messages.push({ role: 'user', content: input });

    const spinner = ora('Thinking...').start();

    try {
      let fullResponse = '';

      // Stream the response
      spinner.stop();
      process.stdout.write(chalk.blue('Assistant: '));

      for await (const chunk of this.client.chatStream(
        this.messages,
        this.handleToolCall.bind(this)
      )) {
        process.stdout.write(chunk);
        fullResponse += chunk;
      }

      console.log('\n');

      // Add assistant response to history
      if (fullResponse) {
        this.messages.push({ role: 'assistant', content: fullResponse });
      }

      // Save conversation
      if (this.config.historyEnabled) {
        await saveConversation(this.messages);
      }
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

    // Handle Ctrl+C gracefully
    this.rl.on('close', () => {
      console.log(chalk.gray('\nGoodbye!'));
      process.exit(0);
    });

    prompt();
  }
}
