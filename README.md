# Lumiere Stays

A full-stack luxury hotel booking platform with 3D property previews, real-time availability, Stripe payments, and email notifications.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Three.js / React Three Fiber, wouter, TanStack Query, tRPC client
- **Backend**: Express, tRPC v11, Drizzle ORM, PostgreSQL
- **Auth**: JWT access tokens + rotating httpOnly refresh-token cookies, bcrypt password hashing, 5-attempt/15-minute login lockout
- **Payments**: Stripe (PaymentIntents + webhooks)
- **Email**: Resend
- **Monorepo**: npm workspaces (`client`, `server`), shared Zod validation in `shared/`

## Project Structure

```
client/       React frontend (Vite)
server/       Express + tRPC backend
drizzle/      Database schema, migrations, seed script
shared/       Zod schemas shared by client and server
docs/         API, architecture, and deployment docs
```

## Prerequisites

- Node.js 20+
- Docker Desktop (for local Postgres)

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Copy env files and fill in secrets
cp server/.env.example server/.env
cp client/.env.example client/.env

# 3. Start local Postgres
npm run docker:up

# 4. Run migrations and seed demo data
npm run db:migrate
npm run db:seed

# 5. Start client + server together
npm run dev
```

- Frontend: http://localhost:5173
- Backend health check: http://localhost:3000/health
- tRPC endpoint: http://localhost:3000/api/trpc

Demo accounts (created by `npm run db:seed`):

| Role  | Email                       | Password    |
|-------|------------------------------|-------------|
| Admin | admin@lumierestays.com       | Admin123!   |
| User  | user@lumierestays.com        | User123!    |

## Scripts

| Command                 | Description                                    |
|--------------------------|-------------------------------------------------|
| `npm run dev`            | Run client + server concurrently                |
| `npm run dev:client`     | Run only the frontend                           |
| `npm run dev:server`     | Run only the backend                            |
| `npm run build`          | Build server then client for production         |
| `npm run type-check`     | Type-check both workspaces                      |
| `npm test`                | Run the vitest test suite                       |
| `npm run db:generate`    | Generate a new Drizzle migration from schema.ts |
| `npm run db:migrate`     | Apply pending migrations                        |
| `npm run db:seed`        | Reset and seed demo data (destructive, dev-only)|
| `npm run db:studio`      | Open Drizzle Studio                             |
| `npm run docker:up`      | Start the local Postgres container              |
| `npm run docker:down`    | Stop it                                          |

## Docs

- [API Reference](docs/API.md) — every tRPC procedure, its input, and auth requirements
- [Architecture](docs/ARCHITECTURE.md) — auth flow, booking flow, folder layout
- [Deployment](docs/DEPLOYMENT.md) — Vercel (client) + Railway (server + Postgres) + Stripe/Resend setup

## Payments & Email

Stripe and Resend are wired end-to-end (PaymentIntent creation, webhook-driven booking confirmation, transactional emails) but ship with placeholder keys in `.env.example`. Nothing will actually charge a card or send an email until you drop in real `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` / `RESEND_API_KEY` values — see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for how to obtain and wire them up.
