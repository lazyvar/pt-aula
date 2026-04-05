# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Português Aula — a single-page Portuguese flashcard study app. Node/Express server with Postgres persistence and a single static HTML frontend. Deployed to Fly.io (`fly.toml`, region `iad`).

## Commands

- `npm start` — runs `node server.js` on port 3005 (or `$PORT`). Requires `DATABASE_URL` (defaults to `postgres://localhost/pt_aula`).
- `npm test` — runs the Playwright browser test suite. Brings up an ephemeral Postgres via `docker-compose.test.yml` (requires Docker), boots `server.js` on port 3006 against the test DB, runs all specs in `tests/`, tears down Postgres. CI runs the same specs via `.github/workflows/test.yml` (Actions service container instead of Docker Compose).
- `npm run test:ui` / `npm run test:headed` — interactive Playwright modes. These leave the Postgres container running; tear it down manually with `docker compose -f docker-compose.test.yml down`.
- `fly deploy` — deploys via the Dockerfile. No build step; static assets are served directly from `public/`.

## Architecture

### Backend (`server.js`)
Single-file Express app (~190 lines). On startup, `init()` creates tables if missing (`card_stats`, `session`, `categories`, `cards`) and runs idempotent `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` migrations inline. If `categories` is empty, it auto-seeds from `./seeds`.

API surface (all JSON):
- `GET /api/cards` — returns all cards + categories map keyed by id
- `GET/POST /api/stats`, `POST /api/stats/:cardId/mark` — per-card right/wrong counts; `DELETE /api/stats` resets
- `GET/PUT/DELETE /api/session` — a single-row table (`id=1`) storing the current deck state (deckOrder, currentIndex, correct, wrong, mode, activeCats, wrongCards). This is a **single-user app**: there is one global session.
- `POST /api/reseed` — TRUNCATEs cards/categories/card_stats and re-inserts from seed files inside a transaction. Use after editing seeds.

### Seed data (`seeds/`)
Hierarchy: `seeds/index.js` aggregates groups → each group (`topics`, `phrases`, `verbs`, `aulas`, `ir`, `conjugations`, `verb-endings`) has its own `index.js` aggregating files that each export `{ categories, cards }`. Categories have `{ id, label, css_class, group_name }`; cards have `{ pt, en, category_id }`. To add content, create a new `.js` file in the appropriate group, require it from that group's `index.js`, then hit `POST /api/reseed` (or restart against an empty DB).

### Frontend (`public/index.html`)
A single ~1200-line HTML file containing all CSS and JS inline (no bundler, no framework). Fetches cards/stats/session from the API, renders a flashcard deck with shuffle/mode toggle (pt-to-en vs en-to-pt)/category filtering, and PUTs session state back on every action. `statsCache` is hydrated once at load. The sidebar lists categories grouped by `group_name`.

## Conventions

- Database migrations are done inline in `init()` via `ADD COLUMN IF NOT EXISTS`. When adding new session fields, add a column there **and** update both `GET /api/session` and `PUT /api/session` to read/write it.
- The `session` table always has exactly one row (`id=1`) using `INSERT ... ON CONFLICT DO UPDATE`.
- Card IDs used by `card_stats.card_id` are constructed client-side from `pt` + `en` text — they are not the DB `cards.id` serial. Check the frontend for the exact format before touching stats code.
