import WebSocket from 'ws';
import chalk from 'chalk';
import { EventEmitter } from 'events';
import { LocalExecutor } from './executor.js';
import { sendRegistration } from './registration.js';
import {
  ExecuteMessage,
  DaemonResultMessage,
  DaemonErrorMessage,
} from '../server/protocol.js';

export interface DaemonConfig {
  serverUrl: string;
  token: string;
  name: string;
  capabilities: string[];
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class CompendiumDaemon extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: DaemonConfig;
  private executor: LocalExecutor;
  private reconnectAttempts: number = 0;
  private shouldReconnect: boolean = true;
  private isConnecting: boolean = false;

  constructor(config: DaemonConfig) {
    super();
    this.config = {
      reconnect: true,
      reconnectInterval: 5000,
      maxReconnectAttempts: -1, // Infinite by default
      ...config,
    };
    this.executor = new LocalExecutor(config.capabilities);
  }

  private buildUrl(): string {
    let url = this.config.serverUrl;

    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      url = `ws://${url}`;
    }

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${encodeURIComponent(this.config.token)}`;
  }

  async connect(): Promise<void> {
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.shouldReconnect = true;

    return new Promise((resolve, reject) => {
      const wsUrl = this.buildUrl();

      console.log(chalk.gray(`Connecting to ${this.config.serverUrl}...`));

      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;

        console.log(chalk.green(`Connected to server`));
        console.log(chalk.gray(`Registering as "${this.config.name}" with capabilities: ${this.config.capabilities.join(', ')}`));

        // Register with server
        sendRegistration(this.ws!, {
          name: this.config.name,
          capabilities: this.config.capabilities,
        });

        this.emit('connected');
        resolve();
      });

      this.ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleMessage(message);
        } catch (error) {
          console.error(chalk.red('Failed to parse message:'), error);
        }
      });

      this.ws.on('close', () => {
        this.isConnecting = false;
        console.log(chalk.yellow('Disconnected from server'));
        this.emit('disconnected');

        if (this.shouldReconnect && this.config.reconnect) {
          this.attemptReconnect();
        }
      });

      this.ws.on('error', (error) => {
        this.isConnecting = false;

        if (this.reconnectAttempts === 0) {
          console.error(chalk.red('Connection error:'), error.message);
          reject(error);
        } else {
          this.emit('error', error);
        }
      });
    });
  }

  private attemptReconnect(): void {
    const maxAttempts = this.config.maxReconnectAttempts || -1;
    if (maxAttempts !== -1 && this.reconnectAttempts >= maxAttempts) {
      console.log(chalk.red('Max reconnection attempts reached'));
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    console.log(chalk.yellow(`Reconnecting in ${this.config.reconnectInterval! / 1000}s... (attempt ${this.reconnectAttempts})`));

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect().catch(() => {
          // Error handling is done in connect()
        });
      }
    }, this.config.reconnectInterval);
  }

  private async handleMessage(message: unknown): Promise<void> {
    const msg = message as { type: string };

    switch (msg.type) {
      case 'system':
        const sysMsg = message as { type: 'system'; event: string; data?: unknown };
        if (sysMsg.event === 'connected') {
          const data = sysMsg.data as { registered?: boolean };
          if (data?.registered) {
            console.log(chalk.green(`Registered successfully as "${this.config.name}"`));
          }
        }
        break;

      case 'execute':
        await this.handleExecute(message as ExecuteMessage);
        break;

      default:
        console.log(chalk.gray(`Received unknown message type: ${msg.type}`));
    }
  }

  private async handleExecute(message: ExecuteMessage): Promise<void> {
    console.log(chalk.cyan(`Executing ${message.tool}...`));

    const result = await this.executor.execute(message.tool, message.params);

    if (result.success) {
      console.log(chalk.green(`Completed ${message.tool}`));
      this.sendResult(message.id, result.output);
    } else {
      console.log(chalk.red(`Failed ${message.tool}: ${result.error}`));
      this.sendError(message.id, result.error || 'Unknown error');
    }
  }

  private sendResult(id: string, output: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: DaemonResultMessage = {
        type: 'result',
        id,
        output,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  private sendError(id: string, errorMessage: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message: DaemonErrorMessage = {
        type: 'daemon_error',
        id,
        message: errorMessage,
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    this.shouldReconnect = false;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getName(): string {
    return this.config.name;
  }

  getCapabilities(): string[] {
    return this.executor.getCapabilities();
  }
}
