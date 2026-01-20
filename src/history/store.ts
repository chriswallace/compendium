import * as fs from 'fs/promises';
import * as path from 'path';
import { getConfigDir } from '../utils/config.js';
import { Message } from '../llm/client.js';

export interface ConversationEntry {
  timestamp: string;
  messages: Message[];
}

function getHistoryDir(): string {
  return path.join(getConfigDir(), 'history');
}

function getSessionPath(sessionId: string): string {
  return path.join(getHistoryDir(), `${sessionId}.json`);
}

function getCurrentSessionId(): string {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

export async function ensureHistoryDir(): Promise<void> {
  const historyDir = getHistoryDir();
  try {
    await fs.mkdir(historyDir, { recursive: true });
  } catch {
    // Directory already exists
  }
}

export async function loadConversation(sessionId?: string): Promise<Message[]> {
  await ensureHistoryDir();
  const id = sessionId || getCurrentSessionId();
  const sessionPath = getSessionPath(id);

  try {
    const content = await fs.readFile(sessionPath, 'utf-8');
    const entry = JSON.parse(content) as ConversationEntry;
    return entry.messages;
  } catch {
    return [];
  }
}

export async function saveConversation(
  messages: Message[],
  sessionId?: string
): Promise<void> {
  await ensureHistoryDir();
  const id = sessionId || getCurrentSessionId();
  const sessionPath = getSessionPath(id);

  const entry: ConversationEntry = {
    timestamp: new Date().toISOString(),
    messages,
  };

  await fs.writeFile(sessionPath, JSON.stringify(entry, null, 2), 'utf-8');
}

export async function clearConversation(sessionId?: string): Promise<void> {
  const id = sessionId || getCurrentSessionId();
  const sessionPath = getSessionPath(id);

  try {
    await fs.unlink(sessionPath);
  } catch {
    // File doesn't exist, that's fine
  }
}

export async function listSessions(): Promise<string[]> {
  await ensureHistoryDir();
  const historyDir = getHistoryDir();

  try {
    const files = await fs.readdir(historyDir);
    return files
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''))
      .sort()
      .reverse();
  } catch {
    return [];
  }
}

export async function appendMessage(message: Message): Promise<void> {
  const messages = await loadConversation();
  messages.push(message);
  await saveConversation(messages);
}
