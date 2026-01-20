#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { OllamaClient } from './llm/client.js';
import { loadConfig, updateConfig } from './utils/config.js';
import { CLI } from './cli.js';
import { CompendiumServer, generateToken } from './server/index.js';
import { RemoteClient } from './client/index.js';
import { CompendiumDaemon } from './daemon/index.js';
import { formatError, formatInfo } from './utils/display.js';

const program = new Command();

program
  .name('compendium')
  .description('A local AI coding assistant using Ollama')
  .version('1.0.0');

// Default command - local CLI
program
  .command('local', { isDefault: true })
  .description('Run Compendium locally (default)')
  .option('-m, --model <model>', 'Model to use')
  .option('-u, --url <url>', 'Ollama server URL')
  .option('--no-history', 'Disable conversation history')
  .action(async (options) => {
    try {
      const config = await loadConfig();

      if (options.model) config.model = options.model;
      if (options.url) config.ollamaUrl = options.url;
      if (options.history === false) config.historyEnabled = false;

      const client = new OllamaClient(config.ollamaUrl, config.model);

      const spinner = ora('Connecting to Ollama...').start();
      const connected = await client.checkConnection();

      if (!connected) {
        spinner.fail();
        console.log(formatError(`Cannot connect to Ollama at ${config.ollamaUrl}`));
        console.log(formatInfo('Make sure Ollama is running: ollama serve'));
        process.exit(1);
      }

      spinner.succeed('Connected to Ollama');

      const models = await client.listModels();
      if (!models.includes(config.model)) {
        console.log(formatError(`Model "${config.model}" not found`));
        console.log(formatInfo(`Available models: ${models.join(', ')}`));
        console.log(formatInfo(`Pull it with: ollama pull ${config.model}`));
        process.exit(1);
      }

      const cli = new CLI(client, config);
      await cli.run();
    } catch (error) {
      console.error(formatError(`Fatal error: ${error}`));
      process.exit(1);
    }
  });

// Server command
program
  .command('serve')
  .description('Start Compendium as a WebSocket server')
  .option('-p, --port <port>', 'Port to listen on', '3030')
  .option('-t, --token <token>', 'Authentication token (auto-generated if not provided)')
  .option('-H, --host <host>', 'Host to bind to', '0.0.0.0')
  .option('-m, --model <model>', 'Model to use')
  .option('-u, --url <url>', 'Ollama server URL')
  .action(async (options) => {
    try {
      const config = await loadConfig();

      if (options.model) config.model = options.model;
      if (options.url) config.ollamaUrl = options.url;

      const client = new OllamaClient(config.ollamaUrl, config.model);

      const spinner = ora('Connecting to Ollama...').start();
      const connected = await client.checkConnection();

      if (!connected) {
        spinner.fail();
        console.log(formatError(`Cannot connect to Ollama at ${config.ollamaUrl}`));
        console.log(formatInfo('Make sure Ollama is running: ollama serve'));
        process.exit(1);
      }

      spinner.succeed('Connected to Ollama');

      const models = await client.listModels();
      if (!models.includes(config.model)) {
        console.log(formatError(`Model "${config.model}" not found`));
        console.log(formatInfo(`Available models: ${models.join(', ')}`));
        process.exit(1);
      }

      const token = options.token || generateToken();
      const port = parseInt(options.port, 10);

      const server = new CompendiumServer(client, config, {
        port,
        token,
        host: options.host,
      });

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\nShutting down...');
        await server.stop();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        await server.stop();
        process.exit(0);
      });

      await server.start();

      console.log(chalk.cyan('\nServer is running. Press Ctrl+C to stop.'));
      console.log(chalk.gray(`Connect with: compendium connect ${options.host === '0.0.0.0' ? 'localhost' : options.host}:${port} --token ${token}`));
    } catch (error) {
      console.error(formatError(`Fatal error: ${error}`));
      process.exit(1);
    }
  });

// Connect command (remote client)
program
  .command('connect <server>')
  .description('Connect to a remote Compendium server')
  .option('-t, --token <token>', 'Authentication token', '')
  .action(async (server, options) => {
    try {
      if (!options.token) {
        console.log(formatError('Authentication token is required'));
        console.log(formatInfo('Use: compendium connect <server> --token <token>'));
        process.exit(1);
      }

      const client = new RemoteClient(server, options.token);
      await client.connect();
      await client.run();
    } catch (error) {
      console.error(formatError(`Fatal error: ${error}`));
      process.exit(1);
    }
  });

// Daemon command
program
  .command('daemon')
  .description('Run as an agent daemon that connects to a server')
  .requiredOption('-s, --server <url>', 'Server URL to connect to')
  .requiredOption('-t, --token <token>', 'Authentication token')
  .requiredOption('-n, --name <name>', 'Machine name for identification')
  .option('-c, --capabilities <tools>', 'Comma-separated list of tool capabilities', 'read,write,edit,bash,glob,grep')
  .action(async (options) => {
    try {
      const capabilities = options.capabilities.split(',').map((c: string) => c.trim());

      const daemon = new CompendiumDaemon({
        serverUrl: options.server,
        token: options.token,
        name: options.name,
        capabilities,
      });

      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log('\nShutting down daemon...');
        daemon.disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', () => {
        daemon.disconnect();
        process.exit(0);
      });

      await daemon.connect();

      console.log(chalk.cyan('\nDaemon is running. Press Ctrl+C to stop.'));
    } catch (error) {
      console.error(formatError(`Fatal error: ${error}`));
      process.exit(1);
    }
  });

program.parse();
