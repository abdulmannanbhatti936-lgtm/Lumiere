import { z } from 'zod';

/**
 * One Zod schema per event on the `lumiere.events` topic exchange.
 * Routing key == event name. Publishers validate before publishing,
 * consumers validate on receipt — same discipline as shared/validation.ts
 * applies at the monolith's tRPC boundary.
 */

export const paymentSucceededEvent = z.object({
  bookingId: z.number().int().positive(),
  paymentIntentId: z.string().min(1),
  amount: z.number().nonnegative(),
  paidAt: z.string(),
});
export type PaymentSucceededEvent = z.infer<typeof paymentSucceededEvent>;

export const paymentFailedEvent = z.object({
  bookingId: z.number().int().positive(),
  paymentIntentId: z.string().min(1),
  reason: z.string(),
});
export type PaymentFailedEvent = z.infer<typeof paymentFailedEvent>;

export const paymentRefundedEvent = z.object({
  bookingId: z.number().int().positive(),
  refundId: z.string().min(1),
  amount: z.number().nonnegative(),
});
export type PaymentRefundedEvent = z.infer<typeof paymentRefundedEvent>;

export const bookingCancelledEvent = z.object({
  bookingId: z.number().int().positive(),
  previousStatus: z.string(),
});
export type BookingCancelledEvent = z.infer<typeof bookingCancelledEvent>;

export const bookingConfirmationFailedEvent = z.object({
  bookingId: z.number().int().positive(),
  paymentIntentId: z.string().min(1),
  reason: z.string(),
});
export type BookingConfirmationFailedEvent = z.infer<typeof bookingConfirmationFailedEvent>;

export const reviewApprovedEvent = z.object({
  reviewId: z.number().int().positive(),
  hotelId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
});
export type ReviewApprovedEvent = z.infer<typeof reviewApprovedEvent>;

export const reviewRetractedEvent = z.object({
  reviewId: z.number().int().positive(),
  hotelId: z.number().int().positive(),
  rating: z.number().int().min(1).max(5),
});
export type ReviewRetractedEvent = z.infer<typeof reviewRetractedEvent>;

export const userRegisteredEvent = z.object({
  userId: z.number().int().positive(),
  email: z.string().email(),
  name: z.string().min(1),
  registeredAt: z.string(),
});
export type UserRegisteredEvent = z.infer<typeof userRegisteredEvent>;

export const EVENT_SCHEMAS = {
  'payment.succeeded': paymentSucceededEvent,
  'payment.failed': paymentFailedEvent,
  'payment.refunded': paymentRefundedEvent,
  'booking.cancelled': bookingCancelledEvent,
  'booking.confirmation_failed': bookingConfirmationFailedEvent,
  'review.approved': reviewApprovedEvent,
  'review.retracted': reviewRetractedEvent,
  'user.registered': userRegisteredEvent,
} as const;

export type EventName = keyof typeof EVENT_SCHEMAS;
export type EventPayload<K extends EventName> = z.infer<(typeof EVENT_SCHEMAS)[K]>;
