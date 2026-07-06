import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './password';

describe('password hashing', () => {
  it('produces a hash different from the plaintext', async () => {
    const hash = await hashPassword('Str0ng!Pass');
    expect(hash).not.toBe('Str0ng!Pass');
  });

  it('verifies the correct password against its hash', async () => {
    const hash = await hashPassword('Str0ng!Pass');
    await expect(verifyPassword('Str0ng!Pass', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('Str0ng!Pass');
    await expect(verifyPassword('WrongPass1!', hash)).resolves.toBe(false);
  });

  it('salts hashes so the same password hashes differently each time', async () => {
    const [hashA, hashB] = await Promise.all([hashPassword('Str0ng!Pass'), hashPassword('Str0ng!Pass')]);
    expect(hashA).not.toBe(hashB);
  });
});
