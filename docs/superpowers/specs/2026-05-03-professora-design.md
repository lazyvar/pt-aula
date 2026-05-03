# Professora page — design

**Date:** 2026-05-03
**Status:** Approved, ready for implementation plan

## Goal

A second page at `/professora` where the user's Brazilian Portuguese teacher (in person, on her phone) can see what the user is currently studying and what they've already mastered. The page doubles as the management surface where the user marks each category's status. The data drives in-person conversation.

## Decisions (from brainstorming)

| # | Question | Choice |
|---|---|---|
| 1 | Status model | Three-state per category (`unmarked` / `studying` / `complete`), independent of `activeCats` |
| 2 | Where status is set | On `/professora` itself, in a Manage panel |
| 3 | Page sections | Studying primary, Complete secondary (realized via filters) |
| 4 | Card layout | Flat grid + filters (status: Studying/Complete; categories: multiselect) |
| 5 | Auth | Fully public — no gate on read or write |
| 6 | Manage UI | Top-of-page collapsible panel (default collapsed) |
| 7 | Mobile/desktop | Two distinct components (matches main app pattern) |
| 8 | Card tile content | PT (large) + EN (small) only — no badges, audio, or stats |
| 9 | Entry button | Desktop: top-right icon in main content. Mobile: top-right icon on `MobileTopBar`, left of the selector |
| 10 | Filter defaults | `unmarked` cards hidden from grid; default filter on load = Studying only |
| 11 | Initial state | All existing categories start `unmarked` (clean slate; no auto-migration from `activeCats`) |
| — | Reseed | Status must survive every reseed |
| — | Routing | Branch in `main.ts` by `window.location.pathname` (separate Svelte tree) |

## Architecture

