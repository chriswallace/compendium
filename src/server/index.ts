import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { IncomingMessage } from 'http';
import { OllamaClient } from '../llm/client.js';
import { AgentCore } from '../core/agent.js';
import { Config, updateConfig } from '../utils/config.js';
import { TokenAuth, generateToken } from './auth.js';
import { getRemoteToolSchemas, getSystemPromptWithMachines } from '../llm/prompts.js';
import {
  ClientMessage,
  ServerMessage,
  DaemonMessage,
  parseClientMessage,
  parseDaemonMessage,
  serializeMessage,
} from './protocol.js';
import { ToolRouter } from './router.js';

export interface ServerConfig {
  port: number;
  token: string;
  host?: string;
}

interface ClientSession {
  id: string;
  ws: WebSocket;
  type: 'client' | 'daemon';
  name?: string;
  capabilities?: string[];
}

export class CompendiumServer {
  private wss: WebSocketServer | null = null;
  private agent: AgentCore;
  private client: OllamaClient;
  private auth: TokenAuth;
  private config: Config;
  private serverConfig: ServerConfig;
  private sessions: Map<string, ClientSession> = new Map();
  private router: ToolRouter;

  constructor(
    client: OllamaClient,
    config: Config,
    serverConfig: ServerConfig
  ) {
    this.config = config;
    this.client = client;
    this.serverConfig = serverConfig;
    this.auth = new TokenAuth({ token: serverConfig.token });
    this.router = new ToolRouter();

    // Use remote tool schemas for server mode
    client.setToolSchemas(getRemoteToolSchemas());

    this.agent = new AgentCore(
      client,
      config,
      {
        onToolCall: (event) => {
          // Tool calls are handled via protocol messages
        },
        onToolResult: (event) => {
          // Tool results are handled via protocol messages
        },
      },
      // Use router for tool execution
      (tool, params, machine) => this.router.executeOnMachine(machine || 'local', tool, params)
    );
  }

  private updateSystemPrompt(): void {
    const machines = this.router.getAvailableMachines();
    const prompt = getSystemPromptWithMachines(machines);
    this.client.setSystemPrompt(prompt);
  }

