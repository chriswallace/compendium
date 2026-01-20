import { IncomingMessage } from 'http';
import { URL } from 'url';

export interface AuthConfig {
  token: string;
  headerName?: string;
  queryParam?: string;
}

export class TokenAuth {
  private token: string;
  private headerName: string;
  private queryParam: string;

  constructor(config: AuthConfig) {
    this.token = config.token;
    this.headerName = config.headerName || 'x-auth-token';
    this.queryParam = config.queryParam || 'token';
  }

  validateRequest(request: IncomingMessage): boolean {
    // Check header first
    const headerToken = request.headers[this.headerName.toLowerCase()];
    if (headerToken === this.token) {
      return true;
    }

    // Check query parameter
    if (request.url) {
      try {
        const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
        const queryToken = url.searchParams.get(this.queryParam);
        if (queryToken === this.token) {
          return true;
        }
      } catch {
        // Invalid URL, ignore
      }
    }

    return false;
  }

  validateToken(token: string): boolean {
    return token === this.token;
  }
}

export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}
