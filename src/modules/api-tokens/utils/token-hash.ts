import { createHash, randomBytes } from 'node:crypto';

export function generateApiToken(): string {
  return `ff_${randomBytes(32).toString('hex')}`;
}

export function hashApiToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function tokenPrefix(token: string): string {
  if (token.length <= 12) {
    return token;
  }

  return `${token.slice(0, 8)}…${token.slice(-4)}`;
}
