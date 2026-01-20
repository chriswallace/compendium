import { exec } from 'child_process';
import * as path from 'path';
import { Tool } from './index.js';

export interface GrepParams {
  pattern: string;
  path?: string;
  include?: string;
}

const MAX_OUTPUT_LENGTH = 50000;

export const grepTool: Tool = {
  name: 'grep',
  description: 'Search file contents using a regular expression',

  async execute(params: unknown): Promise<string> {
    const { pattern, path: searchPath, include } = params as GrepParams;

    if (!pattern) {
      return 'Error: pattern is required';
    }

    const cwd = searchPath
      ? path.isAbsolute(searchPath)
        ? searchPath
        : path.resolve(process.cwd(), searchPath)
      : process.cwd();

    // Build grep command with common exclusions
    let command = `grep -rn --color=never`;

    // Add include pattern if specified
    if (include) {
      command += ` --include="${include}"`;
    }

    // Exclude common directories
    command += ` --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist`;

    // Add pattern and path
    command += ` -e "${pattern.replace(/"/g, '\\"')}" "${cwd}"`;

    return new Promise((resolve) => {
      exec(
        command,
        {
          timeout: 30000,
          maxBuffer: 10 * 1024 * 1024,
          cwd: process.cwd(),
        },
        (error, stdout, stderr) => {
          if (error && !stdout) {
            // grep returns exit code 1 when no matches found
            if (error.code === 1) {
              resolve(`No matches found for pattern: ${pattern}`);
              return;
            }
            resolve(`Error searching: ${stderr || error.message}`);
            return;
          }

          let output = stdout.trim();

          if (!output) {
            resolve(`No matches found for pattern: ${pattern}`);
            return;
          }

          // Count matches
          const lines = output.split('\n');
          const matchCount = lines.length;

          // Truncate if too long
          if (output.length > MAX_OUTPUT_LENGTH) {
            output = output.substring(0, MAX_OUTPUT_LENGTH) + '\n...[output truncated]';
          }

          resolve(`Found ${matchCount} match(es):\n${output}`);
        }
      );
    });
  },
};
