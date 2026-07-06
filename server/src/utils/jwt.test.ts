import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from './jwt';

describe('access tokens', () => {
  it('round-trips the payload through sign and verify', () => {
    const token = signAccessToken({ sub: 42, email: 'jane@example.com', role: 'user' });
    const payload = verifyAccessToken(token);
    expect(payload).toMatchObject({ sub: 42, email: 'jane@example.com', role: 'user' });
  });

  it('throws when the token has been tampered with', () => {
    const token = signAccessToken({ sub: 42, email: 'jane@example.com', role: 'user' });
    const tampered = token.slice(0, -2) + (token.at(-2) === 'a' ? 'b' : 'a') + token.at(-1);
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('rejects a token signed with a different secret', () => {
    const foreignToken = jwt.sign({ sub: 1, email: 'x@example.com', role: 'user' }, 'wrong-secret');
    expect(() => verifyAccessToken(foreignToken)).toThrow();
  });
});

describe('refresh tokens', () => {
  it('round-trips the payload through sign and verify', () => {
    const token = signRefreshToken({ sub: 42, sessionId: 7 });
    const payload = verifyRefreshToken(token);
    expect(payload).toMatchObject({ sub: 42, sessionId: 7 });
  });
});
