---
name: verify
description: Build/launch/drive recipe for verifying UI and API changes in the Lumiere Stays monorepo (client + server).
---

Recipe for driving this app end-to-end to verify a change, learned during a
cold start (no Playwright/Puppeteer installed, only system Chrome/Edge).

## Launch

```bash
npm run dev   # from repo root — concurrently starts server:3000 and client:5173
```

Needs Postgres reachable at the `DATABASE_URL` in `server/.env`
(`postgresql://lumiere:lumiere_dev_password@localhost:5433/lumiere_stays`).
Check it's up with `docker ps` — container is named `lumiere-postgres`. If not
running, there's a root `docker-compose.yml` for it. (A *separate* stack for
the `services/identity` microservice-in-progress runs on ports 5434/5672 via
`services/docker-compose.yml` — don't confuse the two.)

`npm run dev` backgrounds cleanly; the client is ready when
`curl http://localhost:5173/` returns 200 (Vite prints "ready in Nms").

## Seeding data for a specific view

`drizzle/seed.ts` seeds destinations/hotels/rooms/users but **not**
`bookings` or `reviews` (it truncates those tables but never inserts). If a
change needs review/booking data to render (e.g. testimonials), insert temp
rows directly via psql, verify, then delete them:

```bash
PGPASSWORD=lumiere_dev_password psql -h localhost -p 5433 -U lumiere -d lumiere_stays -c "..."
```

Avoid em dashes / non-ASCII punctuation in `-c` SQL strings passed through
Git Bash — it mangles the byte sequence and psql rejects it with an encoding
error. Plain ASCII only.

## Screenshotting (no Playwright installed)

Use `.claude/skills/verify/screenshot.cjs` — a dependency-free Node script
that drives system Chrome over the DevTools Protocol (Node 22+'s built-in
`fetch`/`WebSocket`, no npm install needed). It's `.cjs`, not `.js` —
this repo's root `package.json` has `"type": "module"`, and a plain `.js`
here gets parsed as ESM, breaking its `require()` calls.

```bash
node .claude/skills/verify/screenshot.cjs <url> <outPngPath> [waitMs] [clipY] [clipHeight] [hoverX] [hoverPageY]
```

- Omit `clipY`/`clipHeight` for a full-page screenshot.
- Pass `hoverX`/`hoverPageY` (page coordinates) to trigger a `:hover` state
  (e.g. the hotel-card flip) before capturing.
- For anything that needs a **click** first (e.g. HotelDetail's tabs are
  local React state, not a URL, so you can't just navigate to the Rooms/
  Reviews tab) — pass a JSON array of steps via the `ACTIONS` env var:
  `ACTIONS='[{"type":"click","x":300,"y":640,"waitAfter":600}]'`. Steps run
  in page coordinates, in order, before the final hover/capture.
- Read the resulting PNG back with the `Read` tool.

**Two gotchas already worked around in the script, don't reintroduce them:**

1. **Don't inflate the emulated viewport height to "capture everything at
   once."** The homepage hero uses `min-h-screen` (100vh) — a tall emulated
   viewport just inflates the hero and pushes every other section outside
   the capture region, producing a screenshot that looks like the page is
   empty below the fold. Keep the viewport ~1000px tall; capture the full
   page via `captureBeyondViewport: true` with a clip height read from
   `document.documentElement.scrollHeight` instead.
2. **Don't use `chrome --headless --virtual-time-budget`.** It hangs
   indefinitely on this app — Vite's dev server keeps a persistent HMR
   WebSocket open, which virtual-time mode waits on. Use a real
   `setTimeout` wall-clock wait after `Page.loadEventFired` instead (the
   script already does this, ~2.5s is enough for tRPC fetches + framer-motion
   reveals to settle).

If a full-page downscaled screenshot looks like content is missing (e.g. a
card grid renders as empty boxes), it's very likely just illegible at that
scale, not actually broken — re-crop that region tightly with `clipY`/
`clipHeight` before concluding it's a bug.

## Flows worth driving

- `/` (Home): hero search bar, Featured Properties hotel-card carousel
  (hover to flip → back face shows amenities), testimonials ("Told By Those
  Who Stayed" — only renders when there's approved-review data with a
  comment), CTA.
- `/hotels`: filter sidebar + grid, same `HotelCard` component as Home.

Both pages render `HotelCard`, which requires an `amenities: string[]` prop
— easy to miss when adding a new call site since it's easy to forget while
copying props from an older card usage.
