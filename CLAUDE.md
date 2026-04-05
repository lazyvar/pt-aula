# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on :5173 with `/api` proxied to Express on :3005. Run the Express server separately (`npm start` with `DATABASE_URL` set) to back the API.
- `npm run build` — Vite builds Svelte app into `dist/`. Express serves `dist/` as static in production.
- `npm start` — runs `server.js` (requires running Postgres; defaults to `postgres://localhost/pt_aula`). Port defaults to 3005.
- `npm run check` — svelte-check typecheck.
- `npm test` — **builds first**, spins up the test Postgres via `docker-compose.test.yml` (port 5433), runs Playwright, then tears down.
- `npm run test:ui` / `npm run test:headed` — interactive Playwright modes. These leave the Postgres container running; tear it down manually with `docker compose -f docker-compose.test.yml down`.
- Run a single Playwright test: `npx playwright test tests/session.spec.js` (assumes the test DB is already up via `docker compose -f docker-compose.test.yml up -d --wait`). Playwright auto-starts the server on :3006 pointing at the test DB.
- `SLOW_MO=250 npm run test:headed` — slows down headed runs for debugging.

## Architecture

Single-user Brazilian Portuguese flashcard trainer. Svelte 4 + TypeScript frontend, Express + Postgres backend, Claude Haiku for on-demand sentence generation.

**Backend (`server.js`)** — single file. On boot it creates tables (`card_stats`, `session`, `categories`, `cards`) with idempotent `ALTER TABLE … ADD COLUMN IF NOT EXISTS` migrations, and seeds categories/cards from `seeds/` if empty. Endpoints:
- `GET/POST/DELETE /api/stats`, `POST /api/stats/:cardId/mark` — per-card right/wrong counts.
- `GET/PUT/DELETE /api/session` — the single session row (id=1) holding deckOrder, currentIndex, counters, mode, activeCats, wrongCards.
- `GET /api/cards` — returns `{ cards, categories }` (categories keyed by id, each with `cls`, `label`, `group`).
- `POST /api/reseed` — truncates and reseeds from `seeds/`.
- `POST /api/generate-sentences` — calls `claude-haiku-4-5` to produce 20 PT/EN pairs from the user's active Verb + Topic categories. Strips markdown fences; returns 502 on bad JSON.

**Seeds (`seeds/`)** — `seeds/index.js` aggregates groups → each group (`topics`, `phrases`, `verbs`, `aulas`, `ir`, `conjugations`, `verb-endings`) has its own `index.js` aggregating files that each export `{ categories, cards }`. Categories have `{ id, label, css_class, group_name }`; cards have `{ pt, en, category_id }`. `group_name` (e.g. "Verbs", "Topics") is what the generator uses to partition vocabulary. To add content, create a new `.js` file in the appropriate group, require it from that group's `index.js`, then hit `POST /api/reseed` (or restart against an empty DB).

**Frontend (`src/`)** — entry `main.ts` mounts `App.svelte`. State lives in Svelte stores (`src/stores/`):
- `cards.ts` — loads all cards + category config once; exposes `getDefaultActiveCats()`.
- `stats.ts` — hydrates `/api/stats`.
- `session.ts` — **the core.** Holds `session` (writable), plus derived `deck` and `wrongCardsList` of resolved `Card` objects. Persists by `pt` string (not id). Subscribes to itself to auto-PUT `/api/session` on every mutation (150ms debounce), suppressed while `generatedMode` is active. `flushSession()` uses `navigator.sendBeacon` on `beforeunload`. Actions: `startDeck`, `shuffleRemaining`, `reviewWrongCards`, `toggleCat`, `toggleMode`, `mark`, `snapshotDeck`/`restoreSnapshot`.
- `generated.ts` — Generated Mode: takes a snapshot of the current deck, swaps in AI-generated cards, restores on exit. Auto-PUT is a no-op while active so the real session is never clobbered.
- `ui.ts` — UI-only state (e.g. bottom sheet open).

**Hydration flow (`App.svelte`)** — `hydrateCards()` → `hydrateStats()` → `hydrateSession()`. `hydrateSession` returns `null` (no row, apply defaults + startDeck), `false` (row exists but deck empty — rebuild from restored activeCats), or `true` (ready). Cards are resolved from stored pt strings via a `Map<pt, Card>`, so cards missing from the current seeds are silently dropped on restore.

**Card IDs (`src/lib/cardId.ts`)** — stats are keyed by a slug derived from `card.pt` (lowercase, strip diacritics, non-alphanumerics → `-`). This algorithm is **load-bearing**: changing it orphans all stats. `tests/fixtures/truth.js` has a matching implementation that tests rely on.

**Modes** — `pt-to-en` / `en-to-pt` flip which side of the card is the prompt. `__generated__` is the sentinel category id (`GENERATED_CAT` in `types.ts`) used while in Generated Mode.

**Components (`src/lib/`)** — `CardDeck` (prompt/flip/mark + owns keyboard shortcuts, exposed via `bind:this` so `App.svelte` can forward keydown), `Sidebar` (desktop category picker + controls), `MobileTopBar` + `BottomSheet` (mobile equivalents), `CategoryPicker`, `ControlButtons`.

## Conventions

- Database migrations are done inline in `init()` via `ADD COLUMN IF NOT EXISTS`. When adding new session fields, add a column there **and** update both `GET /api/session` and `PUT /api/session` to read/write it.
- The `session` table always has exactly one row (`id=1`), written via `INSERT ... ON CONFLICT DO UPDATE`.

## Testing

Playwright, single worker, not parallel (tests share the DB). Two projects: `chromium` (desktop, ignores `mobile.spec.js`) and `mobile` (Pixel 7 device, only `mobile.spec.js`). Tests use `tests/fixtures/reset.js` to wipe the DB and `truth.js` for canonical expected data — keep these in sync with `src/lib/cardId.ts` and seed content.

## Deploy

Fly.io (`fly.toml`), Docker build (`Dockerfile`) runs `npm run build` then `npm start`. Requires `DATABASE_URL` and `ANTHROPIC_API_KEY` env vars.
