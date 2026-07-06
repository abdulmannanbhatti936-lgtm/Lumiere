import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  numeric,
  boolean,
  timestamp,
  jsonb,
  date,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);
export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',
  'confirmed',
  'cancelled',
  'completed',
]);

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

export const destinations = pgTable('destinations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  country: varchar('country', { length: 255 }).notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  latitude: numeric('latitude', { precision: 9, scale: 6 }),
  longitude: numeric('longitude', { precision: 9, scale: 6 }),
  featured: boolean('featured').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const hotels = pgTable('hotels', {
  id: serial('id').primaryKey(),
  destinationId: integer('destination_id').references(() => destinations.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull(),
  city: varchar('city', { length: 255 }).notNull(),
  country: varchar('country', { length: 255 }).notNull(),
  description: text('description'),
  starRating: integer('star_rating').notNull().default(5),
  basePrice: numeric('base_price', { precision: 10, scale: 2 }).notNull(),
  imageUrl: text('image_url'),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  amenities: jsonb('amenities').$type<string[]>().notNull().default([]),
  latitude: numeric('latitude', { precision: 9, scale: 6 }),
  longitude: numeric('longitude', { precision: 9, scale: 6 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  slugIdx: uniqueIndex('hotels_slug_idx').on(table.slug),
  destinationIdx: index('hotels_destination_idx').on(table.destinationId),
}));

export const rooms = pgTable('rooms', {
  id: serial('id').primaryKey(),
  hotelId: integer('hotel_id').notNull().references(() => hotels.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  capacity: integer('capacity').notNull().default(2),
  pricePerNight: numeric('price_per_night', { precision: 10, scale: 2 }).notNull(),
  totalUnits: integer('total_units').notNull().default(1),
  imageUrl: text('image_url'),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  amenities: jsonb('amenities').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  hotelIdx: index('rooms_hotel_idx').on(table.hotelId),
}));

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  hotelId: integer('hotel_id').notNull().references(() => hotels.id, { onDelete: 'restrict' }),
  roomId: integer('room_id').notNull().references(() => rooms.id, { onDelete: 'restrict' }),
  checkIn: date('check_in', { mode: 'string' }).notNull(),
  checkOut: date('check_out', { mode: 'string' }).notNull(),
  guests: integer('guests').notNull().default(1),
  totalPrice: numeric('total_price', { precision: 10, scale: 2 }).notNull(),
  status: bookingStatusEnum('status').notNull().default('pending'),
  guestName: varchar('guest_name', { length: 255 }).notNull(),
  guestEmail: varchar('guest_email', { length: 255 }).notNull(),
  guestPhone: varchar('guest_phone', { length: 32 }),
  specialRequests: text('special_requests'),
  stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdx: index('bookings_user_idx').on(table.userId),
  hotelIdx: index('bookings_hotel_idx').on(table.hotelId),
  roomIdx: index('bookings_room_idx').on(table.roomId),
}));

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  hotelId: integer('hotel_id').notNull().references(() => hotels.id, { onDelete: 'cascade' }),
  bookingId: integer('booking_id').references(() => bookings.id, { onDelete: 'set null' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  approved: boolean('approved').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  hotelIdx: index('reviews_hotel_idx').on(table.hotelId),
  userIdx: index('reviews_user_idx').on(table.userId),
}));

// Refresh-token sessions (JWT access tokens are stateless; this table backs the 7-day refresh flow and logout invalidation)
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

// Backs the 5-tries-then-15-minute-lockout login rule: count failed rows for an email within the window.
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
  bookings: many(bookings),
  reviews: many(reviews),
  sessions: many(sessions),
}));

export const destinationsRelations = relations(destinations, ({ many }) => ({
  hotels: many(hotels),
}));

export const hotelsRelations = relations(hotels, ({ one, many }) => ({
  destination: one(destinations, { fields: [hotels.destinationId], references: [destinations.id] }),
  rooms: many(rooms),
  bookings: many(bookings),
  reviews: many(reviews),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  hotel: one(hotels, { fields: [rooms.hotelId], references: [hotels.id] }),
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  user: one(users, { fields: [bookings.userId], references: [users.id] }),
  hotel: one(hotels, { fields: [bookings.hotelId], references: [hotels.id] }),
  room: one(rooms, { fields: [bookings.roomId], references: [rooms.id] }),
  reviews: many(reviews),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, { fields: [reviews.userId], references: [users.id] }),
  hotel: one(hotels, { fields: [reviews.hotelId], references: [hotels.id] }),
  booking: one(bookings, { fields: [reviews.bookingId], references: [bookings.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Destination = typeof destinations.$inferSelect;
export type Hotel = typeof hotels.$inferSelect;
export type NewHotel = typeof hotels.$inferInsert;
export type Room = typeof rooms.$inferSelect;
export type NewRoom = typeof rooms.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type LoginAttempt = typeof loginAttempts.$inferSelect;
