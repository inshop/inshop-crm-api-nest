import { createHash, randomBytes } from 'node:crypto';

export function generateApiToken(): string {
  return `ff_${randomBytes(32).toString('hex')}`;
}

export function hashApiToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
