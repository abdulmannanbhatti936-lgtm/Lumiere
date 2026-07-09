import { z } from 'zod';

/**
 * Identity owns user credentials, so the auth-relevant schemas live here in
 * the shared kernel rather than being imported from the monolith's
 * shared/validation.ts — that file stays monolith-only so Identity doesn't
 * reach across the service boundary it's being extracted from.
 */

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain an uppercase letter')
  .regex(/[0-9]/, 'Password must contain a number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain a special character');

export const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: passwordSchema,
  name: z.string().min(1, 'Name is required').max(255),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;
