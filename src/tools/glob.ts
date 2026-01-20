import { glob } from 'glob';
import * as path from 'path';
import { Tool } from './index.js';

export interface GlobParams {
  pattern: string;
  path?: string;
}

const MAX_RESULTS = 1000;

export const globTool: Tool = {
  name: 'glob',
  description: 'Find files matching a glob pattern',

  async execute(params: unknown): Promise<string> {
    const { pattern, path: searchPath } = params as GlobParams;

    if (!pattern) {
      return 'Error: pattern is required';
    }

    const cwd = searchPath
      ? path.isAbsolute(searchPath)
        ? searchPath
        : path.resolve(process.cwd(), searchPath)
      : process.cwd();

    try {
      const files = await glob(pattern, {
        cwd,
        nodir: false,
        ignore: ['**/node_modules/**', '**/.git/**'],
        absolute: true,
      });

      if (files.length === 0) {
        return `No files found matching pattern: ${pattern}`;
      }

      const sortedFiles = files.sort();
      const truncated = sortedFiles.length > MAX_RESULTS;
      const displayFiles = truncated
        ? sortedFiles.slice(0, MAX_RESULTS)
        : sortedFiles;

      let result = displayFiles.join('\n');

      if (truncated) {
        result += `\n\n[... ${sortedFiles.length - MAX_RESULTS} more files]`;
      }

      return `Found ${files.length} file(s):\n${result}`;
    } catch (error) {
      return `Error searching files: ${error}`;
    }
  },
};
