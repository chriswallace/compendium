import WebSocket from 'ws';
import { DaemonRegisterMessage } from '../server/protocol.js';

export interface RegistrationConfig {
  name: string;
  capabilities: string[];
}

export function createRegistrationMessage(config: RegistrationConfig): DaemonRegisterMessage {
  return {
    type: 'register',
    name: config.name,
    capabilities: config.capabilities,
  };
}

export function sendRegistration(ws: WebSocket, config: RegistrationConfig): void {
  const message = createRegistrationMessage(config);
  ws.send(JSON.stringify(message));
}
