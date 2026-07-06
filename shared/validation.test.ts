import { describe, expect, it } from 'vitest';
import {
  bookingCreateSchema,
  hotelsQuerySchema,
  loginSchema,
  passwordSchema,
  signupSchema,
} from './validation';

describe('passwordSchema', () => {
  it('accepts a strong password', () => {
    expect(passwordSchema.safeParse('Str0ng!Pass').success).toBe(true);
  });

  it('accepts a password exactly at the 8-character minimum', () => {
    expect(passwordSchema.safeParse('short1!A').success).toBe(true);
  });

  it.each([
    ['short!A', 'too short (7 chars)'],
    ['alllowercase1!', 'missing uppercase'],
    ['NoNumbers!', 'missing number'],
    ['NoSpecialChar1', 'missing special character'],
  ])('rejects %s (%s)', (value) => {
    expect(passwordSchema.safeParse(value).success).toBe(false);
  });
});

describe('signupSchema', () => {
  it('rejects an invalid email', () => {
    const result = signupSchema.safeParse({ email: 'not-an-email', password: 'Str0ng!Pass', name: 'Jane' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty name', () => {
    const result = signupSchema.safeParse({ email: 'jane@example.com', password: 'Str0ng!Pass', name: '' });
    expect(result.success).toBe(false);
  });

  it('accepts valid signup input', () => {
    const result = signupSchema.safeParse({ email: 'jane@example.com', password: 'Str0ng!Pass', name: 'Jane' });
    expect(result.success).toBe(true);
  });
});

describe('loginSchema', () => {
  it('rejects an empty password', () => {
    expect(loginSchema.safeParse({ email: 'jane@example.com', password: '' }).success).toBe(false);
  });
});

describe('bookingCreateSchema', () => {
  const base = { hotelId: 1, roomId: 1, guests: 2 };

  it('rejects checkOut before checkIn', () => {
    const result = bookingCreateSchema.safeParse({ ...base, checkIn: '2026-08-10', checkOut: '2026-08-05' });
    expect(result.success).toBe(false);
  });

  it('rejects checkOut equal to checkIn', () => {
    const result = bookingCreateSchema.safeParse({ ...base, checkIn: '2026-08-10', checkOut: '2026-08-10' });
    expect(result.success).toBe(false);
  });

  it('accepts checkOut after checkIn', () => {
    const result = bookingCreateSchema.safeParse({ ...base, checkIn: '2026-08-10', checkOut: '2026-08-12' });
    expect(result.success).toBe(true);
  });

  it('rejects a malformed date string', () => {
    const result = bookingCreateSchema.safeParse({ ...base, checkIn: '08/10/2026', checkOut: '2026-08-12' });
    expect(result.success).toBe(false);
  });
});

describe('hotelsQuerySchema', () => {
  it('applies defaults when given an empty object', () => {
    const result = hotelsQuerySchema.parse({});
    expect(result).toMatchObject({ sortBy: 'newest', page: 1, limit: 12 });
  });

  it('coerces numeric query-string values', () => {
    const result = hotelsQuerySchema.parse({ minPrice: '100', maxPrice: '500', page: '2' });
    expect(result.minPrice).toBe(100);
    expect(result.maxPrice).toBe(500);
    expect(result.page).toBe(2);
  });

  it('rejects a limit above the max', () => {
    expect(hotelsQuerySchema.safeParse({ limit: 500 }).success).toBe(false);
  });
});
