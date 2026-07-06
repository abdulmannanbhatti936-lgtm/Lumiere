# Architecture

## Monorepo layout

```
client/          React 19 + Vite SPA
  src/
    pages/            route-level components
    components/       shared UI, 3D, booking, review components
    contexts/          AuthContext, ThemeContext
    hooks/             useAuth, useDebouncedValue, useMobile
    lib/               trpc client, stripe client, utils

server/          Express + tRPC API
  src/
    routers/           one file per tRPC router (auth, hotels, bookings, ...)
    middleware/        cors, rate limiting, error handling
    webhooks/          Stripe webhook (raw-body Express route, not tRPC)
    utils/             jwt, password hashing, email, stripe, availability
    trpc.ts            tRPC init, context, protected/admin procedure builders
    db.ts              Drizzle client
    env.ts             Zod-validated environment config

drizzle/         schema.ts, drizzle.config.ts, migrate.ts, seed.ts
shared/          Zod validation schemas imported by both client and server
```

Both `client` and `server` are npm workspaces (root `package.json`). `shared/` and `drizzle/` are plain directories referenced via relative imports (`../../../shared/validation`) and via the `@shared/*` Vite/tsconfig alias on the client side.

## Auth flow

1. **Signup/login** (`auth.signup` / `auth.login`) — password hashed with bcrypt (12 rounds). On success, the server:
   - Signs a short-lived (24h) JWT **access token** containing `{ sub, email, role }`.
   - Creates a `sessions` row, signs a longer-lived (7d) JWT **refresh token** containing `{ sub, sessionId }`, and stores a SHA-256 hash of it in that row.
   - Sets the refresh token as an httpOnly, `sameSite=lax` cookie (`secure` in production).
   - Returns the access token in the response body only — the client keeps it in memory (`client/src/lib/trpc.ts`), never localStorage.
2. **Every request** — the tRPC client attaches `Authorization: Bearer <accessToken>` when present (`createTRPCClient` in `trpc.ts`). `createContext` (`server/src/trpc.ts`) verifies it and attaches the decoded payload to `ctx.user`.
3. **Silent restore on page load** — `AuthContext` calls `auth.refresh` on mount. The browser sends the httpOnly cookie automatically; if the session is still valid, the server rotates it (revokes the old session, issues a new one) and returns a fresh access token. If it fails (no cookie / expired / revoked), the user is treated as logged out — no error surfaced.
4. **Login lockout** — every login attempt (success or failure) is recorded in `login_attempts`, keyed by email. Before checking the password, the server counts failed attempts in the last 15 minutes; 5 or more returns `TOO_MANY_REQUESTS` without touching the password hash.
5. **Logout** — revokes the session server-side and clears the cookie.

## Booking flow

1. Client checks `rooms.checkAvailability` before enabling "continue".
2. `bookings.create` runs inside a DB transaction: re-validates the room belongs to the hotel, recounts overlapping `pending`/`confirmed` bookings against `room.totalUnits`, computes `totalPrice = pricePerNight × nights` server-side (never trusts a client-supplied price), and inserts the booking as `pending`.
3. Client calls `payments.createPaymentIntent` with the new booking id. The server creates (or reuses) a Stripe PaymentIntent for `totalPrice` and returns its `client_secret`.
4. Client mounts Stripe Elements with that secret and confirms payment (`PaymentForm.tsx`).
5. Stripe calls `POST /api/webhooks/stripe` on `payment_intent.succeeded`. The handler verifies the signature, flips the booking to `confirmed`, and sends a confirmation email — this is the source of truth for payment success, not the client-side confirmation call, since the client can't be trusted and users can close the tab mid-flow.
6. Cancelling a booking (`bookings.cancel`) is only allowed by its owner or an admin, only while `pending`/`confirmed`, and sends a cancellation email.

## Availability model

Rooms have a `totalUnits` count (physical inventory), not a single boolean. A room is available for a date range if the number of `pending`/`confirmed` bookings that overlap that range is less than `totalUnits`. Overlap is the standard interval check: `existing.checkIn < newCheckOut AND existing.checkOut > newCheckIn`. `cancelled` bookings never block.

## Why tRPC + Zod

Input schemas in `shared/validation.ts` are the single source of truth for both the server's runtime validation and the client's form validation (`react-hook-form` + `zodResolver`), so a rule like the password complexity regex or the "checkOut must be after checkIn" refinement only exists once.

## Reviews moderation

Reviews are tied to a specific `bookingId` (not just a hotel), so a review always maps to a `confirmed`/`completed` stay the reviewer actually owns. New reviews start `approved: false` and are excluded from public `reviews.listByHotel` / `hotels.getById` results until an admin approves them via `reviews.approve`.
