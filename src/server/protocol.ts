// Client -> Server messages
export interface ChatMessage {
  type: 'chat';
  id: string;
  content: string;
}

export interface CommandMessage {
  type: 'command';
  id: string;
  command: string;
  args?: string[];
}

export type ClientMessage = ChatMessage | CommandMessage;

// Server -> Client messages
export interface StreamMessage {
  type: 'stream';
  id: string;
  delta: string;
}

export interface ToolCallMessage {
  type: 'tool_call';
  id: string;
  tool: string;
  params: unknown;
}

export interface ToolResultMessage {
  type: 'tool_result';
  id: string;
  tool: string;
  result: string;
}

export interface CompleteMessage {
  type: 'complete';
  id: string;
  content?: string;
}

export interface ErrorMessage {
  type: 'error';
  id: string;
  message: string;
}

export interface SystemMessage {
  type: 'system';
  event: 'connected' | 'disconnected' | 'model_changed' | 'history_cleared' | 'models_list';
  data?: unknown;
}

export type ServerMessage =
  | StreamMessage
  | ToolCallMessage
  | ToolResultMessage
  | CompleteMessage
  | ErrorMessage
  | SystemMessage;

// Daemon -> Server messages
export interface DaemonRegisterMessage {
  type: 'register';
  name: string;
  capabilities: string[];
}

export interface DaemonResultMessage {
  type: 'result';
  id: string;
  output: string;
}

export interface DaemonErrorMessage {
  type: 'daemon_error';
  id: string;
  message: string;
}

export type DaemonMessage = DaemonRegisterMessage | DaemonResultMessage | DaemonErrorMessage;

// Server -> Daemon messages
export interface ExecuteMessage {
  type: 'execute';
  id: string;
  tool: string;
  params: unknown;
}

export type ServerToDaemonMessage = ExecuteMessage;

// Parsing helpers
export function parseClientMessage(data: string): ClientMessage | null {
  try {
    const msg = JSON.parse(data);
    if (msg.type === 'chat' || msg.type === 'command') {
      return msg as ClientMessage;
    }
    return null;
  } catch {
    return null;
  }
}

export function parseDaemonMessage(data: string): DaemonMessage | null {
  try {
    const msg = JSON.parse(data);
    if (msg.type === 'register' || msg.type === 'result' || msg.type === 'daemon_error') {
      return msg as DaemonMessage;
    }
    return null;
  } catch {
    return null;
  }
}

export function serializeMessage(msg: ServerMessage | ServerToDaemonMessage): string {
  return JSON.stringify(msg);
}
