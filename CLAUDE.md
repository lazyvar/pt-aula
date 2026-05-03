# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server on :5173 with `/api` proxied to Express on :3005. Run the Express server separately (`npm start` with `DATABASE_URL` set) to back the API.
- `npm run dev:all` — `scripts/dev.sh`: sources `.env`, runs `node --watch server.js` and `npm run dev` together with a shared `trap 'kill 0'`. The single-command path for local dev.
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
- `GET/POST/DELETE /api/stats`, `POST /api/stats/:cardId/mark` — per-card counts. Mark is a single `INSERT … ON CONFLICT … RETURNING` that bumps `right_count`/`wrong_count` AND shifts the `recent_history` 5-bit ring buffer atomically (`((recent_history << 1) | bit) & 31`, where `1` = wrong).
- `GET/PUT/DELETE /api/session` — the single session row (id=1) holding deckOrder, currentIndex, counters, mode, activeCats, wrongCards, **typeMode**.
- `GET /api/cards` — returns `{ cards, categories }` (categories keyed by id, each with `cls`, `label`, `group`, `status`).
- `PUT /api/categories/:id/status` — sets a category's `status` to `unmarked` / `studying` / `complete`. 404 if the id is gone.
- `POST /api/reseed` — wipes cards/stats/session, **upserts** categories preserving `status`, then re-inserts cards (see Conventions).
- `POST /api/generate-sentences` — calls `claude-haiku-4-5` to produce ~20 PT/EN pairs. Splits the user's active categories by `group_name`: "Verbs" become "infinitives" the model can conjugate, "Verb Endings" are skipped (literal suffixes like "-amos" can't form sentences), everything else is "drills" (drawn directly). 400 if nothing usable; 502 on malformed JSON.
- `POST /api/generate-conjugations` — calls `claude-haiku-4-5` on a server-built grid of {verb × pronoun × tense} (4 tenses, 8 pronouns including gendered `eles`/`elas`). Verbs come from active categories with `group_name = 'Verbs'`. The English meaning lookup (`enMap`) preserves disambiguators from seed `en` strings. Output cards are PT pronoun+conjugation / EN "subject, to-base, tense".
- `POST /api/grade-sentence` — body `{ en, userPt, referencePt }`; returns `{ grade: 1|2|3, summary, mistakes[], warnings[], rule }` from Claude. Used by SentenceGrader in Generated Mode (typing path).
- `POST/GET /api/tts` — ElevenLabs proxy. Voice/model/text are hashed (sha256) into `$TTS_CACHE_DIR/<key>.mp3` (Fly volume in prod, `./.tts-cache` locally). Cache write is best-effort via tmp+rename; cache read failure falls through to upstream.

**Seeds (`seeds/`)** — `seeds/index.js` aggregates groups → each group (`topics`, `phrases`, `verbs`, `aulas`, `ir`, `conjugations`, `verb-endings`) has its own `index.js` aggregating files that each export `{ categories, cards }`. Categories have `{ id, label, css_class, group_name }`; cards have `{ pt, en, category_id }`. `group_name` (e.g. "Verbs", "Topics") is what the generator uses to partition vocabulary. To add content, create a new `.js` file in the appropriate group, require it from that group's `index.js`, then hit `POST /api/reseed` (or restart against an empty DB).

**Frontend (`src/`)** — entry `main.ts` routes to either `App.svelte` (default) or `Professora.svelte` (`/professora[/...]`) based on `window.location.pathname`. State lives in Svelte stores (`src/stores/`):
- `cards.ts` — loads all cards + category config once; exposes `getDefaultActiveCats()`.
- `stats.ts` — hydrates `/api/stats`.
- `session.ts` — **the core.** Holds `session` (writable), plus derived `deck` and `wrongCardsList` of resolved `Card` objects. Persists by `pt` string (not id). Subscribes to itself to auto-PUT `/api/session` on every mutation (150ms debounce), suppressed while `generatedMode` is active. `flushSession()` uses `navigator.sendBeacon` on `beforeunload`. Actions: `startDeck`, `shuffleRemaining`, `reviewWrongCards`, `reviewDifficultCards`, `toggleCat`, `toggleMode`/`setMode`, `toggleTypeMode`, `mark`, `snapshotDeck`/`applyGeneratedDeck`/`restoreSnapshot`.
- `generated.ts` — Generated Mode for **two kinds** (`'sentences' | 'conjugations'`). `generate(kind, activeCats, snapshot, apply)` snapshots the current deck, calls the matching endpoint, swaps the deck via `applyGeneratedDeck`, and exposes `generatingKind` for in-flight UI. Auto-PUT is a no-op while active so the real session is never clobbered.
- `difficulty.ts` (store) — derived `difficultCount`: counts cards in active cats whose stat is "difficult" per `src/lib/difficulty.ts` (see below); falls back to global count if active set is empty of difficult cards.
- `categoryStatus.ts` — `setCategoryStatus(id, status)` does an **optimistic** update of `catConfig`, PUTs `/api/categories/:id/status`, and reverts + flashes `statusError` on failure. 404 triggers a `hydrateCards()` re-fetch to drop the pruned row from the panel.
- `professoraFilters.ts` — UI filter state for Professora page: `{ studying, complete, categoryIds[] }`. Defaults to `studying:true`.
- `grader.ts` — state machine for `/api/grade-sentence`: `idle → grading → graded`. `submit(card)` posts the typed answer; `giveUp()` short-circuits to a grade-1 result without a network call; `reset()` returns to idle.
- `ui.ts` — UI-only state (e.g. bottom sheet open).

