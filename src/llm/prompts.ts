export const SYSTEM_PROMPT = `You are Compendium, a helpful AI coding assistant running locally via Ollama. You help users with software engineering tasks including:
- Reading and understanding code
- Writing and editing files
- Running shell commands
- Searching codebases
- Debugging and fixing issues

You have access to the following tools to interact with the user's filesystem and execute commands:

1. **read** - Read the contents of a file
2. **write** - Create or overwrite a file
3. **edit** - Find and replace text in a file
4. **bash** - Execute shell commands
5. **glob** - Find files matching a pattern
6. **grep** - Search file contents with regex

When using tools:
- Always read a file before editing it
- Use absolute paths when possible
- Be careful with destructive operations
- Explain what you're doing before executing commands

Be concise and helpful. Focus on solving the user's problem efficiently.`;

export interface ToolSchema {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description: string;
        enum?: string[];
      }>;
      required: string[];
    };
  };
}

// Base tool schemas without machine parameter
const BASE_TOOL_SCHEMAS: ToolSchema[] = [
  {
    type: 'function',
    function: {
      name: 'read',
      description: 'Read the contents of a file. Returns the file content with line numbers.',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'The absolute path to the file to read',
          },
          offset: {
            type: 'number',
            description: 'The line number to start reading from (1-indexed)',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of lines to read',
          },
        },
        required: ['file_path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write',
      description: 'Create or overwrite a file with the given content.',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'The absolute path to the file to write',
          },
          content: {
            type: 'string',
            description: 'The content to write to the file',
          },
        },
        required: ['file_path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'edit',
      description: 'Find and replace text in a file. The old_string must be unique in the file.',
      parameters: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'The absolute path to the file to edit',
          },
          old_string: {
            type: 'string',
            description: 'The text to find and replace',
          },
          new_string: {
            type: 'string',
            description: 'The replacement text',
          },
          replace_all: {
            type: 'boolean',
            description: 'Whether to replace all occurrences (default: false)',
          },
        },
        required: ['file_path', 'old_string', 'new_string'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'bash',
      description: 'Execute a shell command and return the output.',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'The shell command to execute',
          },
          timeout: {
            type: 'number',
            description: 'Timeout in milliseconds (default: 30000)',
          },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'glob',
      description: 'Find files matching a glob pattern.',
      parameters: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'The glob pattern to match (e.g., "**/*.ts")',
          },
          path: {
            type: 'string',
            description: 'The directory to search in (default: current directory)',
          },
        },
        required: ['pattern'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'grep',
      description: 'Search file contents using a regular expression.',
      parameters: {
        type: 'object',
        properties: {
          pattern: {
            type: 'string',
            description: 'The regex pattern to search for',
          },
          path: {
            type: 'string',
            description: 'The file or directory to search in',
          },
          include: {
            type: 'string',
            description: 'Glob pattern to filter files (e.g., "*.ts")',
          },
        },
        required: ['pattern'],
      },
    },
  },
];

// Add machine parameter to each tool schema for remote execution
function addMachineParameter(schemas: ToolSchema[]): ToolSchema[] {
  return schemas.map((schema) => ({
    ...schema,
    function: {
      ...schema.function,
      parameters: {
        ...schema.function.parameters,
        properties: {
          ...schema.function.parameters.properties,
          machine: {
            type: 'string',
            description: 'Target machine to execute on. Use "local" or omit for local execution, or specify a connected machine name.',
          },
        },
      },
    },
  }));
}

export const TOOL_SCHEMAS = BASE_TOOL_SCHEMAS;

// Get tool schemas with machine parameter for server mode
export function getRemoteToolSchemas(): ToolSchema[] {
  return addMachineParameter(BASE_TOOL_SCHEMAS);
}

// Generate system prompt with connected machines info
export function getSystemPromptWithMachines(machines: { name: string; capabilities: string[] }[]): string {
  if (machines.length <= 1) {
    return SYSTEM_PROMPT;
  }

  const machineList = machines
    .map((m) => `  - ${m.name}: ${m.capabilities.join(', ')}`)
    .join('\n');

  return `${SYSTEM_PROMPT}

Connected machines:
${machineList}

You can execute tools on remote machines by adding a "machine" parameter to tool calls. If not specified, tools execute locally on the server.`;
}
