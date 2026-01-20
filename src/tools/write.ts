import * as fs from 'fs/promises';
import * as path from 'path';
import { Tool } from './index.js';

export interface WriteParams {
  file_path: string;
  content: string;
}

export const writeTool: Tool = {
  name: 'write',
  description: 'Create or overwrite a file with the given content',

  async execute(params: unknown): Promise<string> {
    const { file_path, content } = params as WriteParams;

    if (!file_path) {
      return 'Error: file_path is required';
    }

    if (content === undefined) {
      return 'Error: content is required';
    }

    const absolutePath = path.isAbsolute(file_path)
      ? file_path
      : path.resolve(process.cwd(), file_path);

    try {
      // Ensure parent directory exists
      const dir = path.dirname(absolutePath);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(absolutePath, content, 'utf-8');

      const lines = content.split('\n').length;
      const bytes = Buffer.byteLength(content, 'utf-8');

      return `File written successfully: ${absolutePath} (${lines} lines, ${bytes} bytes)`;
    } catch (error) {
      return `Error writing file: ${error}`;
    }
  },
};
