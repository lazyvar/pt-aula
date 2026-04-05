# Svelte Frontend Migration — Design

**Status:** Approved, ready for implementation planning
**Date:** 2026-04-05

## Overview

Migrate the pt-aula frontend from a single 1356-line `public/index.html` (inline HTML/CSS/JS, no framework, no bundler) to a Svelte 4 + TypeScript SPA built with Vite. The backend (`server.js`, API surface, seeds, Postgres schema) is untouched. Big-bang rewrite: the old `index.html` is deleted at the end of the migration.

### Goals

- Produce a readable frontend codebase optimized for code review, not author ergonomics.
- Preserve all current user-visible behavior.
- Keep all 6 existing Playwright specs passing unchanged.
- Keep Fly.io deploy simple — one Dockerfile, no new infrastructure.

### Non-goals

- No backend changes (API shape, session schema, card ID slug algorithm all stay identical).
- No SSR (vanilla Svelte + Vite SPA, not SvelteKit).
- No component-level test framework.
- No new features — behavior parity with current app.

## Decisions

| Decision | Choice | Reasoning |
|---|---|---|
| Migration strategy | Big-bang rewrite | Tightly-coupled state across session/stats/categories makes incremental bridges messy. Playwright suite is a strong safety net. |
| Svelte version | Svelte 4 (stores + `$:`) | User preference for readability at the declaration site. Tradeoff: `$store` sigils at use sites are more verbose, but declarations look like plain JS. |
| Language | TypeScript | Explicit shapes at module boundaries, hoverable types in editors. |
| Build output | Vite `dist/`, served by Express via `express.static('dist')` | Single container, trivial Dockerfile change. No committed build artifacts. |
| Dev loop | Two processes: Express on :3005, Vite on :5173 with `/api` proxy | Conventional Vite+Svelte setup. HMR. Keeps `server.js` free of dev/prod branches. |
| Component decomposition | ~8 components, middle-grained | Extracts the Sidebar/BottomSheet category-picker duplication into a shared `CategoryPicker`. Keeps CardDeck's flip+buttons+swipe together as one feature. |
| State management | Three Svelte writable stores: `session`, `stats`, `cards` | Matches the three piles of state in the current app. Auto-PUT lives in one subscription inside `stores/session.ts`. |
| Session persistence | Debounced (150ms) auto-PUT + `beforeunload` flush via `sendBeacon` | Collapses rapid multi-field updates into one PUT. Flush closes the unload race — matches current "no lost writes" behavior. |
| Stats persistence | Per-card POST on mark (unchanged from today) | No debounce needed — explicit per-call. |
| Testing | All 6 Playwright specs unchanged + one new spec for `getCardId` | Playwright already covers the integrations that matter. Component tests would be tautological and duplicate end-to-end coverage. |
| CSS migration | Port all ~720 lines into `App.svelte`'s `<style>` with `:global()` wrappers | Readable first, idiomatic-Svelte second. Avoids untangling shared selectors during the port. |

## Architecture

Single-page Svelte 4 app, TypeScript, built with Vite, mounted into `<div id="app">` in `index.html`. Express serves the built `dist/` directory. The backend (`server.js`, API, seeds, Postgres schema) is untouched.

### File structure

```
src/
├── App.svelte                 top-level layout, responsive switch, global CSS,
│                              keyboard shortcut handlers, beforeunload flush
├── lib/
│   ├── Sidebar.svelte         desktop category picker (scrollable column)
│   ├── BottomSheet.svelte     mobile category picker (drag handle + body)
│   ├── CategoryPicker.svelte  shared picker body: groups, chips, collapse
│   │                          state (used by both Sidebar and BottomSheet)
│   ├── CardDeck.svelte        flip card + answer buttons + progress counter
│   │                          + swipe gestures
│   ├── MobileTopBar.svelte    stats pill + "Categories" dropdown trigger
│   └── cardId.ts              getCardId() ported verbatim from current code
├── stores/
│   ├── session.ts             session writable + debounced auto-PUT + flush
│   ├── stats.ts               statsCache writable + per-card POST on mark
│   └── cards.ts               cards + catConfig, hydrated once
├── types.ts                   Card, Session, Stats, CatConfig types
├── main.ts                    mounts <App> to #app
└── app.d.ts                   Svelte type declarations
index.html                     Vite entry: <head>, fonts, <div id="app">
public/
└── favicon.png                (moved from old public/)
vite.config.ts                 Svelte plugin + /api proxy to :3005
tsconfig.json
svelte.config.js
```

