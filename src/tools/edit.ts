import * as fs from 'fs/promises';
import * as path from 'path';
import { Tool } from './index.js';

export interface EditParams {
  file_path: string;
  old_string: string;
  new_string: string;
  replace_all?: boolean;
}

export const editTool: Tool = {
  name: 'edit',
  description: 'Find and replace text in a file',

  async execute(params: unknown): Promise<string> {
    const { file_path, old_string, new_string, replace_all = false } = params as EditParams;

    if (!file_path) {
      return 'Error: file_path is required';
    }

    if (!old_string) {
      return 'Error: old_string is required';
    }

    if (new_string === undefined) {
      return 'Error: new_string is required';
    }

    if (old_string === new_string) {
      return 'Error: old_string and new_string must be different';
    }

    const absolutePath = path.isAbsolute(file_path)
      ? file_path
      : path.resolve(process.cwd(), file_path);

    try {
      const content = await fs.readFile(absolutePath, 'utf-8');

      // Count occurrences
      const occurrences = content.split(old_string).length - 1;

      if (occurrences === 0) {
        return `Error: old_string not found in file: ${absolutePath}`;
      }

      if (occurrences > 1 && !replace_all) {
        return `Error: old_string found ${occurrences} times. Use replace_all: true to replace all, or provide a more specific string.`;
      }

      let newContent: string;
      let replacements: number;

      if (replace_all) {
        newContent = content.split(old_string).join(new_string);
        replacements = occurrences;
      } else {
        newContent = content.replace(old_string, new_string);
        replacements = 1;
      }

      await fs.writeFile(absolutePath, newContent, 'utf-8');

      return `Successfully replaced ${replacements} occurrence(s) in ${absolutePath}`;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return `Error: File not found: ${absolutePath}`;
      }
      return `Error editing file: ${error}`;
    }
  },
};
