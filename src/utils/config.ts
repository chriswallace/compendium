import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

export interface Config {
  ollamaUrl: string;
  model: string;
  historyEnabled: boolean;
}

const DEFAULT_CONFIG: Config = {
  ollamaUrl: 'http://localhost:11434',
  model: 'qwen2.5-coder:14b',
  historyEnabled: true,
};

export function getConfigDir(): string {
  return path.join(os.homedir(), '.compendium');
}

export function getConfigPath(): string {
  return path.join(getConfigDir(), 'config.json');
}

export async function ensureConfigDir(): Promise<void> {
  const configDir = getConfigDir();
  try {
    await fs.mkdir(configDir, { recursive: true });
  } catch {
    // Directory already exists
  }
}

export async function loadConfig(): Promise<Config> {
  await ensureConfigDir();
  const configPath = getConfigPath();

  try {
    const content = await fs.readFile(configPath, 'utf-8');
    const userConfig = JSON.parse(content);
    return { ...DEFAULT_CONFIG, ...userConfig };
  } catch {
    // Config doesn't exist, create default
    await saveConfig(DEFAULT_CONFIG);
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(config: Config): Promise<void> {
  await ensureConfigDir();
  const configPath = getConfigPath();
  await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

export async function updateConfig(updates: Partial<Config>): Promise<Config> {
  const current = await loadConfig();
  const updated = { ...current, ...updates };
  await saveConfig(updated);
  return updated;
}
