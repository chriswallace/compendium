import { WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { serializeMessage, ServerToDaemonMessage } from './protocol.js';
import { executeTool } from '../tools/index.js';

interface DaemonConnection {
  name: string;
  ws: WebSocket;
  capabilities: string[];
}

interface PendingRequest {
  resolve: (result: string) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

export class ToolRouter {
  private daemons: Map<string, DaemonConnection> = new Map();
  private pendingRequests: Map<string, PendingRequest> = new Map();
  private defaultTimeout: number = 60000; // 1 minute

  registerDaemon(name: string, ws: WebSocket, capabilities: string[]): void {
    this.daemons.set(name, { name, ws, capabilities });
  }

  unregisterDaemon(name: string): void {
    this.daemons.delete(name);
  }

  getAvailableMachines(): { name: string; capabilities: string[] }[] {
    const machines: { name: string; capabilities: string[] }[] = [
      { name: 'local', capabilities: ['read', 'write', 'edit', 'bash', 'glob', 'grep'] },
    ];

    for (const daemon of this.daemons.values()) {
      machines.push({
        name: daemon.name,
        capabilities: daemon.capabilities,
      });
    }

    return machines;
  }

  getDaemon(name: string): DaemonConnection | undefined {
    return this.daemons.get(name);
  }

  async executeOnMachine(
    machine: string,
    tool: string,
    params: unknown
  ): Promise<string> {
    // Local execution
    if (machine === 'local' || !machine) {
      return executeTool(tool, params);
    }

    // Remote execution
    const daemon = this.daemons.get(machine);
    if (!daemon) {
      throw new Error(`Machine "${machine}" not connected`);
    }

    if (!daemon.capabilities.includes(tool)) {
      throw new Error(`Machine "${machine}" does not support tool "${tool}"`);
    }

    return this.sendToDaemon(daemon, tool, params);
  }

  private sendToDaemon(
    daemon: DaemonConnection,
    tool: string,
    params: unknown
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const requestId = uuidv4();

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request to ${daemon.name} timed out`));
      }, this.defaultTimeout);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });

      const message: ServerToDaemonMessage = {
        type: 'execute',
        id: requestId,
        tool,
        params,
      };

      if (daemon.ws.readyState === WebSocket.OPEN) {
        daemon.ws.send(serializeMessage(message as any));
      } else {
        clearTimeout(timeout);
        this.pendingRequests.delete(requestId);
        reject(new Error(`Daemon ${daemon.name} is not connected`));
      }
    });
  }

  handleResult(requestId: string, output: string): void {
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(requestId);
      pending.resolve(output);
    }
  }

  handleError(requestId: string, message: string): void {
    const pending = this.pendingRequests.get(requestId);
    if (pending) {
      clearTimeout(pending.timeout);
      this.pendingRequests.delete(requestId);
      pending.reject(new Error(message));
    }
  }

  // Generate system prompt addition for available machines
  getMachinePromptAddition(): string {
    const machines = this.getAvailableMachines();
    if (machines.length <= 1) {
      return '';
    }

    const machineList = machines
      .map((m) => `  - ${m.name}: ${m.capabilities.join(', ')}`)
      .join('\n');

    return `\n\nConnected machines:\n${machineList}\n\nYou can execute tools on remote machines by adding a "machine" parameter to tool calls. If not specified, tools execute locally.`;
  }
}
