#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { OllamaClient } from './llm/client.js';
import { loadConfig } from './utils/config.js';
import { CLI } from './cli.js';
import { formatError, formatInfo } from './utils/display.js';

const program = new Command();

program
  .name('compendium')
  .description('A local AI coding assistant using Ollama')
  .version('1.0.0')
  .option('-m, --model <model>', 'Model to use')
  .option('-u, --url <url>', 'Ollama server URL')
  .option('--no-history', 'Disable conversation history')
  .action(async (options) => {
    try {
      // Load config
      const config = await loadConfig();

      // Override with CLI options
      if (options.model) {
        config.model = options.model;
      }
      if (options.url) {
        config.ollamaUrl = options.url;
      }
      if (options.history === false) {
        config.historyEnabled = false;
      }

      // Create Ollama client
      const client = new OllamaClient(config.ollamaUrl, config.model);

      // Check connection
      const spinner = ora('Connecting to Ollama...').start();
      const connected = await client.checkConnection();

      if (!connected) {
        spinner.fail();
        console.log(formatError(`Cannot connect to Ollama at ${config.ollamaUrl}`));
        console.log(formatInfo('Make sure Ollama is running: ollama serve'));
        process.exit(1);
      }

      spinner.succeed('Connected to Ollama');

      // Check if model is available
      const models = await client.listModels();
      if (!models.includes(config.model)) {
        console.log(formatError(`Model "${config.model}" not found`));
        console.log(formatInfo(`Available models: ${models.join(', ')}`));
        console.log(formatInfo(`Pull it with: ollama pull ${config.model}`));
        process.exit(1);
      }

      // Start CLI
      const cli = new CLI(client, config);
      await cli.run();
    } catch (error) {
      console.error(formatError(`Fatal error: ${error}`));
      process.exit(1);
    }
  });

program.parse();
