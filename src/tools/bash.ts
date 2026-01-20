import { exec } from 'child_process';
import { Tool } from './index.js';

export interface BashParams {
  command: string;
  timeout?: number;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_OUTPUT_LENGTH = 50000;

export const bashTool: Tool = {
  name: 'bash',
  description: 'Execute a shell command and return the output',

  async execute(params: unknown): Promise<string> {
    const { command, timeout = DEFAULT_TIMEOUT } = params as BashParams;

    if (!command) {
      return 'Error: command is required';
    }

    return new Promise((resolve) => {
      const child = exec(
        command,
        {
          timeout,
          maxBuffer: 10 * 1024 * 1024, // 10MB
          cwd: process.cwd(),
          env: process.env,
        },
        (error, stdout, stderr) => {
          let output = '';

          if (stdout) {
            output += stdout;
          }

          if (stderr) {
            if (output) output += '\n';
            output += `stderr:\n${stderr}`;
          }

          if (error) {
            if (error.killed) {
              output = `Command timed out after ${timeout}ms\n${output}`;
            } else if (error.code !== undefined) {
              output = `Exit code: ${error.code}\n${output}`;
            } else {
              output = `Error: ${error.message}\n${output}`;
            }
          }

          // Truncate if too long
          if (output.length > MAX_OUTPUT_LENGTH) {
            output = output.substring(0, MAX_OUTPUT_LENGTH) + '\n...[output truncated]';
          }

          resolve(output || 'Command completed with no output');
        }
      );

      // Handle the case where spawn itself fails
      child.on('error', (err) => {
        resolve(`Failed to execute command: ${err.message}`);
      });
    });
  },
};
