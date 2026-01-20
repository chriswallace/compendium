import chalk from 'chalk';

export function formatError(message: string): string {
  return chalk.red(`✗ ${message}`);
}

export function formatSuccess(message: string): string {
  return chalk.green(`✓ ${message}`);
}

export function formatInfo(message: string): string {
  return chalk.blue(`ℹ ${message}`);
}

export function formatWarning(message: string): string {
  return chalk.yellow(`⚠ ${message}`);
}

export function formatCode(code: string, language?: string): string {
  return chalk.gray('```' + (language || '') + '\n') +
         chalk.white(code) +
         chalk.gray('\n```');
}

export function formatToolCall(toolName: string, params: unknown): string {
  return chalk.cyan(`⚙ Calling ${toolName}`) +
         chalk.gray(` with ${JSON.stringify(params, null, 2)}`);
}

export function formatToolResult(result: string): string {
  const truncated = result.length > 500
    ? result.substring(0, 500) + '...[truncated]'
    : result;
  return chalk.gray(`Result: ${truncated}`);
}

export function formatAssistant(message: string): string {
  return chalk.white(message);
}

export function formatUser(message: string): string {
  return chalk.green(`> ${message}`);
}

export function formatHeader(title: string): string {
  const line = '─'.repeat(Math.max(0, process.stdout.columns - 4 || 76));
  return chalk.cyan(`┌${line}┐\n│ ${title.padEnd(line.length - 1)}│\n└${line}┘`);
}

export function formatDivider(): string {
  const width = process.stdout.columns || 80;
  return chalk.gray('─'.repeat(width));
}

export function clearLine(): void {
  process.stdout.write('\r\x1b[K');
}

export function moveCursorUp(lines: number = 1): void {
  process.stdout.write(`\x1b[${lines}A`);
}

export function formatModelInfo(model: string, url: string): string {
  return chalk.gray(`Model: ${chalk.cyan(model)} | Ollama: ${chalk.cyan(url)}`);
}
