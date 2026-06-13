import * as bcrypt from 'bcrypt';

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$\d{2}\$/;

export function isBcryptHash(value: string): boolean {
  return BCRYPT_HASH_PATTERN.test(value);
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}
