import WebSocket from 'ws';
import { EventEmitter } from 'events';
import {
  ClientMessage,
  ServerMessage,
} from '../server/protocol.js';

export interface ConnectionConfig {
  url: string;
  token: string;
  reconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class WebSocketConnection extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: ConnectionConfig;
  private reconnectAttempts: number = 0;
  private isConnecting: boolean = false;
  private shouldReconnect: boolean = true;

  constructor(config: ConnectionConfig) {
    super();
    this.config = {
      reconnect: true,
      reconnectInterval: 3000,
      maxReconnectAttempts: 10,
      ...config,
    };
  }

  async connect(): Promise<void> {
    if (this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    this.shouldReconnect = true;

    return new Promise((resolve, reject) => {
      const wsUrl = this.buildUrl();

      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected');
        resolve();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString()) as ServerMessage;
          this.emit('message', message);
        } catch (error) {
          this.emit('error', new Error('Failed to parse message'));
        }
      });

      this.ws.on('close', () => {
        this.isConnecting = false;
        this.emit('disconnected');

        if (this.shouldReconnect && this.config.reconnect) {
          this.attemptReconnect();
        }
      });

      this.ws.on('error', (error) => {
        this.isConnecting = false;
        this.emit('error', error);

        if (this.reconnectAttempts === 0) {
          reject(error);
        }
      });
    });
  }

  private buildUrl(): string {
    let url = this.config.url;

    // Add ws:// protocol if not present
    if (!url.startsWith('ws://') && !url.startsWith('wss://')) {
      url = `ws://${url}`;
    }

    // Add token as query parameter
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}token=${encodeURIComponent(this.config.token)}`;
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 10)) {
      this.emit('reconnect_failed');
      return;
    }

    this.reconnectAttempts++;
    this.emit('reconnecting', this.reconnectAttempts);

    setTimeout(() => {
      if (this.shouldReconnect) {
        this.connect().catch(() => {
          // Error will trigger another reconnect attempt
        });
      }
    }, this.config.reconnectInterval);
  }

  send(message: ClientMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      throw new Error('Not connected');
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
}
