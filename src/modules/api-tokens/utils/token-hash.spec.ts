import { generateApiToken, hashApiToken, tokenPrefix } from './token-hash';

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

  it('tokenPrefix shows start and end of token', () => {
    expect(tokenPrefix('ff_abcdef1234567890')).toBe('ff_abcde…7890');
    expect(tokenPrefix('short')).toBe('short');
  });
});
