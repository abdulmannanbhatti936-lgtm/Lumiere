import { describe, expect, it } from 'vitest';
import { hashToken } from './crypto';

describe('hashToken', () => {
  it('is deterministic for the same input', () => {
    expect(hashToken('same-token')).toBe(hashToken('same-token'));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
  });

  it('never returns the raw input', () => {
    expect(hashToken('super-secret-refresh-token')).not.toBe('super-secret-refresh-token');
  });
});
