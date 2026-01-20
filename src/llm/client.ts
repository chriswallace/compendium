import { SYSTEM_PROMPT, TOOL_SCHEMAS, ToolSchema } from './prompts.js';

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ChatResponse {
  model: string;
  message: Message;
  done: boolean;
  done_reason?: string;
}

export interface StreamChunk {
  model: string;
  message: {
    role: string;
    content: string;
    tool_calls?: ToolCall[];
  };
  done: boolean;
}

export class OllamaClient {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string, model: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.model = model;
  }

  setModel(model: string): void {
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.statusText}`);
      }
      const data = await response.json() as { models: Array<{ name: string }> };
      return data.models.map((m) => m.name);
    } catch (error) {
      throw new Error(`Failed to connect to Ollama: ${error}`);
    }
  }

  async *chatStream(
    messages: Message[],
    onToolCall?: (toolCall: ToolCall) => Promise<string>
  ): AsyncGenerator<string, void, unknown> {
    const fullMessages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ];

    while (true) {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: fullMessages,
          tools: TOOL_SCHEMAS,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';
      let toolCalls: ToolCall[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;

          try {
            const chunk = JSON.parse(line) as StreamChunk;

            if (chunk.message.content) {
              assistantContent += chunk.message.content;
              yield chunk.message.content;
            }

            if (chunk.message.tool_calls) {
              toolCalls = chunk.message.tool_calls;
            }

            if (chunk.done) {
              break;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      // Handle tool calls if any
      if (toolCalls.length > 0 && onToolCall) {
        fullMessages.push({
          role: 'assistant',
          content: assistantContent,
          tool_calls: toolCalls,
        });

        for (const toolCall of toolCalls) {
          const result = await onToolCall(toolCall);
          fullMessages.push({
            role: 'tool',
            content: result,
            tool_call_id: toolCall.id,
          });
        }

        // Continue the loop to get the next response
        continue;
      }

      // No more tool calls, we're done
      break;
    }
  }

  async chat(messages: Message[]): Promise<ChatResponse> {
    const fullMessages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...messages,
    ];

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: fullMessages,
        tools: TOOL_SCHEMAS,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    return response.json() as Promise<ChatResponse>;
  }
}
