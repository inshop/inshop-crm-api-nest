import { generateApiToken, hashApiToken } from './token-hash';

describe('token-hash', () => {
  it('generateApiToken returns ff_ prefixed token', () => {
    const token = generateApiToken();
    expect(token.startsWith('ff_')).toBe(true);
    expect(token.length).toBeGreaterThan(10);
  });

  it('hashApiToken is deterministic', () => {
    const token = 'ff_test_token';
    expect(hashApiToken(token)).toBe(hashApiToken(token));
    expect(hashApiToken(token)).not.toBe(token);
  });
});