### Store architecture

**`stores/session.ts`** owns the session object and the auto-PUT behavior:

```ts
import { writable, get } from 'svelte/store';
import type { Session } from '../types';

export const session = writable<Session>(initialSession);

let timer: ReturnType<typeof setTimeout> | null = null;
let hydrated = false;

session.subscribe((s) => {
  if (!hydrated) return;
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    fetch('/api/session', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
    }).catch(err => console.error('session PUT failed', err));
  }, 150);
});

export async function hydrateSession() {
  const s = await fetch('/api/session').then(r => r.json());
  session.set(s);
  hydrated = true;
}

// Called from App.svelte's onMount beforeunload listener
export function flushSession() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
    navigator.sendBeacon('/api/session', JSON.stringify(get(session)));
  }
}
```

**Key properties:**
- Auto-PUT lives in one place. Every `session.update(...)` from any component triggers a save. Components never call `fetch('/api/session')` directly.
- Debounced (150ms) so rapid multi-field mutations (shuffle, toggle category) collapse into one PUT.
- `hydrated` flag prevents the initial hydration from immediately writing back what was just read.
- `flushSession()` is wired to `window.addEventListener('beforeunload', flushSession)` in `App.svelte` to close the unload race.

**`stores/stats.ts`** — `writable<Record<string, {right: number, wrong: number}>>`. No debounce; exposes `markCard(cardId, correct)` which updates the store locally and POSTs per-card to `/api/stats/:cardId/mark`. Hydrated once at startup.

**`stores/cards.ts`** — `writable<Card[]>` + `writable<Record<string, CatConfig>>`. Hydrated once, no writes back to server.

## Data Flow

**Startup sequence (`App.svelte` `onMount`):**

1. `hydrateCards()` — GET `/api/cards` → populates `cards` + `catConfig`
2. `hydrateStats()` — GET `/api/stats` → populates `stats`
3. `hydrateSession()` — GET `/api/session` → populates `session`, sets `hydrated = true`
4. `window.addEventListener('beforeunload', flushSession)`
5. Render

Until all three hydrate promises resolve, `App.svelte` renders a loading state. After `hydrated = true`, any `session.update(...)` triggers the debounced auto-PUT.

**User interactions and their write paths:**

| Action | Store updates | Server writes |
|---|---|---|
| Mark correct/wrong (button or swipe) | `session` (counters, currentIndex, wrongCards), `stats` | debounced PUT `/api/session` + POST `/api/stats/:cardId/mark` |
| Flip card | component-local state in `CardDeck` | — |
| Toggle category | `session.activeCats`, `session.deckOrder`, `session.currentIndex` | debounced PUT `/api/session` |
| Shuffle remaining | `session.deckOrder`, `session.currentIndex` | debounced PUT `/api/session` |
| Toggle mode (pt↔en) | `session.mode` | debounced PUT `/api/session` |
| Review wrong cards | `session.deckOrder`, reset counters, clear `wrongCards` | debounced PUT `/api/session` |
| Reset stats | `stats` | DELETE `/api/stats` |
| Reseed | backend reseed, then re-hydrate all three stores | POST `/api/reseed` |
| Page unload | — | `sendBeacon` flushes pending session PUT if timer is active |

**Card ID stability:** `getCardId()` in `lib/cardId.ts` is a verbatim port of the current client-side slugification (lowercase, diacritics stripped, non-alphanumerics collapsed to `-`, trimmed, keyed on `pt` text only). The `stats` store keys by this ID. If the slug algorithm drifts, existing `card_stats` rows orphan silently — so it's covered by a dedicated Playwright spec.

**Flip-card state:** local to `CardDeck.svelte`, not in a store. Resets when `currentIndex` changes. No server persistence (matches current behavior).

## Error Handling

Matches current app behavior — single-user hobby app.

- **Hydration failures** (startup GETs): log to console, show an error banner in `App.svelte`, stop. No retry.
- **Auto-PUT failures** (debounced session writes): fire-and-forget, log to console. Next mutation will overwrite anyway.
- **Stats POST failures**: log and move on. Local store is updated, so UI stays correct; only server drifts. Acceptable for single-user.
- **`sendBeacon` on unload**: no error path available; if it returns false, nothing useful to do since the page is closing.
- **Session references cards that no longer exist** (e.g., after reseed): `CardDeck` filters `deckOrder` against loaded `cards` and skips unknowns.
- **Empty deck** (no categories selected, or active categories have zero cards): `CardDeck` renders a "pick a category" empty state.

