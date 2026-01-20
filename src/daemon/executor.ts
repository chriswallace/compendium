import { executeTool } from '../tools/index.js';

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
}

export class LocalExecutor {
  private capabilities: string[];

  constructor(capabilities: string[]) {
    this.capabilities = capabilities;
  }

  canExecute(tool: string): boolean {
    return this.capabilities.includes(tool);
  }

  getCapabilities(): string[] {
    return [...this.capabilities];
  }

  async execute(tool: string, params: unknown): Promise<ExecutionResult> {
    if (!this.canExecute(tool)) {
      return {
        success: false,
        output: '',
        error: `Tool "${tool}" is not in the allowed capabilities`,
      };
    }

    try {
      const output = await executeTool(tool, params);

      // Check if the output indicates an error from the tool itself
      if (output.startsWith('Error:') || output.startsWith('Error executing')) {
        return {
          success: false,
          output,
          error: output,
        };
      }

      return {
        success: true,
        output,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        success: false,
        output: '',
        error: errorMessage,
      };
    }
  }
}
