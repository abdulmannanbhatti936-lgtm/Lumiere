# API Reference

All procedures are served over tRPC at `POST/GET /api/trpc/<router>.<procedure>`. This is a reference for what exists, not a wire-format tutorial — use the tRPC client (`client/src/lib/trpc.ts`) rather than calling these URLs directly.

**Auth**: `protected` procedures require an `Authorization: Bearer <accessToken>` header. `admin` procedures additionally require `role: 'admin'` on the authenticated user. `public` procedures require nothing.

## auth

| Procedure  | Type     | Access    | Input                              | Notes |
|------------|----------|-----------|-------------------------------------|-------|
| `signup`   | mutation | public    | `{ email, password, name }`         | Creates user, issues session, sends welcome email |
| `login`    | mutation | public    | `{ email, password }`               | Locks out after 5 failed attempts / 15 min per email |
| `refresh`  | mutation | public    | *(reads refresh cookie)*            | Rotates the refresh token and session |
| `logout`   | mutation | public    | *(reads refresh cookie)*            | Revokes the session, clears cookie |
| `me`       | query    | protected | —                                    | Returns the current user |

## destinations

| Procedure   | Type     | Access | Input |
|-------------|----------|--------|-------|
| `list`      | query    | public | `{ featuredOnly? }` |
| `getById`   | query    | public | `{ id }` |
| `create`    | mutation | admin  | destination fields |
| `update`    | mutation | admin  | `{ id, ...partial fields }` |
| `remove`    | mutation | admin  | `{ id }` |

## hotels

| Procedure    | Type     | Access | Input |
|--------------|----------|--------|-------|
| `list`       | query    | public | `{ search?, city?, destinationId?, minPrice?, maxPrice?, minStars?, sortBy, page, limit }` — returns `{ items, pagination }` with per-hotel `averageRating`/`reviewCount` |
| `getById`    | query    | public | `{ id }` — includes `destination`, `rooms`, approved `reviews` (with reviewer name) |
| `getBySlug`  | query    | public | `{ slug }` |
| `create`     | mutation | admin  | hotel fields |
| `update`     | mutation | admin  | `{ id, ...partial fields }` |
| `remove`     | mutation | admin  | `{ id }` |

## rooms

| Procedure           | Type     | Access | Input |
|---------------------|----------|--------|-------|
| `listByHotel`       | query    | public | `{ hotelId }` |
| `getById`           | query    | public | `{ id }` |
| `checkAvailability` | query    | public | `{ roomId, checkIn, checkOut }` (YYYY-MM-DD) — returns `{ available }` |
| `create`            | mutation | admin  | room fields |
| `update`            | mutation | admin  | `{ id, ...partial fields }` |
| `remove`            | mutation | admin  | `{ id }` |

## bookings

| Procedure      | Type     | Access    | Input | Notes |
|----------------|----------|-----------|-------|-------|
| `create`       | mutation | protected | `{ hotelId, roomId, checkIn, checkOut, guests, guestName?, guestEmail?, guestPhone?, specialRequests? }` | Transactional; rejects if the room's `totalUnits` is already fully booked for an overlapping date range. Guest fields default to the caller's profile. Status starts `pending`. |
| `listMine`     | query    | protected | — | Current user's bookings, with hotel + room |
| `getById`      | query    | protected | `{ id }` | Owner or admin only |
| `cancel`       | mutation | protected | `{ id }` | Owner or admin; sends a cancellation email |
| `adminList`    | query    | admin     | `{ page?, limit? }` | All bookings |
| `updateStatus` | mutation | admin     | `{ id, status }` | `pending \| confirmed \| cancelled \| completed` |

## reviews

| Procedure          | Type     | Access    | Input | Notes |
|--------------------|----------|-----------|-------|-------|
| `listByHotel`      | query    | public    | `{ hotelId }` | Approved reviews only |
| `create`           | mutation | protected | `{ hotelId, bookingId, rating, comment? }` | `bookingId` must belong to the caller, match the hotel, and be `confirmed`/`completed`. One review per booking. Starts unapproved. |
| `adminListPending` | query    | admin     | — | Moderation queue |
| `approve`          | mutation | admin     | `{ id }` | |
| `remove`           | mutation | admin     | `{ id }` | |

## users

| Procedure        | Type     | Access    | Input |
|-------------------|----------|-----------|-------|
| `updateProfile`  | mutation | protected | `{ name?, phone? }` |
| `changePassword` | mutation | protected | `{ currentPassword, newPassword }` |

## admin

| Procedure    | Type  | Access | Notes |
|--------------|-------|--------|-------|
| `stats`      | query | admin  | `{ totalUsers, totalHotels, totalBookings, totalRevenue, pendingReviews }` — revenue sums `confirmed`/`completed` bookings |
| `listUsers`  | query | admin  | `{ page?, limit? }` — password hashes never leave the server |

## payments

| Procedure             | Type     | Access    | Input | Notes |
|------------------------|----------|-----------|-------|-------|
| `createPaymentIntent`  | mutation | protected | `{ bookingId }` | Booking must belong to the caller and be `pending`. Returns `{ clientSecret }` for Stripe Elements. Idempotent — re-calling with the same booking reuses the existing PaymentIntent. |

## Webhooks (plain Express, not tRPC)

| Route                       | Purpose |
|------------------------------|---------|
| `POST /api/webhooks/stripe`  | Verifies the `stripe-signature` header against `STRIPE_WEBHOOK_SECRET`. On `payment_intent.succeeded`, marks the matching booking `confirmed` and sends a booking-confirmation email. |

## Error shape

tRPC errors follow the standard shape: `{ error: { message, code, data: { code, httpStatus, stack? } } }`. `stack` is omitted when `NODE_ENV=production`. Plain Express errors (404s, malformed JSON, uncaught exceptions) return `{ success: false, error, message, code }`.
