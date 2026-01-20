import * as fs from 'fs/promises';
import * as path from 'path';
import { Tool } from './index.js';

export interface ReadParams {
  file_path: string;
  offset?: number;
  limit?: number;
}

export const readTool: Tool = {
  name: 'read',
  description: 'Read the contents of a file with line numbers',

  async execute(params: unknown): Promise<string> {
    const { file_path, offset = 1, limit = 2000 } = params as ReadParams;

    if (!file_path) {
      return 'Error: file_path is required';
    }

    const absolutePath = path.isAbsolute(file_path)
      ? file_path
      : path.resolve(process.cwd(), file_path);

    try {
      const content = await fs.readFile(absolutePath, 'utf-8');
      const lines = content.split('\n');

      const startLine = Math.max(1, offset);
      const endLine = Math.min(lines.length, startLine + limit - 1);

      const numberedLines = lines
        .slice(startLine - 1, endLine)
        .map((line, index) => {
          const lineNum = startLine + index;
          const padding = String(endLine).length;
          return `${String(lineNum).padStart(padding)}\t${line}`;
        });

      const result = numberedLines.join('\n');

      if (lines.length > endLine) {
        return `${result}\n\n[... ${lines.length - endLine} more lines]`;
      }

      return result;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return `Error: File not found: ${absolutePath}`;
      }
      if ((error as NodeJS.ErrnoException).code === 'EISDIR') {
        return `Error: Path is a directory, not a file: ${absolutePath}`;
      }
      return `Error reading file: ${error}`;
    }
  },
};