`main.ts` inspects `window.location.pathname`. If `/professora`, mount `Professora.svelte`; otherwise mount `App.svelte` (today's behavior). `index.html` and the bundle entry are unchanged.

Express adds a single SPA fallback so any `/professora` URL serves `dist/index.html`:

```js
app.get(/^\/professora(\/.*)?$/, (req, res) =>
  res.sendFile(path.join(__dirname, "dist/index.html"))
);
```

This sits **after** `app.use(express.static(...))` and **after** all `/api/*` routes so it doesn't shadow them.

The professora tree shares two stores with the main app:
- `stores/cards.ts` — read-only card and category data (extended to include `status` per category).
- `stores/categoryStatus.ts` — new module exporting `setCategoryStatus(id, status)`.

It does **not** import `stores/session.ts`, `stores/generated.ts`, or `stores/stats.ts`. No keyboard handlers, no autosave, no `flushSession` on unload.

Two view components for the responsive split, matching the main app's pattern: `lib/ProfessoraDesktop.svelte` and `lib/ProfessoraMobile.svelte`. `Professora.svelte` picks one via `window.matchMedia('(max-width: 768px)')`, re-evaluated on resize.

## Data model & migrations

### New column on `categories`

```sql
ALTER TABLE categories ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'unmarked';
```

Values: `'unmarked' | 'studying' | 'complete'`. Validation lives at the API layer — no `CHECK` constraint, matching the codebase's existing migration style.

### Reseed must preserve status

`POST /api/reseed` currently does `TRUNCATE cards, categories, card_stats RESTART IDENTITY CASCADE`, which would wipe the `status` column. New behavior:

1. `DELETE FROM cards` — cards have no preserved state.
2. `DELETE FROM card_stats` — stats reset on reseed today; we keep that.
3. For each seed category:
   ```sql
   INSERT INTO categories (id, label, css_class, group_name)
   VALUES ($1, $2, $3, $4)
   ON CONFLICT (id) DO UPDATE SET
     label = EXCLUDED.label,
     css_class = EXCLUDED.css_class,
     group_name = EXCLUDED.group_name
   ```
   `status` is **not** in the `SET` clause, so existing rows keep their status and new rows get the column default `'unmarked'`.
4. Prune categories that no longer appear in the seed: `DELETE FROM categories WHERE id NOT IN (...seedIds)`. Stats are already wiped, so there's no progress concern with pruning.
5. Re-insert cards as today.

### Initial state on first deploy

Every existing category gets `status = 'unmarked'` from the column default. Per Q11, no auto-migration from `activeCats` — the user marks them manually via the Manage panel.

## API

### Extend `GET /api/cards`

Include `status` in each entry of the categories map:

```json
{
  "cards": [...],
  "categories": {
    "preterite-regular": {
      "cls": "...",
      "label": "Preterite (regular)",
      "group": "Verbs",
      "status": "studying"
    }
  }
}
```

One round trip hydrates everything the professora page needs.

### New `PUT /api/categories/:id/status`

- Body: `{ "status": "unmarked" | "studying" | "complete" }`
- Validate the enum — return 400 on invalid value.
- `UPDATE categories SET status = $1 WHERE id = $2`.
- Return `{ ok: true }`. If 0 rows updated, return 404.

No batch endpoint — flips are user-initiated one at a time.

No auth gate on either route.

### Type addition (`src/types.ts`)

`CatConfig` gains `status: 'unmarked' | 'studying' | 'complete'`:

```ts
export type CategoryStatus = 'unmarked' | 'studying' | 'complete';

export interface CatConfig {
  cls: string;
  label: string;
  group: string;
  status: CategoryStatus;
}
```

## Frontend components & layout

### `stores/categoryStatus.ts`

Exports `setCategoryStatus(id, status)`:

1. Snapshot the current `catConfig` value.
2. Optimistically update `catConfig` (the existing `writable`).
3. `PUT /api/categories/:id/status`.
4. On failure: revert `catConfig` to the snapshot and emit an error event consumed by `ManagePanel.svelte` to show an inline toast ("Couldn't save — try again."). Auto-clears after a few seconds.

No new persisted store; the in-memory `catConfig` is the source of truth on the client.

### `Professora.svelte` (root)

- Hydrates cards once via `hydrateCards()`.
- Picks `ProfessoraDesktop` or `ProfessoraMobile` via a media-query store.
- Renders an inline error if hydration fails (same shape as `App.svelte`).

### Shared subcomponents

- **`ProfessoraHeader.svelte`** — page title + a small "← back to study" link to `/`.
- **`ManagePanel.svelte`** — collapsible (default collapsed). Inside: categories grouped by `group_name` (Verbs, Topics, Phrases, Aulas, Verb Endings, IR, Conjugations, A2). Each row shows the label and a 3-way pill `[Unmarked | Studying | Complete]` driven by `setCategoryStatus`.
- **`ProfessoraFilters.svelte`** — two status chips (Studying, Complete; default Studying on, Complete off) + a category multiselect (chips for each *non-unmarked* category, grouped by `group_name`; selecting none = show all). Filter state lives in component-local stores; not persisted across reloads.
- **`CardGrid.svelte`** — flat grid derived from `(allCards, catConfig, filterState)`. Tile = `pt` (large) + `en` (small below). Insertion order from `/api/cards` (`ORDER BY id`). No virtualization initially.

### Layout differences

- **Desktop:** header bar, filters as a horizontal row, manage panel collapsed up top, grid 3–4 columns wide.
- **Mobile:** header bar, filters stack vertically (status chips on one row, category chips wrap), manage panel slides in as a bottom sheet (reusing the `BottomSheet.svelte` pattern), grid 1–2 columns.

### Entry button on the main app

- **Desktop:** top-right icon button absolutely-positioned in `App.svelte`'s `.main-content`, linking to `/professora`. SVG icon (graduation cap or person).
- **Mobile:** icon button on `MobileTopBar.svelte`, placed to the left of the existing category-selector trigger.

## Error handling & edge cases

| Case | Behavior |
|---|---|
| `GET /api/cards` failure | Inline error in `Professora.svelte`, matches `App.svelte` pattern |
| `PUT /api/categories/:id/status` failure | Optimistic update reverts; toast in Manage panel; auto-clears |
| Invalid status (hand-crafted request) | 400 from server; same toast |
| 404 from PUT (category pruned mid-session) | Toast + force re-hydrate of `/api/cards` |
| All categories unmarked | Empty grid + "No categories marked yet — open Manage to set some." |
| Both status filters off | Empty grid + "Pick a status filter." |
| Direct nav to `/professora` | SPA fallback ships with this change |

## Testing

Playwright, matching existing conventions (single worker, two projects: `chromium` + `mobile`).

- **`tests/professora.spec.js`** (chromium): visit `/professora`, verify grid empty initially, open Manage panel, flip one category to Studying and one to Complete, verify tiles appear, toggle status filter chips, toggle category multiselect, verify expected tiles render. Uses `tests/fixtures/reset.js` between tests.
- **`tests/professora.mobile.spec.js`** (mobile): same flow against the mobile component (Manage panel as bottom sheet, single-column grid).
- **Reseed-preserves-status** (in `professora.spec.js`): mark a category Studying, `POST /api/reseed`, reload `/professora`, verify the category is still Studying.
- **Entry-button** (chromium): from `/`, click the desktop icon, assert URL is `/professora`. Same on mobile via `MobileTopBar`.

## Out of scope

Explicitly not in this design:

- Auth / token gating of any kind.
- Audio (TTS) on card tiles.
- Stats indicators on tiles (right/wrong, recent_history).
- List virtualization (revisit only if real-world performance demands it).
- Batch status endpoint.
- `/professora/manage` sub-route.
- Bulk actions in the Manage panel (multi-select + "Mark all as ...").
- Auto-migration from `activeCats` to `studying`.

## Files touched (preview)

**New:**
- `src/Professora.svelte`
- `src/lib/ProfessoraDesktop.svelte`
- `src/lib/ProfessoraMobile.svelte`
- `src/lib/ProfessoraHeader.svelte`
- `src/lib/ManagePanel.svelte`
- `src/lib/ProfessoraFilters.svelte`
- `src/lib/CardGrid.svelte`
- `src/stores/categoryStatus.ts`
- `tests/professora.spec.js`
- `tests/professora.mobile.spec.js`

**Modified:**
- `server.js` — column migration, reseed rewrite, `GET /api/cards` extension, new `PUT /api/categories/:id/status`, SPA fallback.
- `src/types.ts` — `CatConfig.status` + `CategoryStatus` type.
- `src/main.ts` — pathname branch.
- `src/App.svelte` — desktop entry icon in `.main-content`.
- `src/lib/MobileTopBar.svelte` — mobile entry icon.
- `CLAUDE.md` — note the new route and data model in the architecture section.