**Type safety:** `types.ts` defines `Card`, `Session`, `Stats`, `CatConfig`. Hydration functions cast JSON responses to these types without runtime validation. The server is trusted — same assumption as current code.

**Explicitly not doing:** toasts, error boundaries, retry queues. Console + single error banner is the entire strategy.

## Testing

**All 6 existing Playwright specs continue to run unchanged.** Full list:
- `tests/session.spec.js`
- `tests/pair-integrity.spec.js`
- `tests/mode.spec.js`
- `tests/deck-composition.spec.js`
- `tests/stats.spec.js`
- `tests/mobile.spec.js`

During planning, audit the specs for fragile selectors (implementation-detail class names vs stable roles/text). For each fragile selector, either keep the class name in the Svelte components or switch the spec to a more resilient selector.

**`npm test` script change** — add `npm run build` before `playwright test`:

```json
"test": "npm run build && docker compose -f docker-compose.test.yml up -d --wait && playwright test; EXIT=$?; docker compose -f docker-compose.test.yml down; exit $EXIT"
```

Same change for `test:ui` and `test:headed`. CI (`.github/workflows/test.yml`) gets the same `npm run build` step.

**New spec:** `tests/card-id-slug.spec.js` loads the page, reads `window.getCardId`, asserts against a fixture of `(pt input → expected slug)` pairs. Guards the `card_stats` contract. `main.ts` exposes the function on `window`:

```ts
(window as any).getCardId = getCardId;
```

**No component-level tests.** No Vitest, no `@testing-library/svelte`. Playwright is the whole test story.

## Build & Deploy

**Dockerfile** (changes marked):

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci                      # was: npm ci --production
COPY . .
RUN npm run build               # new
EXPOSE 3005
CMD ["npm", "start"]
```

**`server.js` change:** `express.static('public')` → `express.static('dist')`. One line.

**`fly.toml`:** unchanged.

**Dev loop:**
- Terminal 1: `npm start` (Express on :3005)
- Terminal 2: `npm run dev` (Vite on :5173 with `/api` proxied to :3005)
- Open `http://localhost:5173`

**Production:** single container runs `node server.js`, Express serves `dist/` statically + the `/api/*` routes.

## Migration Plan (phases)

High-level sequencing. The writing-plans skill will turn this into a detailed step-by-step plan.

**Phase 1: Scaffold.** Add `vite.config.ts`, `tsconfig.json`, `svelte.config.js`, dev deps (svelte, vite, @sveltejs/vite-plugin-svelte, typescript, @tsconfig/svelte). Create `index.html`, `src/main.ts`, `src/App.svelte` with "hello world". Verify `npm run dev` serves on :5173, proxy works, `npm run build` produces `dist/`.

**Phase 2: Dockerfile + Express.** Update Dockerfile. Change `server.js` static dir to `dist/`. Move `favicon.png` to new Vite `public/`. Verify container builds and serves hello-world Svelte.

**Phase 3: Types + stores + hydration.** Define `types.ts`. Build `stores/cards.ts`, `stores/stats.ts`, `stores/session.ts` (debounced PUT + `beforeunload` flush). Port `getCardId` to `lib/cardId.ts`. Wire hydration in `App.svelte`. Verify stores populate against real API.

**Phase 4: Port CSS.** Move ~720 lines of CSS from old `index.html` `<style>` into `App.svelte`'s `<style>` with `:global()` wrappers. Keep selectors identical.

**Phase 5: Port components.** In order: `CategoryPicker` → `Sidebar` → `BottomSheet` → `CardDeck` → `MobileTopBar`. Wire each into `App.svelte` with the responsive desktop/mobile switch. At the end, the Svelte app is feature-complete.

**Phase 6: Tests + cutover.** Add `npm run build` to `npm test` + CI. Add `card-id-slug.spec.js`. Run full suite. Fix fragile selector breakages. Delete old `public/index.html`. Run suite again. Merge.

Each phase should land in 1–3 commits. Phase 4 is the biggest line-count move but mechanical. Phase 5 is the real work.