**Hydration flow (`App.svelte`)** — `hydrateCards()` → `hydrateStats()` → `hydrateSession()`. `hydrateSession` returns `null` (no row, apply defaults + startDeck), `false` (row exists but deck empty — rebuild from restored activeCats), or `true` (ready). Cards are resolved from stored pt strings via a `Map<pt, Card>`, so cards missing from the current seeds are silently dropped on restore.

**Card IDs (`src/lib/cardId.ts`)** — stats are keyed by a slug derived from `card.pt` (lowercase, strip diacritics, non-alphanumerics → `-`). This algorithm is **load-bearing**: changing it orphans all stats. `tests/fixtures/truth.js` has a matching implementation that tests rely on.

**Difficulty (`src/lib/difficulty.ts`)** — `isDifficult(stat)` requires ≥3 total attempts AND `popcount5(recent_history) ≥ 2` (i.e. 2+ wrongs in the last 5 attempts). The 💪 Difficult button rebuilds the deck from this pool — scoped to active cats, falling back to all cats if empty.

**Modes** — `pt-to-en` / `en-to-pt` flip which side of the card is the prompt. `__generated__` is the sentinel category id (`GENERATED_CAT` in `types.ts`) used while in Generated Mode.
- `listen-to-pt` activates Listening Mode: `<ListeningCard>` replaces the flip card, audio comes from `/api/tts`, and answers are graded with `normalizeForListening` (case/diacritic/punctuation-insensitive).
- `typeMode` (orthogonal session boolean, not a value of `mode`) flips the desktop card from click-to-flip to type-to-answer. In Generated Mode this routes through `<SentenceGrader>` → `/api/grade-sentence` for AI grading.
- 📚 Studying button: rebuilds `activeCats` from the set of categories with `status === 'studying'` and starts a fresh deck. Disabled when the studying set is empty.

**Professora page (`/professora`)** — a separate Svelte tree mounted by `main.ts` based on `window.location.pathname`. Express has an SPA fallback for `/professora[/...]` URLs. Each category carries a `status` column (`unmarked` / `studying` / `complete`) on the `categories` table; the column is preserved across `/api/reseed` (reseed now upserts categories instead of truncating them, then prunes any categories not in the seed). The page surfaces a Manage panel (set status), filters (Studying/Complete chips + category multiselect), and a flat card grid. Status is set via `PUT /api/categories/:id/status`.

**Components (`src/lib/`)** — `CardDeck` (prompt/flip/mark + owns keyboard shortcuts, exposed via `bind:this` so `App.svelte` can forward keydown), `Sidebar` (desktop category picker + controls), `MobileTopBar` + `BottomSheet` (mobile equivalents), `CategoryPicker`, `ControlButtons`, `ListeningCard`, `SentenceGrader` (typed-answer grading UI), `StatusPill`. Professora-only: `ProfessoraDesktop`, `ProfessoraMobile`, `ProfessoraSheet`, `ProfessoraHeader`, `ProfessoraFilters`, `ManagePanel`, `CardGrid`.

## Conventions

- Database migrations are done inline in `init()` via `ADD COLUMN IF NOT EXISTS`. When adding new session fields, add a column there **and** update both `GET /api/session` and `PUT /api/session` to read/write it.
- The `session` table always has exactly one row (`id=1`), written via `INSERT ... ON CONFLICT DO UPDATE`.
- `/api/reseed` no longer TRUNCATEs `categories` — it upserts label/css_class/group_name (preserving `status`) and prunes categories whose ids are not in the seed.

## Testing

Playwright, single worker, not parallel (tests share the DB). Two projects: `chromium` (desktop, ignores `mobile.spec.js`) and `mobile` (Pixel 7 device, only `mobile.spec.js`). Tests use `tests/fixtures/reset.js` to wipe the DB and `truth.js` for canonical expected data — keep these in sync with `src/lib/cardId.ts` and seed content.

## Deploy

Fly.io (`fly.toml`), Docker build (`Dockerfile`) runs `npm run build` then `npm start`. Requires `DATABASE_URL`, `ANTHROPIC_API_KEY`, and `ELEVENLABS_API_KEY` env vars; `TTS_CACHE_DIR` should point at the mounted Fly volume so the audio cache survives deploys.
