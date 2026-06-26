import { encryptApiToken, decryptApiToken } from './token-crypto';

describe('token-crypto', () => {
  const originalSecret = process.env.JWT_SECRET;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-jwt-secret';
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalSecret;
  });

  it('encrypts and decrypts api token', () => {
    const plain = 'ff_test_secret_token';
    const encrypted = encryptApiToken(plain);

    expect(encrypted).not.toBe(plain);
    expect(decryptApiToken(encrypted)).toBe(plain);
  });
});
