# Translations Database Migration & Fly.io Deployment

**Date:** 2026-04-03
**Status:** Approved

## Overview

Move the ~500 hardcoded Portuguese-English flashcards and category config from `public/index.html` into PostgreSQL tables, and deploy the app on Fly.io with managed Postgres.

## Database Schema

### New tables

```sql
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,          -- e.g. "vocab", "fitness", "ir-conj"
  label TEXT NOT NULL,          -- e.g. "Vocabulary", "Fitness"
  css_class TEXT NOT NULL       -- e.g. "cat-vocab", "cat-fitness"
);

CREATE TABLE IF NOT EXISTS cards (
  id SERIAL PRIMARY KEY,
  pt TEXT NOT NULL,             -- Portuguese text
  en TEXT NOT NULL,             -- English text
  category_id TEXT NOT NULL REFERENCES categories(id)
);
```

### Existing tables (unchanged)

- `card_stats` — `card_id` remains TEXT matching the card's Portuguese text
- `session` — no changes

## API Changes

### New endpoint

`GET /api/cards` returns all cards and categories in the shape the frontend expects:

```json
{
  "cards": [
    { "pt": "Algo novo", "en": "Something new", "cat": "vocab" }
  ],
  "categories": {
    "vocab": { "cls": "cat-vocab", "label": "Vocabulary" }
  }
}
```

### Existing endpoints

All existing endpoints (`/api/stats`, `/api/session`) remain unchanged.

## Seed Logic

A `seed-data.js` file exports the card and category data currently hardcoded in `index.html`.

On startup, `init()` will:

1. Create all tables (existing + new `categories` and `cards`)
2. Check if `categories` table is empty
3. If empty, insert all categories and cards from `seed-data.js`

This is zero-touch: first deploy seeds automatically, subsequent deploys skip seeding.

## Frontend Changes

Minimal changes to `public/index.html`:

1. Remove the hardcoded `allCards` array (~700 lines) and `catConfig` object
2. On page load, `fetch("/api/cards")` to populate both
3. Show a loading state until data arrives
4. All other logic (flip, stats, session, keyboard shortcuts) stays the same

## Fly.io Deployment

### New files

- **`Dockerfile`** — Node.js 20 alpine, copy app, `npm ci --production`, expose port, `npm start`
- **`fly.toml`** — app config, internal port 3005, single shared-cpu machine
- **`.dockerignore`** — exclude `node_modules`, `.git`, `.claude`

### Config changes to `server.js`

- Read `DATABASE_URL` from env, fall back to `postgres://localhost/pt_aula` for local dev
- Read port from `PORT` env var, fall back to 3005

### Deployment steps (manual)

1. `fly launch` — create the app
2. `fly postgres create` — provision managed Postgres
3. `fly postgres attach` — sets `DATABASE_URL` on the app
4. `fly deploy` — builds, deploys; `init()` auto-creates tables and seeds

## Decisions

- **No auth** — open access, personal tool
- **No admin UI** — manage cards via SQL or seed script
- **No migration tool** — auto-create tables on startup (existing pattern)
- **No build step** — keep the monolithic `index.html` approach
- **Seed on startup** — zero-touch, no separate seed command
