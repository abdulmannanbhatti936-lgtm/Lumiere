import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db';
import { createTestCaller } from '../test-utils';

describe('auth.login lockout (integration, real DB)', () => {
  const email = `lockout-test-${Date.now()}@example.com`;
  const correctPassword = 'Str0ng!Pass1';

  beforeAll(async () => {
    const caller = createTestCaller();
    await caller.auth.signup({ email, password: correctPassword, name: 'Lockout Tester' });
  });

  afterAll(async () => {
    await db.delete(schema.loginAttempts).where(eq(schema.loginAttempts.email, email));
    await db.delete(schema.users).where(eq(schema.users.email, email));
  });

  it('rejects the correct password after 5 failed attempts within the lockout window', async () => {
    for (let i = 0; i < 5; i += 1) {
      const caller = createTestCaller();
      await expect(caller.auth.login({ email, password: 'WrongPass1!' })).rejects.toThrow();
    }

    const caller = createTestCaller();
    await expect(caller.auth.login({ email, password: correctPassword })).rejects.toThrow(
      /too many failed attempts/i,
    );
  });
});
