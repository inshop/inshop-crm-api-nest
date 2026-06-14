import { hashPassword, isBcryptHash } from './password';

describe('password utils', () => {
  describe('isBcryptHash', () => {
    it('returns true for bcrypt hashes', () => {
      const hash = hashPassword('secret');
      expect(isBcryptHash(hash)).toBe(true);
    });

    it('returns false for plain text', () => {
      expect(isBcryptHash('plain-password')).toBe(false);
    });
  });

  describe('hashPassword', () => {
    it('produces a valid bcrypt hash', () => {
      const hash = hashPassword('my-password');
      expect(isBcryptHash(hash)).toBe(true);
    });
  });
});
