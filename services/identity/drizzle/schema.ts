import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Identity's own database (identity_db) — only the tables Identity owns.
// Booking/hotel/review data stays in the monolith's database; those services
// reference users only by the numeric id carried in the JWT `sub` claim.

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 255 }),
  phone: varchar('phone', { length: 32 }),
  role: userRoleEnum('role').notNull().default('user'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
}));

// Refresh-token sessions (access tokens are stateless RS256 JWTs; this table
// backs the 7-day refresh flow and logout invalidation).
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  refreshTokenHash: text('refresh_token_hash').notNull(),
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 64 }),
  expiresAt: timestamp('expires_at').notNull(),
  revokedAt: timestamp('revoked_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userIdx: index('sessions_user_idx').on(table.userId),
}));

// Backs the 5-tries-then-15-minute-lockout login rule: count failed rows for
// an email within the window.
export const loginAttempts = pgTable('login_attempts', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  ipAddress: varchar('ip_address', { length: 64 }),
  success: boolean('success').notNull(),
  attemptedAt: timestamp('attempted_at').notNull().defaultNow(),
}, (table) => ({
  emailIdx: index('login_attempts_email_idx').on(table.email),
}));

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
