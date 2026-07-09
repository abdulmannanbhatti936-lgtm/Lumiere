import jwt from 'jsonwebtoken';

/**
 * Every service except Identity only ever holds the RS256 *public* key and
 * verifies access tokens locally/statelessly — no synchronous call to
 * Identity is needed per request. Only Identity holds the private key and
 * can mint tokens (see identity/src/utils/jwt.ts).
 */
export interface AccessTokenPayload {
  sub: number;
  email: string;
  role: 'user' | 'admin';
}

export function verifyAccessToken(token: string, publicKey: string): AccessTokenPayload {
  return jwt.verify(token, publicKey, { algorithms: ['RS256'] }) as unknown as AccessTokenPayload;
}
