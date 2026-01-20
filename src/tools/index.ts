import { readTool } from './read.js';
import { writeTool } from './write.js';
import { editTool } from './edit.js';
import { bashTool } from './bash.js';
import { globTool } from './glob.js';
import { grepTool } from './grep.js';

export interface Tool {
  name: string;
  description: string;
  execute(params: unknown): Promise<string>;
}

const tools: Map<string, Tool> = new Map([
  ['read', readTool],
  ['write', writeTool],
  ['edit', editTool],
  ['bash', bashTool],
  ['glob', globTool],
  ['grep', grepTool],
]);

export function getTool(name: string): Tool | undefined {
  return tools.get(name);
}

export function getAllTools(): Tool[] {
  return Array.from(tools.values());
}

export async function executeTool(
  name: string,
  params: unknown
): Promise<string> {
  const tool = getTool(name);

  if (!tool) {
    return `Error: Unknown tool: ${name}`;
  }

  try {
    return await tool.execute(params);
  } catch (error) {
    return `Error executing ${name}: ${error}`;
  }
}
