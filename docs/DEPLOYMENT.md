# Deployment

Target: free-tier **Vercel** (client) + **Railway** (server + Postgres), or swap Railway's Postgres for **Supabase**. Same env vars either way.

## 1. Database

**Option A — Railway Postgres**: add a Postgres plugin to your Railway project, copy its `DATABASE_URL`.

**Option B — Supabase**: create a project, grab the connection string from Settings → Database (use the pooled connection string on port 6543 for serverless-friendly connections, or the direct 5432 string if your host supports long-lived connections).

Either way, run migrations against it once from your machine:

```bash
DATABASE_URL="<production-url>" npm run db:migrate --workspace=server
```

Do **not** run `db:seed` against production — it truncates every table (see `drizzle/seed.ts`'s `NODE_ENV=production` guard, which will refuse to run, but don't rely on that as your only safeguard).

## 2. Server (Railway)

1. New Railway project → deploy from your GitHub repo, root directory `server/` (or configure a monorepo build that runs `npm install && npm run build --workspace=server` from the repo root and starts `server/dist/index.js`).
2. Build command: `npm install && npm run build --workspace=server`
3. Start command: `node server/dist/index.js`
4. Set environment variables (see table below).
5. Note the deployed URL (e.g. `https://lumiere-api.up.railway.app`) — you'll need it for the client's `VITE_API_URL` and for the Stripe webhook endpoint.

### Server environment variables

| Variable | Where it comes from |
|---|---|
| `NODE_ENV` | `production` |
| `PORT` | Railway sets this automatically; `env.ts` respects `process.env.PORT` |
| `DATABASE_URL` | Railway Postgres plugin or Supabase connection string |
| `JWT_SECRET` / `REFRESH_TOKEN_SECRET` | `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` — generate two different values |
| `CLIENT_URL` | Your deployed Vercel URL (used for CORS) |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys (use the **live** key only once you're ready to take real payments; `sk_test_...` otherwise) |
| `STRIPE_WEBHOOK_SECRET` | See step 4 below |
| `RESEND_API_KEY` | Resend Dashboard → API Keys |
| `EMAIL_FROM` | An address on a domain you've verified in Resend (Resend rejects sends from unverified domains) |

## 3. Client (Vercel)

1. Import the repo into Vercel. Set the project root to `client/`.
2. Build command: `npm run build` (runs `tsc && vite build` per `client/package.json`)
3. Output directory: `dist`
4. Vercel auto-detects Vite; if routes 404 on refresh, add a rewrite so all paths fall back to `index.html` (`client/vercel.json`, already included in this repo):
   ```json
   { "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
   ```
5. Environment variables:

| Variable | Value |
|---|---|
| `VITE_API_URL` | Your Railway server URL |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → API keys → **publishable** key (safe to expose client-side) |

## 4. Stripe webhook

The booking-confirmation flow depends on Stripe calling your server, not the other way around — set this up before testing payments end-to-end.

1. Stripe Dashboard → Developers → Webhooks → **Add endpoint**.
2. Endpoint URL: `https://<your-railway-domain>/api/webhooks/stripe`
3. Events to send: `payment_intent.succeeded` (that's the only one the handler in `server/src/webhooks/stripe.webhook.ts` currently acts on).
4. Copy the **Signing secret** (`whsec_...`) into the server's `STRIPE_WEBHOOK_SECRET`.

**Local testing**: install the Stripe CLI and run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` — it prints a `whsec_...` value to put in `server/.env` for local dev.

## 5. Resend

1. Add and verify a sending domain in the Resend dashboard (SPF/DKIM records at your DNS provider) — sends from unverified domains are rejected or land in spam.
2. Set `EMAIL_FROM` to an address on that domain, e.g. `Lumiere Stays <bookings@yourdomain.com>`.
3. Until a domain is verified, Resend's sandbox `onboarding@resend.dev` sender works for testing but only delivers to the account owner's own email.

## 6. CI

`.github/workflows/ci.yml` runs on every push/PR: spins up a throwaway Postgres service container, installs dependencies, type-checks both workspaces, runs migrations against it, and runs the full vitest suite (pure unit tests plus integration tests that hit that real database — see `docs/ARCHITECTURE.md`). No secrets are needed; the `DATABASE_URL`/`JWT_SECRET`/`REFRESH_TOKEN_SECRET` values in the workflow are CI-only placeholders scoped to that ephemeral container. Add a deploy step of your own once you're pointing at real Vercel/Railway projects (both platforms also offer git-push auto-deploy, which may be simpler than wiring deploys through Actions).

## Post-deploy checklist

- [ ] `GET /health` on the server returns `{"status":"ok"}`
- [ ] Signup/login works end-to-end from the deployed client
- [ ] `rooms.checkAvailability` and `bookings.create` succeed against production Postgres
- [ ] A test Stripe payment (test-mode card `4242 4242 4242 4242`) flips the booking to `confirmed` and triggers the confirmation email
- [ ] CORS: confirm `CLIENT_URL` on the server exactly matches the deployed client origin (scheme + host, no trailing slash)
