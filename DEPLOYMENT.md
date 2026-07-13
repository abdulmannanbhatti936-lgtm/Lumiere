# Deploying Lumière Stays

Three pieces to host: the client (static build), the server (Node/Express), and Postgres.

## 1. Database

Any managed Postgres works (Neon, Supabase, Render Postgres, Railway). Free tiers are fine for a demo.

1. Create a Postgres instance, copy its connection string.
2. From the repo root, with `DATABASE_URL` in `server/.env` pointed at that connection string:
   ```
   npm run db:migrate   # creates all tables
   npm run db:seed      # optional — populates demo destinations/hotels/tours/users
   ```
3. SSL is handled automatically — `server/src/db.ts` and `drizzle/migrate.ts` both require TLS for any host that isn't `localhost`, no extra config needed.

## 2. Server (Express + tRPC)

Any Node host works (Render, Railway, Fly.io). Requires a persistent process, not a serverless function (it holds a Postgres connection pool and needs the raw-body Stripe webhook route).

- **Build:** `npm run build --workspace=server` → outputs `server/dist`
- **Start:** `node server/dist/index.js` (or `npm start --workspace=server`)
- **Required env vars** (see `server/.env.example` for the full list with comments):
  - `DATABASE_URL`, `JWT_SECRET`, `REFRESH_TOKEN_SECRET` — required, no defaults
  - `CLIENT_URL` — must exactly match the deployed client's origin (used for CORS + the refresh cookie)
  - `NODE_ENV=production`
  - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — required for checkout to work at all
  - `RESEND_API_KEY`, `EMAIL_FROM` — optional; without these, bookings still work, confirmation emails just silently fail (logged, not thrown)
  - `MISTRAL_API_KEY` — optional; without it the chat widget shows a "not configured" message instead of erroring
- **Stripe webhook:** in the Stripe Dashboard, add an endpoint at `https://<your-server-domain>/api/webhooks/stripe` listening for `payment_intent.succeeded`, and put its signing secret in `STRIPE_WEBHOOK_SECRET`. Without this, payments succeed on Stripe's side but bookings never flip from `pending` to `confirmed` in the database — this is not optional.

## 3. Client (Vite React SPA)

Static hosting (Vercel, Netlify, Cloudflare Pages).

- **Build:** `npm run build --workspace=client` → outputs `client/dist`
- **SPA rewrite:** already configured (`client/vercel.json` rewrites all paths to `index.html`, needed for wouter's client-side routing to survive a page refresh on e.g. `/hotels`). If deploying somewhere other than Vercel, add the equivalent (Netlify: `_redirects` file with `/* /index.html 200`).
- **Required env vars** (see `client/.env.example`):
  - `VITE_API_URL` — the deployed server's URL (e.g. `https://api.yourdomain.com`)
  - `VITE_STRIPE_PUBLISHABLE_KEY` — the *publishable* key matching the server's `STRIPE_SECRET_KEY` (same Stripe account, same mode)

## Verified working (test mode)

The full booking lifecycle was tested end-to-end against a real Stripe test account: create booking → Stripe Elements payment with a test card → webhook fires → booking flips to `confirmed` → cancel → refund issued on Stripe's side for the exact amount. All of this only requires switching `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `VITE_STRIPE_PUBLISHABLE_KEY` from test to live keys when you're ready for real payments — no code changes.

## Explicitly not done (deferred — not needed for a personal/demo deployment)

- **Email deliverability**: Resend is in sandbox mode and can currently only send to the account owner's own address. Real guests won't receive booking confirmation emails until a sending domain is verified at resend.com/domains.
- **Live payment account**: Stripe is in test mode. Switching to real payments means completing Stripe's account activation (business details, bank account) and swapping in live keys.
- **CI/CD**: no automated pipeline runs the test suite on push.
- **Error monitoring**: no Sentry/observability tooling — server errors currently only go to console/process logs.
- **Legal review**: the Privacy Policy and Terms pages are placeholder copy, not reviewed by a lawyer.
- **Database backups**: not configured — whichever managed Postgres you pick may offer this itself (check their plan).
