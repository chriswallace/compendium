import { OllamaClient, Message, ToolCall } from '../llm/client.js';
import { executeTool } from '../tools/index.js';
import { Config } from '../utils/config.js';
import {
  loadConversation,
  saveConversation,
  clearConversation,
} from '../history/store.js';

export interface ToolCallEvent {
  toolName: string;
  params: unknown;
  machine?: string;
}

export interface ToolResultEvent {
  toolName: string;
  result: string;
  machine?: string;
}

export interface AgentEvents {
  onStreamStart?: () => void;
  onStreamChunk?: (chunk: string) => void;
  onStreamEnd?: (fullResponse: string) => void;
  onToolCall?: (event: ToolCallEvent) => void;
  onToolResult?: (event: ToolResultEvent) => void;
  onError?: (error: Error) => void;
}

export interface StreamEvent {
  type: 'chunk' | 'tool_call' | 'tool_result' | 'complete';
  data: unknown;
}

// Custom tool executor function type for routing
export type ToolExecutor = (tool: string, params: unknown, machine?: string) => Promise<string>;

export class AgentCore {
  private client: OllamaClient;
  private config: Config;
  private messages: Message[] = [];
  private events: AgentEvents;
  private toolExecutor: ToolExecutor;

  constructor(
    client: OllamaClient,
    config: Config,
    events: AgentEvents = {},
    toolExecutor?: ToolExecutor
  ) {
    this.client = client;
    this.config = config;
    this.events = events;
    this.toolExecutor = toolExecutor || this.defaultToolExecutor.bind(this);
  }

  private async defaultToolExecutor(tool: string, params: unknown): Promise<string> {
    return executeTool(tool, params);
  }

  setToolExecutor(executor: ToolExecutor): void {
    this.toolExecutor = executor;
  }

  async initialize(): Promise<number> {
    if (this.config.historyEnabled) {
      this.messages = await loadConversation();
    }
    return this.messages.length;
  }

  getMessages(): Message[] {
    return [...this.messages];
  }

  getClient(): OllamaClient {
    return this.client;
  }

  getConfig(): Config {
    return this.config;
  }

  async clearHistory(): Promise<void> {
    this.messages = [];
    await clearConversation();
  }

  setModel(model: string): void {
    this.client.setModel(model);
  }

  getModel(): string {
    return this.client.getModel();
  }

  async listModels(): Promise<string[]> {
    return this.client.listModels();
  }

  private async handleToolCall(toolCall: ToolCall): Promise<string> {
    let params: Record<string, unknown>;
    try {
      params = JSON.parse(toolCall.function.arguments);
    } catch {
      params = {};
    }

    // Extract machine parameter if present
    const machine = params.machine as string | undefined;
    delete params.machine;

    this.events.onToolCall?.({
      toolName: toolCall.function.name,
      params,
      machine,
    });

    const result = await this.toolExecutor(toolCall.function.name, params, machine);

    this.events.onToolResult?.({
      toolName: toolCall.function.name,
      result,
      machine,
    });

    return result;
  }

  async processMessage(input: string): Promise<string> {
    this.messages.push({ role: 'user', content: input });

    this.events.onStreamStart?.();

    try {
      let fullResponse = '';

      for await (const chunk of this.client.chatStream(
        this.messages,
        this.handleToolCall.bind(this)
      )) {
        this.events.onStreamChunk?.(chunk);
        fullResponse += chunk;
      }

      this.events.onStreamEnd?.(fullResponse);

      if (fullResponse) {
        this.messages.push({ role: 'assistant', content: fullResponse });
      }

      if (this.config.historyEnabled) {
        await saveConversation(this.messages);
      }

      return fullResponse;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.events.onError?.(err);
      throw err;
    }
  }

  // For streaming responses with callback-based events (for remote clients)
  async streamMessage(
    input: string,
    onEvent: (event: StreamEvent) => void
  ): Promise<void> {
    this.messages.push({ role: 'user', content: input });

    let fullResponse = '';

    const toolCallHandler = async (toolCall: ToolCall): Promise<string> => {
      let params: Record<string, unknown>;
      try {
        params = JSON.parse(toolCall.function.arguments);
      } catch {
        params = {};
      }

      const machine = params.machine as string | undefined;
      delete params.machine;

      onEvent({
        type: 'tool_call',
        data: { toolName: toolCall.function.name, params, machine },
      });

      const result = await this.toolExecutor(toolCall.function.name, params, machine);

      onEvent({
        type: 'tool_result',
        data: { toolName: toolCall.function.name, result, machine },
      });

      return result;
    };

    for await (const chunk of this.client.chatStream(this.messages, toolCallHandler)) {
      onEvent({ type: 'chunk', data: chunk });
      fullResponse += chunk;
    }

    if (fullResponse) {
      this.messages.push({ role: 'assistant', content: fullResponse });
    }

    if (this.config.historyEnabled) {
      await saveConversation(this.messages);
    }

    onEvent({ type: 'complete', data: fullResponse });
  }
}
