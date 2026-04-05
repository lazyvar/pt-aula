# Automated Browser Testing — Design

**Date:** 2026-04-05
**Status:** Approved, pending implementation plan

## Goal

Add a browser-based automated test suite to pt-aula that serves as a pre-deploy safety net, living documentation of expected behavior, and a general confidence boost when making changes. Tests run locally during development and in GitHub Actions on every push/PR.

## Non-goals (v1)

- Testing Generated Mode (recent feature, add in v2)
- Testing `POST /api/reseed` end-to-end flow
- Cross-browser coverage beyond Chromium
- Visual regression / screenshot testing
- Load or performance testing

## Stack

- **Test runner:** Playwright (`@playwright/test`)
- **Browser:** Chromium only for v1
- **Database:** Ephemeral Postgres via Docker Compose locally; GitHub Actions service container in CI
- **Server under test:** the real `node server.js`, booted by Playwright's `webServer` config against the test database

## File Layout

```
pt-aula/
├── docker-compose.test.yml    # ephemeral Postgres for tests
├── playwright.config.js       # test runner config
├── tests/
│   ├── fixtures/
│   │   ├── seed.js            # deterministic test cards/categories
│   │   └── reset.js           # TRUNCATE + reseed helper
│   ├── deck.spec.js           # flow A: load, see card, flip, advance
│   ├── marking.spec.js        # flow B: right/wrong, stats persist
│   ├── categories.spec.js     # flow C: category toggles
│   ├── mode.spec.js           # flow D: pt↔en mode switch
│   └── session.spec.js        # flow E: reload mid-deck, resume
└── .github/workflows/test.yml # CI: postgres service + playwright
```

## Architecture

### Test DB & server lifecycle

**`docker-compose.test.yml`** defines one service:
- `postgres-test`: Postgres 16, port 5433 (avoids clashing with the standard local 5432), tmpfs-backed data directory for speed, healthcheck so `docker compose up --wait` blocks until ready.

**`playwright.config.js`** sets:
- `webServer.command`: `DATABASE_URL=postgres://localhost:5433/pt_aula_test PORT=3006 node server.js`
- `webServer.url`: `http://localhost:3006`
- `webServer.reuseExistingServer`: `!process.env.CI`
- `use.baseURL`: `http://localhost:3006`
- `workers`: `1` (serial, because the app uses a single global session row)

The existing `init()` in `server.js` creates tables on startup, so no separate migration step is needed — it runs against the fresh test DB automatically.

### Fixtures & seeding

Tests use the real `./seeds` data via `POST /api/reseed`. Assertions target **stable shape properties** (card count > 0, category exists in group, etc.) rather than hard-coded card strings, so the suite stays green as seed content grows.

**`tests/fixtures/reset.js`** exports `resetAll()`:
1. `POST /api/reseed` — reload cards + categories
2. `DELETE /api/stats` — clear card stats
3. `PUT /api/session` with an empty session (no deckOrder, default mode, all categories active)

`resetAll()` is called in a `beforeEach` hook in every spec file to guarantee clean state.

For `session.spec.js`, we additionally set a deterministic `deckOrder` via `PUT /api/session` before the reload-assertion test, so we can verify the exact card resumes after reload.

### Test isolation

- Tests run serially (`workers: 1`) — the app's single-user, single-session-row design makes parallel tests unsafe.
- Every test resets state via `beforeEach`, so ordering between tests does not matter.

## Test Coverage (v1)

### `deck.spec.js` — flow A
- App loads at `/`, a card is visible, front face shows Portuguese text
- Clicking/tapping the card flips it; back face shows English translation
- Advancing shows a new card; the "current position" counter increments

### `marking.spec.js` — flow B
- Mark card "right" → right counter increments, card advances
- Mark card "wrong" → wrong counter increments, wrong-pile tracks the card
- After reload, `GET /api/stats` returns the expected right/wrong counts for the marked cards (keyed by the client-side `pt + en` card ID)

### `categories.spec.js` — flow C
- Sidebar renders categories grouped by `group_name`
- Toggling one category off removes its cards from the deck
- Toggling all categories off shows the empty/placeholder state
- Toggling categories back on restores their cards

### `mode.spec.js` — flow D
- Default mode: pt-front, en-back
- Toggle mode → en-front, pt-back; flipping reveals the opposite side
- Mode persists after page reload (via session table)

### `session.spec.js` — flow E
- Seed a known deckOrder + mark a few cards
- Reload the page
- Assert: same card position, same correct/wrong counts, same active categories

## Selectors

Tests prefer semantic locators (`getByRole`, `getByText`). Where semantics are insufficient, we add a small set of `data-testid` attributes to `public/index.html`:
- Card flip surface
- Right / wrong buttons
- Right / wrong counters
- Mode toggle
- Category sidebar items

## CI — `.github/workflows/test.yml`

Runs on push and pull_request:

1. Checkout
2. Setup Node 20
3. `npm ci`
4. `npx playwright install --with-deps chromium`
5. `DATABASE_URL=postgres://postgres:postgres@localhost:5432/pt_aula_test npx playwright test`
6. On failure, upload `playwright-report/` as an artifact

**Postgres service:** a `postgres:16` service container on port 5432 with healthcheck. No docker-compose in CI — GitHub Actions service containers do the same job natively. The `DATABASE_URL` env var is the seam between local (Docker Compose, port 5433) and CI (service container, port 5432).

## npm scripts

```json
"scripts": {
  "start": "node server.js",
  "test": "docker compose -f docker-compose.test.yml up -d --wait && playwright test; EXIT=$?; docker compose -f docker-compose.test.yml down; exit $EXIT",
  "test:ui": "docker compose -f docker-compose.test.yml up -d --wait && playwright test --ui",
  "test:headed": "docker compose -f docker-compose.test.yml up -d --wait && playwright test --headed"
}
```

- `npm test` — full run, tears down Postgres after (success or fail)
- `npm run test:ui` — Playwright UI mode for iterative test authoring; leaves Postgres running, user tears it down manually
- `npm run test:headed` — watch tests execute in a real Chromium window

## Dev dependencies added

- `@playwright/test`

## `.gitignore` additions

- `playwright-report/`
- `test-results/`
- `playwright/.cache/`

## Open risks

- **Client-side card ID format:** `card_stats.card_id` is built client-side from `pt + en` text. Tests that assert on persisted stats must either read the IDs through the UI or replicate the exact formatting. Plan: read from the UI counters, not from raw API data, to avoid coupling tests to the ID-construction format.
- **Session row contention:** if someone runs `npm test` while also using the dev server on the same machine, the test server's `PUT /api/session` writes hit the test DB (port 5433), not dev (port 5432), so they're isolated. No actual risk, but documenting the separation.
