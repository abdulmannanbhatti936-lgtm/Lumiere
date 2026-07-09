import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import jwt from 'jsonwebtoken';
import { verifyAccessToken as verifyAccessTokenShared, type AccessTokenPayload } from '@lumiere/services-shared';
import { env } from '../env';

const ACCESS_TOKEN_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '7d';

// Only Identity ever loads the private key. Every other service verifies
// with just the public key via @lumiere/services-shared's verifyAccessToken.
const privateKey = readFileSync(resolve(process.cwd(), env.JWT_PRIVATE_KEY_PATH), 'utf-8');
const publicKey = readFileSync(resolve(process.cwd(), env.JWT_PUBLIC_KEY_PATH), 'utf-8');

export interface RefreshTokenPayload {
  sub: number;
  sessionId: number;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, privateKey, { algorithm: 'RS256', expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return verifyAccessTokenShared(token, publicKey);
}

// Refresh tokens never leave Identity, so HMAC (not RS256) is sufficient —
// no other service ever needs to verify one.
export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.REFRESH_TOKEN_SECRET) as unknown as RefreshTokenPayload;
}

export const REFRESH_TOKEN_COOKIE = 'lumiere_refresh_token';
export const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