  async start(): Promise<void> {
    await this.agent.initialize();

    this.wss = new WebSocketServer({
      port: this.serverConfig.port,
      host: this.serverConfig.host || '0.0.0.0',
      verifyClient: (info, callback) => {
        const isValid = this.auth.validateRequest(info.req);
        callback(isValid, isValid ? undefined : 401, isValid ? undefined : 'Unauthorized');
      },
    });

    this.wss.on('connection', (ws, request) => {
      this.handleConnection(ws, request);
    });

    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });

    console.log(`Compendium server listening on ${this.serverConfig.host || '0.0.0.0'}:${this.serverConfig.port}`);
    console.log(`Token: ${this.serverConfig.token}`);
  }

  private handleConnection(ws: WebSocket, request: IncomingMessage): void {
    const sessionId = uuidv4();
    const session: ClientSession = {
      id: sessionId,
      ws,
      type: 'client', // Will be updated if daemon registers
    };
    this.sessions.set(sessionId, session);

    console.log(`New connection: ${sessionId}`);

    this.send(ws, {
      type: 'system',
      event: 'connected',
      data: {
        sessionId,
        model: this.agent.getModel(),
        machines: this.router.getAvailableMachines(),
      },
    });

    ws.on('message', async (data) => {
      const message = data.toString();
      await this.handleMessage(session, message);
    });

    ws.on('close', () => {
      console.log(`Connection closed: ${sessionId}`);
      if (session.type === 'daemon' && session.name) {
        this.router.unregisterDaemon(session.name);
        this.updateSystemPrompt();
        // Notify clients about machine change
        this.broadcastToClients({
          type: 'system',
          event: 'connected',
          data: { machines: this.router.getAvailableMachines() },
        });
      }
      this.sessions.delete(sessionId);
    });

    ws.on('error', (error) => {
      console.error(`WebSocket error for ${sessionId}:`, error);
    });
  }

  private async handleMessage(session: ClientSession, data: string): Promise<void> {
    // Try parsing as daemon message first
    const daemonMsg = parseDaemonMessage(data);
    if (daemonMsg) {
      await this.handleDaemonMessage(session, daemonMsg);
      return;
    }

    // Try parsing as client message
    const clientMsg = parseClientMessage(data);
    if (clientMsg) {
      await this.handleClientMessage(session, clientMsg);
      return;
    }

    this.send(session.ws, {
      type: 'error',
      id: 'unknown',
      message: 'Invalid message format',
    });
  }

  private async handleDaemonMessage(session: ClientSession, msg: DaemonMessage): Promise<void> {
    switch (msg.type) {
      case 'register':
        session.type = 'daemon';
        session.name = msg.name;
        session.capabilities = msg.capabilities;
        this.router.registerDaemon(msg.name, session.ws, msg.capabilities);
        this.updateSystemPrompt();
        console.log(`Daemon registered: ${msg.name} with capabilities: ${msg.capabilities.join(', ')}`);
        this.send(session.ws, {
          type: 'system',
          event: 'connected',
          data: { registered: true, name: msg.name },
        });
        // Broadcast to all clients about new machine
        this.broadcastToClients({
          type: 'system',
          event: 'connected',
          data: { machines: this.router.getAvailableMachines() },
        });
        break;

      case 'result':
        this.router.handleResult(msg.id, msg.output);
        break;

      case 'daemon_error':
        this.router.handleError(msg.id, msg.message);
        break;
    }
  }

  private async handleClientMessage(session: ClientSession, msg: ClientMessage): Promise<void> {
    switch (msg.type) {
      case 'chat':
        await this.handleChat(session, msg.id, msg.content);
        break;

      case 'command':
        await this.handleCommand(session, msg.id, msg.command, msg.args);
        break;
    }
  }

  private async handleChat(session: ClientSession, id: string, content: string): Promise<void> {
    try {
      await this.agent.streamMessage(content, (event) => {
        switch (event.type) {
          case 'chunk':
            this.send(session.ws, {
              type: 'stream',
              id,
              delta: event.data as string,
            });
            break;

          case 'tool_call':
            const toolData = event.data as { toolName: string; params: unknown; machine?: string };
            this.send(session.ws, {
              type: 'tool_call',
              id,
              tool: toolData.toolName,
              params: { ...toolData.params as object, machine: toolData.machine },
            });
            break;

          case 'tool_result':
            const resultData = event.data as { toolName: string; result: string; machine?: string };
            this.send(session.ws, {
              type: 'tool_result',
              id,
              tool: resultData.toolName,
              result: resultData.result,
            });
            break;

          case 'complete':
            this.send(session.ws, {
              type: 'complete',
              id,
              content: event.data as string,
            });
            break;
        }
      });
    } catch (error) {
      this.send(session.ws, {
        type: 'error',
        id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async handleCommand(
    session: ClientSession,
    id: string,
    command: string,
    args?: string[]
  ): Promise<void> {
    try {
      switch (command) {
        case 'clear':
          await this.agent.clearHistory();
          this.send(session.ws, {
            type: 'system',
            event: 'history_cleared',
          });
          break;

        case 'model':
          if (args && args.length > 0) {
            const newModel = args.join(' ');
            this.agent.setModel(newModel);
            await updateConfig({ model: newModel });
            this.send(session.ws, {
              type: 'system',
              event: 'model_changed',
              data: { model: newModel },
            });
          } else {
            this.send(session.ws, {
              type: 'system',
              event: 'model_changed',
              data: { model: this.agent.getModel() },
            });
          }
          break;

        case 'models':
          const models = await this.agent.listModels();
          this.send(session.ws, {
            type: 'system',
            event: 'models_list',
            data: { models, current: this.agent.getModel() },
          });
          break;

        case 'machines':
          this.send(session.ws, {
            type: 'system',
            event: 'connected',
            data: { machines: this.router.getAvailableMachines() },
          });
          break;

        default:
          this.send(session.ws, {
            type: 'error',
            id,
            message: `Unknown command: ${command}`,
          });
      }
    } catch (error) {
      this.send(session.ws, {
        type: 'error',
        id,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private send(ws: WebSocket, msg: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(serializeMessage(msg));
    }
  }

  private broadcastToClients(msg: ServerMessage): void {
    for (const session of this.sessions.values()) {
      if (session.type === 'client') {
        this.send(session.ws, msg);
      }
    }
  }

  getRouter(): ToolRouter {
    return this.router;
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close(() => {
          console.log('Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

export { generateToken };
