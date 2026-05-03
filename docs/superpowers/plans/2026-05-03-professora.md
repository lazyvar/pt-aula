# Professora Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/professora` page where the user's Brazilian Portuguese teacher can see what the user is studying / has completed, doubling as the management surface where the user marks each category's status (`unmarked` / `studying` / `complete`).

**Architecture:** A second Svelte tree is mounted by `main.ts` based on `window.location.pathname` — `App.svelte` for `/`, `Professora.svelte` for `/professora`. Express adds an SPA fallback so any `/professora` URL serves `dist/index.html`. A new `status` column on the `categories` table holds per-category state, surfaced in `GET /api/cards` and mutated via a new `PUT /api/categories/:id/status`. Reseed is rewritten to preserve `status` across reseeds. Frontend uses optimistic updates with revert-on-failure.

**Tech Stack:** Svelte 4 + TypeScript, Vite, Express, Postgres (`pg`), Playwright (single worker, two projects: `chromium` and `mobile`).

**Spec:** [`docs/superpowers/specs/2026-05-03-professora-design.md`](../specs/2026-05-03-professora-design.md)

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `server.js` | Modify | Add `status` column migration; extend `GET /api/cards`; new `PUT /api/categories/:id/status`; rewrite `/api/reseed` to preserve status; SPA fallback for `/professora`. |
| `src/types.ts` | Modify | Add `CategoryStatus` type + `status` field on `CatConfig`. |
| `src/main.ts` | Modify | Branch on `window.location.pathname` to pick `App` vs. `Professora`. |
| `src/stores/cards.ts` | Modify | Hydrate now includes `status` (no logic change — types only). |
| `src/stores/categoryStatus.ts` | Create | `setCategoryStatus(id, status)` with optimistic update + PUT + revert. |
| `src/stores/professoraFilters.ts` | Create | Filter state writable: `{ studying, complete, categoryIds }`. |
| `src/Professora.svelte` | Create | Root: hydrates cards, picks desktop/mobile child via media query, shows error/loading. |
| `src/lib/ProfessoraDesktop.svelte` | Create | Desktop layout (header + filters row + manage panel + grid). |
| `src/lib/ProfessoraMobile.svelte` | Create | Mobile layout (header + filters stacked + manage as bottom sheet + grid). |
| `src/lib/ProfessoraHeader.svelte` | Create | Title + "← back to study" link. |
| `src/lib/StatusPill.svelte` | Create | 3-way pill widget [Unmarked\|Studying\|Complete] for one category. |
| `src/lib/ManagePanel.svelte` | Create | Collapsible panel listing categories grouped by `group_name`, each with a `StatusPill`. |
| `src/lib/ProfessoraFilters.svelte` | Create | Status chips + category multiselect chips. |
| `src/lib/CardGrid.svelte` | Create | Flat grid; tiles show `pt` (large) + `en` (small); empty states. |
| `src/App.svelte` | Modify | Desktop entry icon, top-right of `.main-content`. |
| `src/lib/MobileTopBar.svelte` | Modify | Mobile entry icon, left of the existing selector. |
| `playwright.config.js` | Modify | Ignore `professora.mobile.spec.js` in `chromium`; include in `mobile`. |
| `tests/professora.spec.js` | Create | Desktop integration tests (API contract, page render, manage panel, filters, error handling, reseed preservation, entry button). |
| `tests/professora.mobile.spec.js` | Create | Mobile-specific tests (entry icon, manage as bottom sheet, single-column grid). |
| `CLAUDE.md` | Modify | Note new route, status column, reseed semantics. |

---

## Verification approach

The repo has no JS unit-test runner. All automated tests are Playwright integration tests. Each task's verification runs Playwright (or a single test) against the built app.

When a task changes frontend code, the engineer must rebuild before running tests:

```bash
npm run build
```

Then either run the full suite with `npm test`, or — for fast feedback on a single test — make sure the test DB is up and run a single spec:

```bash
docker compose -f docker-compose.test.yml up -d --wait
npx playwright test tests/professora.spec.js --project=chromium
```

When the task is purely backend (only `server.js`), no rebuild is required; Playwright's webServer reads `server.js` directly.

After every task: commit immediately. Frequent commits per CLAUDE.md.

---

### Task 1: DB column for category status and surfacing in `GET /api/cards`

**Files:**
- Modify: `server.js` — add `ALTER TABLE` in `init()` (around `server.js:42-49`); modify `GET /api/cards` (around `server.js:627-636`).
- Create: `tests/professora.spec.js`.

- [ ] **Step 1: Write the failing test**

Create `tests/professora.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const { resetAll, BASE } = require('./fixtures/reset');

test.describe('Professora', () => {
  test.beforeEach(async () => {
    await resetAll();
  });

  test('GET /api/cards returns status on each category, defaulting to "unmarked"', async ({ request }) => {
    const res = await request.get(`${BASE}/api/cards`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.categories).toBeTruthy();
    const ids = Object.keys(body.categories);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(body.categories[id]).toMatchObject({
        cls: expect.any(String),
        label: expect.any(String),
        group: expect.any(String),
        status: 'unmarked',
      });
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
docker compose -f docker-compose.test.yml up -d --wait
npx playwright test tests/professora.spec.js --project=chromium
```

Expected: FAIL — `status` is missing from the categories map (current shape is `{ cls, label, group }`).

- [ ] **Step 3: Add the column migration**

In `server.js`, inside `init()`, just below the existing `ALTER TABLE categories ADD COLUMN IF NOT EXISTS group_name ...` line (currently `server.js:49`), add:

```js
await pool.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'unmarked'`);
```

- [ ] **Step 4: Surface `status` in `GET /api/cards`**

Modify the `SELECT` and the response-building loop in the `app.get("/api/cards", ...)` handler (currently `server.js:628-635`). Replace:

```js
const { rows: catRows } = await pool.query("SELECT id, label, css_class, group_name FROM categories");
const categories = {};
for (const row of catRows) {
  categories[row.id] = { cls: row.css_class, label: row.label, group: row.group_name };
}
```

with:

```js
const { rows: catRows } = await pool.query("SELECT id, label, css_class, group_name, status FROM categories");
const categories = {};
for (const row of catRows) {
  categories[row.id] = { cls: row.css_class, label: row.label, group: row.group_name, status: row.status };
}
```

- [ ] **Step 5: Run the test to verify it passes**

```bash
npx playwright test tests/professora.spec.js --project=chromium
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server.js tests/professora.spec.js
git commit -m "feat(api): add category.status column and expose it in /api/cards"
```

---

### Task 2: `PUT /api/categories/:id/status` endpoint

**Files:**
- Modify: `server.js` — add a new route handler. Place it just above `// GET /api/cards — return all cards and categories` (currently `server.js:626`).
- Modify: `tests/professora.spec.js` — add tests.

- [ ] **Step 1: Write the failing tests**

Append to the existing `test.describe('Professora', ...)` block in `tests/professora.spec.js`:

```js
  test('PUT /api/categories/:id/status updates status and persists', async ({ request }) => {
    const res0 = await request.get(`${BASE}/api/cards`);
    const ids = Object.keys((await res0.json()).categories);
    const id = ids[0];

    const put = await request.put(`${BASE}/api/categories/${encodeURIComponent(id)}/status`, {
      data: { status: 'studying' },
    });
    expect(put.ok()).toBe(true);
    expect(await put.json()).toEqual({ ok: true });

    const res1 = await request.get(`${BASE}/api/cards`);
    const cats = (await res1.json()).categories;
    expect(cats[id].status).toBe('studying');
  });

  test('PUT rejects invalid status with 400', async ({ request }) => {
    const res0 = await request.get(`${BASE}/api/cards`);
    const id = Object.keys((await res0.json()).categories)[0];

    const put = await request.put(`${BASE}/api/categories/${encodeURIComponent(id)}/status`, {
      data: { status: 'bogus' },
    });
    expect(put.status()).toBe(400);
  });

  test('PUT returns 404 for unknown category id', async ({ request }) => {
    const put = await request.put(`${BASE}/api/categories/does-not-exist/status`, {
      data: { status: 'studying' },
    });
    expect(put.status()).toBe(404);
  });
```

- [ ] **Step 2: Run tests to verify failures**

```bash
npx playwright test tests/professora.spec.js --project=chromium
```

Expected: 3 failures — endpoint not yet implemented (likely 404 with HTML body for the first two; the 404 test may incidentally pass against the static-fallback in the future, so confirm all 3 currently fail because the route is unhandled).

- [ ] **Step 3: Implement the endpoint**

Insert above the `GET /api/cards` handler (around `server.js:626`):

```js
// PUT /api/categories/:id/status — body: { status: 'unmarked' | 'studying' | 'complete' }
const VALID_CATEGORY_STATUSES = new Set(['unmarked', 'studying', 'complete']);
app.put("/api/categories/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!VALID_CATEGORY_STATUSES.has(status)) {
    return res.status(400).json({ error: "status must be one of: unmarked, studying, complete" });
  }
  const result = await pool.query(
    "UPDATE categories SET status = $1 WHERE id = $2",
    [status, id]
  );
  if (result.rowCount === 0) {
    return res.status(404).json({ error: "category not found" });
  }
  res.json({ ok: true });
});
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx playwright test tests/professora.spec.js --project=chromium
```

Expected: all PASS (4 tests now: the original `GET` test plus 3 new ones).

- [ ] **Step 5: Commit**

```bash
git add server.js tests/professora.spec.js
git commit -m "feat(api): add PUT /api/categories/:id/status"
```

---

### Task 3: Reseed preserves category status

**Files:**
- Modify: `server.js` — rewrite the `app.post("/api/reseed", ...)` handler (currently `server.js:167-194`).
- Modify: `tests/professora.spec.js` — add reseed-preservation test.

- [ ] **Step 1: Write the failing test**

Append to the existing describe block in `tests/professora.spec.js`:

```js
  test('reseed preserves category status', async ({ request }) => {
    const res0 = await request.get(`${BASE}/api/cards`);
    const id = Object.keys((await res0.json()).categories)[0];

    await request.put(`${BASE}/api/categories/${encodeURIComponent(id)}/status`, {
      data: { status: 'complete' },
    });

    const reseed = await request.post(`${BASE}/api/reseed`);
    expect(reseed.ok()).toBe(true);

    const res1 = await request.get(`${BASE}/api/cards`);
    const cats = (await res1.json()).categories;
    expect(cats[id]).toBeTruthy();
    expect(cats[id].status).toBe('complete');
  });
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx playwright test tests/professora.spec.js --project=chromium -g "reseed preserves"
```

Expected: FAIL — current `/api/reseed` `TRUNCATE`s `categories`, wiping the column.

- [ ] **Step 3: Rewrite the reseed handler**

Replace the entire `app.post("/api/reseed", ...)` handler body (currently `server.js:167-194`) with:

```js
// POST /api/reseed — refresh cards/categories from seeds while PRESERVING category.status.
// We don't TRUNCATE categories anymore — we upsert label/css_class/group_name and
// leave `status` untouched. Removed categories are pruned (status loss is acceptable
// for categories the user has explicitly removed from seeds).
app.post("/api/reseed", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // 1. Wipe cards and stats. Cards have no preserved state; stats reset is current behavior.
    await client.query("DELETE FROM cards");
    await client.query("DELETE FROM card_stats");
    await client.query("DELETE FROM session");
    // 2. Upsert categories (preserve status by NOT touching it in DO UPDATE).
    for (const cat of categories) {
      await client.query(
        `INSERT INTO categories (id, label, css_class, group_name)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id) DO UPDATE SET
           label = EXCLUDED.label,
           css_class = EXCLUDED.css_class,
           group_name = EXCLUDED.group_name`,
        [cat.id, cat.label, cat.css_class, cat.group_name]
      );
    }
    // 3. Prune categories no longer in the seed.
    const seedIds = categories.map((c) => c.id);
    await client.query("DELETE FROM categories WHERE id <> ALL($1)", [seedIds]);
    // 4. Re-insert cards (all reference categories that now exist).
    for (const card of cards) {
      await client.query(
        "INSERT INTO cards (pt, en, category_id) VALUES ($1, $2, $3)",
        [card.pt, card.en, card.category_id]
      );
    }
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Reseed failed:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});
```

- [ ] **Step 4: Update `tests/fixtures/reset.js` to reset statuses**

Reseed now preserves `status`, but the test fixture needs every test to start with all categories unmarked. Replace the `resetAll` function in `tests/fixtures/reset.js` with:

```js
async function resetAll() {
  // 1. Reseed cards + categories from ./seeds. Reseed now PRESERVES category.status,
  //    so we explicitly reset statuses below — reseed alone won't clear them.
  const reseedRes = await fetch(`${BASE}/api/reseed`, { method: 'POST' });
  if (!reseedRes.ok) throw new Error(`reseed failed: ${reseedRes.status}`);

  // 2. Clear card stats
  const statsRes = await fetch(`${BASE}/api/stats`, { method: 'DELETE' });
  if (!statsRes.ok) throw new Error(`delete stats failed: ${statsRes.status}`);

  // 3. Reset all category statuses to 'unmarked'.
  const cardsRes = await fetch(`${BASE}/api/cards`);
  if (!cardsRes.ok) throw new Error(`get cards failed: ${cardsRes.status}`);
  const { categories } = await cardsRes.json();
  for (const id of Object.keys(categories)) {
    const r = await fetch(
      `${BASE}/api/categories/${encodeURIComponent(id)}/status`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'unmarked' }),
      }
    );
    if (!r.ok) throw new Error(`reset status for ${id} failed: ${r.status}`);
  }

  // 4. Delete the session row. GET /api/session then returns null, which makes
  //    the frontend fall through to startDeck() with its default activeCats
  //    (all non-Topics categories). PUT with activeCats:null would clobber
  //    that default and leave an empty deck, so we DELETE instead.
  const sessionRes = await fetch(`${BASE}/api/session`, { method: 'DELETE' });
  if (!sessionRes.ok) throw new Error(`delete session failed: ${sessionRes.status}`);
}
```

- [ ] **Step 5: Run the new test plus all earlier tests to confirm no regression**

```bash
npx playwright test tests/professora.spec.js --project=chromium
```

Expected: all PASS.

Also run the full suite to confirm nothing else broke:

```bash
npm run build
npx playwright test
```

Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add server.js tests/fixtures/reset.js tests/professora.spec.js
git commit -m "feat(api): preserve category.status across /api/reseed"
```

---

### Task 4: SPA fallback so `/professora` serves `dist/index.html`

**Files:**
- Modify: `server.js` — add a fallback route after the static middleware and after all `/api/*` routes. The existing static middleware at the top of the file (`server.js:17`) won't fall back to `index.html` for unknown paths, so direct nav to `/professora` 404s today.
- Modify: `tests/professora.spec.js` — add a fallback test.

- [ ] **Step 1: Write the failing test**

Append to the describe block in `tests/professora.spec.js`:

```js
  test('GET /professora serves the SPA shell', async ({ request }) => {
    const res = await request.get(`${BASE}/professora`);
    expect(res.ok()).toBe(true);
    const ct = res.headers()['content-type'] || '';
    expect(ct).toContain('text/html');
    const body = await res.text();
    expect(body).toContain('<div id="app">');
  });
```

(Confirm `index.html` contains `<div id="app">` — that's the mount target referenced by `src/main.ts:5`.)

- [ ] **Step 2: Run the test to verify it fails**

```bash
npx playwright test tests/professora.spec.js --project=chromium -g "serves the SPA shell"
```

Expected: FAIL — request to `/professora` 404s.

- [ ] **Step 3: Add the SPA fallback**

In `server.js`, just above the final `init().then(...)` block (around `server.js:638`), add:

```js
// SPA fallback: any /professora[/...] URL returns the built index.html.
// Placed AFTER express.static and AFTER all /api/* routes so it can't shadow them.
app.get(/^\/professora(\/.*)?$/, (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
```

- [ ] **Step 4: Make sure `dist/index.html` exists for the test, then run**

```bash
npm run build
npx playwright test tests/professora.spec.js --project=chromium -g "serves the SPA shell"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add server.js tests/professora.spec.js
git commit -m "feat(server): SPA fallback for /professora routes"
```

---

### Task 5: Types + `main.ts` pathname branch + Professora stub component

**Files:**
- Modify: `src/types.ts`.
- Modify: `src/main.ts`.
- Create: `src/Professora.svelte` (stub — full content arrives in later tasks).
- Modify: `tests/professora.spec.js` — add a render test.

- [ ] **Step 1: Write the failing test**

Append to the describe block in `tests/professora.spec.js`:

```js
  test('navigating to /professora renders the professora page (not the study app)', async ({ page }) => {
    await page.goto(`${BASE}/professora`);
    await expect(page.getByTestId('professora-page')).toBeVisible();
    await expect(page.getByTestId('card-container')).toHaveCount(0);
  });
```

(`card-container` is the test ID used by `CardDeck.svelte` for the study app's main element — pick the right test ID by searching the codebase: `grep -rn 'data-testid="card-container"' src/`.)

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run build
npx playwright test tests/professora.spec.js --project=chromium -g "renders the professora page"
```

Expected: FAIL — no `[data-testid="professora-page"]` element exists.

- [ ] **Step 3: Update `src/types.ts`**

Replace the existing `CatConfig` block:

```ts
export interface CatConfig {
  cls: string;
  label: string;
  group: string;
}
```

with:

```ts
export type CategoryStatus = 'unmarked' | 'studying' | 'complete';

export interface CatConfig {
  cls: string;
  label: string;
  group: string;
  status: CategoryStatus;
}
```

`CatConfigMap` (just below) is unchanged.

- [ ] **Step 4: Create the Professora stub**

Create `src/Professora.svelte`:

```svelte
<script lang="ts">
  // Stub. Full content arrives in subsequent tasks.
</script>

<main data-testid="professora-page" style="padding:40px;color:#f0f0f0">
  <h1>Professora</h1>
  <p>Coming soon.</p>
</main>
```

- [ ] **Step 5: Update `src/main.ts` to branch on pathname**

Replace the entire contents of `src/main.ts` with:

```ts
import './app.css';
import App from './App.svelte';
import Professora from './Professora.svelte';

const isProfessora = window.location.pathname === '/professora'
  || window.location.pathname.startsWith('/professora/');

const Component = isProfessora ? Professora : App;

const app = new Component({
  target: document.getElementById('app')!,
});

export default app;
```

- [ ] **Step 6: Type-check**

```bash
npm run check
```

Expected: no new errors. (Pre-existing errors, if any, are unchanged.)

- [ ] **Step 7: Build and run the test**

```bash
npm run build
npx playwright test tests/professora.spec.js --project=chromium -g "renders the professora page"
```

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/types.ts src/main.ts src/Professora.svelte tests/professora.spec.js
git commit -m "feat(professora): pathname routing and stub page"
```

---

### Task 6: Filter store + responsive child picker + header + filter chips (Studying/Complete)

**Files:**
- Create: `src/stores/professoraFilters.ts`.
- Create: `src/lib/ProfessoraHeader.svelte`.
- Create: `src/lib/ProfessoraFilters.svelte` (status chips only — category multiselect added in Task 9).
- Create: `src/lib/ProfessoraDesktop.svelte`.
- Create: `src/lib/ProfessoraMobile.svelte`.
- Modify: `src/Professora.svelte` — replace the stub with the real shell.
- Modify: `tests/professora.spec.js` — add filter-default test.

- [ ] **Step 1: Write the failing test**

Append to `tests/professora.spec.js`:

```js
  test('filter chips render with Studying selected, Complete deselected by default', async ({ page }) => {
    await page.goto(`${BASE}/professora`);
    await expect(page.getByTestId('filter-status-studying')).toBeVisible();
    await expect(page.getByTestId('filter-status-complete')).toBeVisible();
    await expect(page.getByTestId('filter-status-studying')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('filter-status-complete')).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking the back link navigates to /', async ({ page }) => {
    await page.goto(`${BASE}/professora`);
    await page.getByTestId('professora-back').click();
    await expect(page).toHaveURL(`${BASE}/`);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm run build
npx playwright test tests/professora.spec.js --project=chromium -g "filter chips render|back link"
```

Expected: 2 FAIL.

- [ ] **Step 3: Create the filter store**

Create `src/stores/professoraFilters.ts`:

```ts
import { writable } from 'svelte/store';

export interface ProfessoraFilters {
  studying: boolean;
  complete: boolean;
  // category ids the user has restricted to. Empty = no restriction (show all
  // non-unmarked categories matching the status filters).
  categoryIds: string[];
}

export const professoraFilters = writable<ProfessoraFilters>({
  studying: true,
  complete: false,
  categoryIds: [],
});
```

- [ ] **Step 4: Create the header**

Create `src/lib/ProfessoraHeader.svelte`:

```svelte
<header class="professora-header">
  <a href="/" data-testid="professora-back" class="back-link">← back to study</a>
  <h1>Professora</h1>
</header>

<style>
  .professora-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
  }
  .back-link {
    color: var(--text-dim, #8892a4);
    text-decoration: none;
    font-size: 0.9rem;
  }
  .back-link:hover { color: var(--text, #f0f0f0); }
  h1 {
    font-size: 1.4rem;
    font-weight: 500;
  }
</style>
```

- [ ] **Step 5: Create the filters component (status chips only)**

Create `src/lib/ProfessoraFilters.svelte`:

```svelte
<script lang="ts">
  import { professoraFilters } from '../stores/professoraFilters';

  function toggle(key: 'studying' | 'complete') {
    professoraFilters.update((f) => ({ ...f, [key]: !f[key] }));
  }
</script>

<div class="filters">
  <div class="status-chips">
    <button
      type="button"
      class="chip"
      class:on={$professoraFilters.studying}
      data-testid="filter-status-studying"
      aria-pressed={$professoraFilters.studying}
      on:click={() => toggle('studying')}
    >Studying</button>
    <button
      type="button"
      class="chip"
      class:on={$professoraFilters.complete}
      data-testid="filter-status-complete"
      aria-pressed={$professoraFilters.complete}
      on:click={() => toggle('complete')}
    >Complete</button>
  </div>
</div>

<style>
  .filters { padding: 12px 20px; }
  .status-chips { display: flex; gap: 8px; }
  .chip {
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.15);
    background: transparent;
    color: var(--text-dim, #8892a4);
    cursor: pointer;
    font-size: 0.9rem;
  }
  .chip.on {
    background: var(--accent, #e94560);
    color: white;
    border-color: transparent;
  }
</style>
```

- [ ] **Step 6: Create the desktop layout**

Create `src/lib/ProfessoraDesktop.svelte`:

```svelte
<script lang="ts">
  import ProfessoraHeader from './ProfessoraHeader.svelte';
  import ProfessoraFilters from './ProfessoraFilters.svelte';
</script>

<div class="professora-desktop" data-testid="professora-desktop">
  <ProfessoraHeader />
  <ProfessoraFilters />
  <!-- Manage panel + grid arrive in later tasks. -->
</div>

<style>
  .professora-desktop {
    max-width: 1100px;
    margin: 0 auto;
  }
</style>
```

- [ ] **Step 7: Create the mobile layout**

Create `src/lib/ProfessoraMobile.svelte`:

```svelte
<script lang="ts">
  import ProfessoraHeader from './ProfessoraHeader.svelte';
  import ProfessoraFilters from './ProfessoraFilters.svelte';
</script>

<div class="professora-mobile" data-testid="professora-mobile">
  <ProfessoraHeader />
  <ProfessoraFilters />
  <!-- Manage as bottom sheet + grid arrive in later tasks. -->
</div>
```

- [ ] **Step 8: Replace the Professora stub**

Replace the contents of `src/Professora.svelte` with:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { hydrateCards } from './stores/cards';
  import ProfessoraDesktop from './lib/ProfessoraDesktop.svelte';
  import ProfessoraMobile from './lib/ProfessoraMobile.svelte';

  let loaded = false;
  let error: string | null = null;
  let isMobile = false;

  // Standard mobile breakpoint (matches the existing app's split). Re-evaluate on resize.
  let mql: MediaQueryList | null = null;
  function syncIsMobile() {
    if (mql) isMobile = mql.matches;
  }

  onMount(() => {
    mql = window.matchMedia('(max-width: 768px)');
    syncIsMobile();
    mql.addEventListener('change', syncIsMobile);

    (async () => {
      try {
        await hydrateCards();
        loaded = true;
      } catch (err) {
        error = err instanceof Error ? err.message : String(err);
      }
    })();
  });

  onDestroy(() => {
    if (mql) mql.removeEventListener('change', syncIsMobile);
  });
</script>

{#if error}
  <main data-testid="professora-page" style="padding:40px;color:red">Error: {error}</main>
{:else if !loaded}
  <main data-testid="professora-page" style="padding:40px">Loading…</main>
{:else}
  <main data-testid="professora-page">
    {#if isMobile}
      <ProfessoraMobile />
    {:else}
      <ProfessoraDesktop />
    {/if}
  </main>
{/if}
```

- [ ] **Step 9: Build and run the tests**

```bash
npm run build
npx playwright test tests/professora.spec.js --project=chromium
```

Expected: all PASS (the existing tests continue to pass; the two new ones now pass).

- [ ] **Step 10: Commit**

```bash
git add src/Professora.svelte src/lib/ProfessoraDesktop.svelte src/lib/ProfessoraMobile.svelte src/lib/ProfessoraHeader.svelte src/lib/ProfessoraFilters.svelte src/stores/professoraFilters.ts tests/professora.spec.js
git commit -m "feat(professora): page shell, header, status filter chips"
```

---

### Task 7: `categoryStatus` store + `StatusPill` + `ManagePanel`

**Files:**
- Create: `src/stores/categoryStatus.ts`.
- Create: `src/lib/StatusPill.svelte`.
- Create: `src/lib/ManagePanel.svelte`.
- Modify: `src/lib/ProfessoraDesktop.svelte` — render the panel.
- Modify: `src/lib/ProfessoraMobile.svelte` — render the panel (collapsed by default; bottom-sheet treatment lands in Task 14).
- Modify: `tests/professora.spec.js` — add manage-panel test.

- [ ] **Step 1: Write the failing test**

Append to `tests/professora.spec.js`:

```js
  test('manage panel: marking a category Studying persists across reload', async ({ page, request }) => {
    await page.goto(`${BASE}/professora`);
    // Open the panel.
    await page.getByTestId('manage-panel-toggle').click();
    await expect(page.getByTestId('manage-panel-body')).toBeVisible();

    // Pick the first category row and click Studying.
    const firstRow = page.getByTestId('manage-row').first();
    const catId = await firstRow.getAttribute('data-cat-id');
    expect(catId).toBeTruthy();
    await firstRow.getByTestId('pill-studying').click();

    // Verify aria-pressed flipped.
    await expect(firstRow.getByTestId('pill-studying')).toHaveAttribute('aria-pressed', 'true');
    await expect(firstRow.getByTestId('pill-unmarked')).toHaveAttribute('aria-pressed', 'false');

    // Verify server-side via API.
    const res = await request.get(`${BASE}/api/cards`);
    const cats = (await res.json()).categories;
    expect(cats[catId!].status).toBe('studying');

    // Reload and verify the panel still shows Studying for that row.
    await page.reload();
    await page.getByTestId('manage-panel-toggle').click();
    const sameRow = page.locator(`[data-testid="manage-row"][data-cat-id="${catId}"]`);
    await expect(sameRow.getByTestId('pill-studying')).toHaveAttribute('aria-pressed', 'true');
  });
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run build
npx playwright test tests/professora.spec.js --project=chromium -g "manage panel"
```

Expected: FAIL — toggle doesn't exist yet.

- [ ] **Step 3: Create the `categoryStatus` store**

Create `src/stores/categoryStatus.ts`:

```ts
import { get, writable } from 'svelte/store';
import type { CategoryStatus } from '../types';
import { catConfig } from './cards';

// Last error message, surfaced by ManagePanel as a small inline toast.
// Cleared after a short delay.
export const statusError = writable<string | null>(null);

let clearTimer: ReturnType<typeof setTimeout> | null = null;
function flashError(msg: string) {
  statusError.set(msg);
  if (clearTimer) clearTimeout(clearTimer);
  clearTimer = setTimeout(() => statusError.set(null), 4000);
}

export async function setCategoryStatus(id: string, status: CategoryStatus): Promise<void> {
  const before = get(catConfig);
  const entry = before[id];
  if (!entry) {
    flashError("Couldn't save — category not found.");
    return;
  }
  // Optimistic update.
  catConfig.set({ ...before, [id]: { ...entry, status } });

  let res: Response;
  try {
    res = await fetch(`/api/categories/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch (e) {
    catConfig.set(before);
    flashError("Couldn't save — try again.");
    return;
  }

  if (!res.ok) {
    catConfig.set(before);
    flashError("Couldn't save — try again.");
  }
}
```

- [ ] **Step 4: Create the `StatusPill` component**

Create `src/lib/StatusPill.svelte`:

```svelte
<script lang="ts">
  import type { CategoryStatus } from '../types';
  import { setCategoryStatus } from '../stores/categoryStatus';

  export let categoryId: string;
  export let status: CategoryStatus;

  const options: Array<{ value: CategoryStatus; label: string; testId: string }> = [
    { value: 'unmarked', label: 'Unmarked', testId: 'pill-unmarked' },
    { value: 'studying', label: 'Studying', testId: 'pill-studying' },
    { value: 'complete', label: 'Complete', testId: 'pill-complete' },
  ];
</script>

<div class="pill" role="group" aria-label="Category status">
  {#each options as opt}
    <button
      type="button"
      class="seg"
      class:on={status === opt.value}
      data-testid={opt.testId}
      aria-pressed={status === opt.value}
      on:click={() => setCategoryStatus(categoryId, opt.value)}
    >{opt.label}</button>
  {/each}
</div>

<style>
  .pill {
    display: inline-flex;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 999px;
    overflow: hidden;
  }
  .seg {
    padding: 4px 12px;
    font-size: 0.8rem;
    background: transparent;
    color: var(--text-dim, #8892a4);
    border: none;
    cursor: pointer;
  }
  .seg + .seg { border-left: 1px solid rgba(255,255,255,0.1); }
  .seg.on {
    background: var(--accent, #e94560);
    color: white;
  }
</style>
```

- [ ] **Step 5: Create the `ManagePanel` component**

Create `src/lib/ManagePanel.svelte`:

```svelte
<script lang="ts">
  import { catConfig } from '../stores/cards';
  import { statusError } from '../stores/categoryStatus';
  import StatusPill from './StatusPill.svelte';

  export let defaultOpen = false;
  let open = defaultOpen;

  // Group categories by group_name; preserve insertion order from the server map.
  $: grouped = (() => {
    const map = new Map<string, Array<[string, typeof $catConfig[string]]>>();
    for (const [id, cfg] of Object.entries($catConfig)) {
      const g = cfg.group;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push([id, cfg]);
    }
    return Array.from(map.entries());
  })();
</script>

<section class="manage" data-testid="manage-panel">
  <button
    type="button"
    class="toggle"
    data-testid="manage-panel-toggle"
    aria-expanded={open}
    on:click={() => (open = !open)}
  >
    {open ? '▾' : '▸'} Manage categories
  </button>

  {#if $statusError}
    <div class="error-toast" data-testid="manage-error">{$statusError}</div>
  {/if}

  {#if open}
    <div class="body" data-testid="manage-panel-body">
      {#each grouped as [groupName, entries]}
        <div class="group">
          <h3 class="group-name">{groupName}</h3>
          <ul class="rows">
            {#each entries as [id, cfg]}
              <li class="row" data-testid="manage-row" data-cat-id={id}>
                <span class="label">{cfg.label}</span>
                <StatusPill categoryId={id} status={cfg.status} />
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    </div>
  {/if}
</section>

<style>
  .manage { padding: 12px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); }
  .toggle {
    background: transparent;
    border: none;
    color: var(--text, #f0f0f0);
    font-size: 0.95rem;
    cursor: pointer;
    padding: 6px 0;
  }
  .error-toast {
    margin: 8px 0;
    padding: 8px 12px;
    background: rgba(231,76,60,0.15);
    border: 1px solid rgba(231,76,60,0.4);
    border-radius: 6px;
    color: #ffb4ab;
    font-size: 0.85rem;
  }
  .body { margin-top: 12px; display: flex; flex-direction: column; gap: 16px; }
  .group-name {
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-dim, #8892a4);
    margin-bottom: 6px;
  }
  .rows { list-style: none; display: flex; flex-direction: column; gap: 6px; }
  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }
  .label { font-size: 0.95rem; }
</style>
```

- [ ] **Step 6: Render the panel in both layouts**

In `src/lib/ProfessoraDesktop.svelte`, change the script imports and the markup:

```svelte
<script lang="ts">
  import ProfessoraHeader from './ProfessoraHeader.svelte';
  import ProfessoraFilters from './ProfessoraFilters.svelte';
  import ManagePanel from './ManagePanel.svelte';
</script>

<div class="professora-desktop" data-testid="professora-desktop">
  <ProfessoraHeader />
  <ManagePanel />
  <ProfessoraFilters />
  <!-- CardGrid arrives in Task 8. -->
</div>

<style>
  .professora-desktop {
    max-width: 1100px;
    margin: 0 auto;
  }
</style>
```

In `src/lib/ProfessoraMobile.svelte`, do the same (Task 14 will replace the inline panel with a bottom sheet):

```svelte
<script lang="ts">
  import ProfessoraHeader from './ProfessoraHeader.svelte';
  import ProfessoraFilters from './ProfessoraFilters.svelte';
  import ManagePanel from './ManagePanel.svelte';
</script>

<div class="professora-mobile" data-testid="professora-mobile">
  <ProfessoraHeader />
  <ManagePanel />
  <ProfessoraFilters />
</div>
```

- [ ] **Step 7: Build and run the test**

```bash
npm run build
npx playwright test tests/professora.spec.js --project=chromium -g "manage panel"
```

Expected: PASS.

Re-run the whole spec to confirm no regressions:

```bash
npx playwright test tests/professora.spec.js --project=chromium
```

Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add src/stores/categoryStatus.ts src/lib/StatusPill.svelte src/lib/ManagePanel.svelte src/lib/ProfessoraDesktop.svelte src/lib/ProfessoraMobile.svelte tests/professora.spec.js
git commit -m "feat(professora): manage panel with 3-way status pills"
```

---

### Task 8: `CardGrid` — render filtered cards

**Files:**
- Create: `src/lib/CardGrid.svelte`.
- Modify: `src/lib/ProfessoraDesktop.svelte` and `src/lib/ProfessoraMobile.svelte` — render the grid.
- Modify: `tests/professora.spec.js` — add grid test.

- [ ] **Step 1: Write the failing test**

Append to `tests/professora.spec.js`:

```js
  test('grid shows cards from Studying categories only by default', async ({ page, request }) => {
    // Seed: mark exactly two categories — one studying, one complete.
    const res0 = await request.get(`${BASE}/api/cards`);
    const { categories, cards } = await res0.json();
    const ids = Object.keys(categories);
    const studyingId = ids[0];
    const completeId = ids[1];
    await request.put(`${BASE}/api/categories/${encodeURIComponent(studyingId)}/status`, { data: { status: 'studying' } });
    await request.put(`${BASE}/api/categories/${encodeURIComponent(completeId)}/status`, { data: { status: 'complete' } });

    const studyingPt = cards.find((c) => c.cat === studyingId).pt;
    const completePt = cards.find((c) => c.cat === completeId).pt;

    await page.goto(`${BASE}/professora`);
    // Default filter: Studying only.
    await expect(page.getByTestId('card-grid')).toBeVisible();
    await expect(page.getByTestId('card-tile').filter({ hasText: studyingPt })).toBeVisible();
    await expect(page.getByTestId('card-tile').filter({ hasText: completePt })).toHaveCount(0);

    // Click the Complete chip on; both should now be visible.
    await page.getByTestId('filter-status-complete').click();
    await expect(page.getByTestId('card-tile').filter({ hasText: completePt })).toBeVisible();
    await expect(page.getByTestId('card-tile').filter({ hasText: studyingPt })).toBeVisible();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run build
npx playwright test tests/professora.spec.js --project=chromium -g "grid shows cards"
```

Expected: FAIL — no `card-grid` element exists.

- [ ] **Step 3: Create `CardGrid.svelte`**

Create `src/lib/CardGrid.svelte`:

```svelte
<script lang="ts">
  import { allCards, catConfig } from '../stores/cards';
  import { professoraFilters } from '../stores/professoraFilters';

  // Set of category ids to include given the current filter state.
  $: includedCatIds = (() => {
    const cfg = $catConfig;
    const f = $professoraFilters;
    const passing = new Set<string>();
    for (const [id, c] of Object.entries(cfg)) {
      if (c.status === 'studying' && f.studying) passing.add(id);
      else if (c.status === 'complete' && f.complete) passing.add(id);
    }
    if (f.categoryIds.length > 0) {
      // Restrict further to the user-selected subset.
      const restrict = new Set(f.categoryIds);
      for (const id of Array.from(passing)) {
        if (!restrict.has(id)) passing.delete(id);
      }
    }
    return passing;
  })();

  $: visibleCards = $allCards.filter((c) => includedCatIds.has(c.cat));
</script>

<div class="grid-wrapper">
  <div class="card-grid" data-testid="card-grid">
    {#each visibleCards as card (card.pt)}
      <div class="tile" data-testid="card-tile">
        <div class="pt">{card.pt}</div>
        <div class="en">{card.en}</div>
      </div>
    {/each}
  </div>
</div>

<style>
  .grid-wrapper { padding: 12px 20px 40px; }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }
  .tile {
    background: var(--card-front, #1a1a2e);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 14px 16px;
  }
  .pt {
    font-size: 1.05rem;
    color: var(--text, #f0f0f0);
    margin-bottom: 4px;
  }
  .en {
    font-size: 0.85rem;
    color: var(--text-dim, #8892a4);
  }
  @media (max-width: 768px) {
    .card-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
```

- [ ] **Step 4: Render the grid in both layouts**

In `src/lib/ProfessoraDesktop.svelte`, add to imports and markup:

```svelte
<script lang="ts">
  import ProfessoraHeader from './ProfessoraHeader.svelte';
  import ProfessoraFilters from './ProfessoraFilters.svelte';
  import ManagePanel from './ManagePanel.svelte';
  import CardGrid from './CardGrid.svelte';
</script>

<div class="professora-desktop" data-testid="professora-desktop">
  <ProfessoraHeader />
  <ManagePanel />
  <ProfessoraFilters />
  <CardGrid />
</div>

<style>
  .professora-desktop {
    max-width: 1100px;
    margin: 0 auto;
  }
</style>
```

Same edit in `src/lib/ProfessoraMobile.svelte`:

```svelte
<script lang="ts">
  import ProfessoraHeader from './ProfessoraHeader.svelte';
  import ProfessoraFilters from './ProfessoraFilters.svelte';
  import ManagePanel from './ManagePanel.svelte';
  import CardGrid from './CardGrid.svelte';
</script>

<div class="professora-mobile" data-testid="professora-mobile">
  <ProfessoraHeader />
  <ManagePanel />
  <ProfessoraFilters />
  <CardGrid />
</div>
```

- [ ] **Step 5: Build and run the test**

```bash
npm run build
npx playwright test tests/professora.spec.js --project=chromium -g "grid shows cards"
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/CardGrid.svelte src/lib/ProfessoraDesktop.svelte src/lib/ProfessoraMobile.svelte tests/professora.spec.js
git commit -m "feat(professora): card grid filtered by status"
```

---

### Task 9: Category multiselect chips in `ProfessoraFilters`

**Files:**
- Modify: `src/lib/ProfessoraFilters.svelte` — extend with category chips below the status chips.
- Modify: `tests/professora.spec.js` — add multiselect test.

- [ ] **Step 1: Write the failing test**

Append to `tests/professora.spec.js`:

```js
  test('category multiselect restricts the grid; selecting none shows all', async ({ page, request }) => {
    const res0 = await request.get(`${BASE}/api/cards`);
    const { categories, cards } = await res0.json();
    const ids = Object.keys(categories);
    const a = ids[0], b = ids[1];
    await request.put(`${BASE}/api/categories/${encodeURIComponent(a)}/status`, { data: { status: 'studying' } });
    await request.put(`${BASE}/api/categories/${encodeURIComponent(b)}/status`, { data: { status: 'studying' } });
    const aPt = cards.find((c) => c.cat === a).pt;
    const bPt = cards.find((c) => c.cat === b).pt;

    await page.goto(`${BASE}/professora`);
    // Both visible by default (no category restriction).
    await expect(page.getByTestId('card-tile').filter({ hasText: aPt })).toBeVisible();
    await expect(page.getByTestId('card-tile').filter({ hasText: bPt })).toBeVisible();

    // Click only category A.
    await page.locator(`[data-testid="filter-cat"][data-cat-id="${a}"]`).click();
    await expect(page.getByTestId('card-tile').filter({ hasText: aPt })).toBeVisible();
    await expect(page.getByTestId('card-tile').filter({ hasText: bPt })).toHaveCount(0);

    // Click again to deselect — back to all.
    await page.locator(`[data-testid="filter-cat"][data-cat-id="${a}"]`).click();
    await expect(page.getByTestId('card-tile').filter({ hasText: bPt })).toBeVisible();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run build
npx playwright test tests/professora.spec.js --project=chromium -g "category multiselect"
```

Expected: FAIL — no `filter-cat` chips.

- [ ] **Step 3: Extend `ProfessoraFilters.svelte`**

Replace the entire file with:

```svelte
<script lang="ts">
  import { catConfig } from '../stores/cards';
  import { professoraFilters } from '../stores/professoraFilters';

  function toggleStatus(key: 'studying' | 'complete') {
    professoraFilters.update((f) => ({ ...f, [key]: !f[key] }));
  }

  function toggleCat(id: string) {
    professoraFilters.update((f) => {
      const set = new Set(f.categoryIds);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...f, categoryIds: Array.from(set) };
    });
  }

  // Show only non-unmarked categories as chips, in insertion order.
  $: categoryChips = Object.entries($catConfig).filter(([, c]) => c.status !== 'unmarked');
</script>

<div class="filters">
  <div class="status-chips">
    <button
      type="button"
      class="chip"
      class:on={$professoraFilters.studying}
      data-testid="filter-status-studying"
      aria-pressed={$professoraFilters.studying}
      on:click={() => toggleStatus('studying')}
    >Studying</button>
    <button
      type="button"
      class="chip"
      class:on={$professoraFilters.complete}
      data-testid="filter-status-complete"
      aria-pressed={$professoraFilters.complete}
      on:click={() => toggleStatus('complete')}
    >Complete</button>
  </div>

  {#if categoryChips.length > 0}
    <div class="cat-chips">
      {#each categoryChips as [id, cfg] (id)}
        <button
          type="button"
          class="chip small"
          class:on={$professoraFilters.categoryIds.includes(id)}
          data-testid="filter-cat"
          data-cat-id={id}
          aria-pressed={$professoraFilters.categoryIds.includes(id)}
          on:click={() => toggleCat(id)}
        >{cfg.label}</button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .filters { padding: 12px 20px; display: flex; flex-direction: column; gap: 10px; }
  .status-chips, .cat-chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .chip {
    padding: 6px 14px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.15);
    background: transparent;
    color: var(--text-dim, #8892a4);
    cursor: pointer;
    font-size: 0.9rem;
  }
  .chip.small { padding: 4px 10px; font-size: 0.8rem; }
  .chip.on {
    background: var(--accent, #e94560);
    color: white;
    border-color: transparent;
  }
</style>
```

- [ ] **Step 4: Build and run the test**

```bash
npm run build
npx playwright test tests/professora.spec.js --project=chromium -g "category multiselect"
```

Expected: PASS.

Run the full professora spec to confirm no regressions:

```bash
npx playwright test tests/professora.spec.js --project=chromium
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ProfessoraFilters.svelte tests/professora.spec.js
git commit -m "feat(professora): category multiselect chips in filters"
```

---

### Task 10: Empty states

**Files:**
- Modify: `src/lib/CardGrid.svelte`.
- Modify: `tests/professora.spec.js` — add empty-state tests.

- [ ] **Step 1: Write the failing tests**

Append to `tests/professora.spec.js`:

```js
  test('empty state when no categories are marked', async ({ page }) => {
    await page.goto(`${BASE}/professora`);
    await expect(page.getByTestId('grid-empty-no-marked')).toBeVisible();
    await expect(page.getByTestId('card-tile')).toHaveCount(0);
  });

  test('empty state when both status filters are off', async ({ page, request }) => {
    const res0 = await request.get(`${BASE}/api/cards`);
    const id = Object.keys((await res0.json()).categories)[0];
    await request.put(`${BASE}/api/categories/${encodeURIComponent(id)}/status`, { data: { status: 'studying' } });

    await page.goto(`${BASE}/professora`);
    await page.getByTestId('filter-status-studying').click(); // turn it OFF
    await expect(page.getByTestId('grid-empty-no-filter')).toBeVisible();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npm run build
npx playwright test tests/professora.spec.js --project=chromium -g "empty state"
```

Expected: 2 FAIL.

- [ ] **Step 3: Add empty-state markers in `CardGrid.svelte`**

Replace the markup section of `src/lib/CardGrid.svelte` (the `<div class="grid-wrapper">` block) with:

```svelte
<script lang="ts">
  import { allCards, catConfig } from '../stores/cards';
  import { professoraFilters } from '../stores/professoraFilters';

  $: includedCatIds = (() => {
    const cfg = $catConfig;
    const f = $professoraFilters;
    const passing = new Set<string>();
    for (const [id, c] of Object.entries(cfg)) {
      if (c.status === 'studying' && f.studying) passing.add(id);
      else if (c.status === 'complete' && f.complete) passing.add(id);
    }
    if (f.categoryIds.length > 0) {
      const restrict = new Set(f.categoryIds);
      for (const id of Array.from(passing)) {
        if (!restrict.has(id)) passing.delete(id);
      }
    }
    return passing;
  })();

  $: visibleCards = $allCards.filter((c) => includedCatIds.has(c.cat));

  // True when no category has a non-unmarked status (i.e. nothing to ever show).
  $: noMarked = Object.values($catConfig).every((c) => c.status === 'unmarked');
  // True when both status filter chips are off.
  $: noFilter = !$professoraFilters.studying && !$professoraFilters.complete;
</script>

<div class="grid-wrapper">
  {#if noMarked}
    <div class="empty" data-testid="grid-empty-no-marked">
      No categories marked yet — open Manage to set some.
    </div>
  {:else if noFilter}
    <div class="empty" data-testid="grid-empty-no-filter">
      Pick a status filter.
    </div>
  {:else}
    <div class="card-grid" data-testid="card-grid">
      {#each visibleCards as card (card.pt)}
        <div class="tile" data-testid="card-tile">
          <div class="pt">{card.pt}</div>
          <div class="en">{card.en}</div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .grid-wrapper { padding: 12px 20px 40px; }
  .empty {
    padding: 32px 20px;
    text-align: center;
    color: var(--text-dim, #8892a4);
    font-size: 0.95rem;
  }
  .card-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 12px;
  }
  .tile {
    background: var(--card-front, #1a1a2e);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 10px;
    padding: 14px 16px;
  }
  .pt { font-size: 1.05rem; color: var(--text, #f0f0f0); margin-bottom: 4px; }
  .en { font-size: 0.85rem; color: var(--text-dim, #8892a4); }
  @media (max-width: 768px) {
    .card-grid { grid-template-columns: 1fr; }
  }
</style>
```

- [ ] **Step 4: Build and run the tests**

```bash
npm run build
npx playwright test tests/professora.spec.js --project=chromium -g "empty state"
```

Expected: PASS.

Re-run the full professora spec:

```bash
npx playwright test tests/professora.spec.js --project=chromium
```

Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/CardGrid.svelte tests/professora.spec.js
git commit -m "feat(professora): empty states for unmarked and no-filter cases"
```

---

### Task 11: Optimistic-update revert on PUT failure

**Files:**
- Modify: `tests/professora.spec.js` — add a route-stub test.

(`categoryStatus.ts` already implements revert + flash from Task 7; this task verifies the behavior end-to-end.)

- [ ] **Step 1: Write the test**

Append to `tests/professora.spec.js`:

```js
  test('PUT failure reverts optimistic update and shows error toast', async ({ page }) => {
    // Force every PUT /api/categories/:id/status to fail.
    await page.route('**/api/categories/*/status', (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'boom' }) });
      }
      return route.continue();
    });

    await page.goto(`${BASE}/professora`);
    await page.getByTestId('manage-panel-toggle').click();
    const firstRow = page.getByTestId('manage-row').first();
    await firstRow.getByTestId('pill-studying').click();

    // Toast appears.
    await expect(page.getByTestId('manage-error')).toBeVisible();
    // Pill reverts to Unmarked.
    await expect(firstRow.getByTestId('pill-unmarked')).toHaveAttribute('aria-pressed', 'true');
    await expect(firstRow.getByTestId('pill-studying')).toHaveAttribute('aria-pressed', 'false');
  });
```

- [ ] **Step 2: Build and run the test**

```bash
npm run build
npx playwright test tests/professora.spec.js --project=chromium -g "PUT failure"
```

Expected: PASS (no code changes needed — the store already implements this behavior).

If it fails, inspect the failure and fix `src/stores/categoryStatus.ts` (the most likely culprit is forgetting to revert on `!res.ok` vs. only on thrown errors).

- [ ] **Step 3: Commit**

```bash
git add tests/professora.spec.js
git commit -m "test(professora): verify PUT failure reverts optimistic update"
```

---

### Task 12: Desktop entry icon in `App.svelte`

**Files:**
- Modify: `src/App.svelte` — add an icon button absolutely positioned in `.main-content`.
- Modify: `src/app.css` — add styles for the icon (or inline; depends on file structure). Inline is fine.
- Modify: `tests/professora.spec.js` — add an entry-button test.

- [ ] **Step 1: Write the failing test**

Append to `tests/professora.spec.js`:

```js
  test('desktop entry icon navigates from / to /professora', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.getByTestId('professora-entry-desktop').click();
    await expect(page).toHaveURL(`${BASE}/professora`);
    await expect(page.getByTestId('professora-page')).toBeVisible();
  });
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm run build
npx playwright test tests/professora.spec.js --project=chromium -g "desktop entry icon"
```

Expected: FAIL.

- [ ] **Step 3: Add the icon to `App.svelte`**

In `src/App.svelte`, locate the `<div class="main-content">` block (currently around line 79). Insert an anchor as the first child of that div:

```svelte
<div class="main-content">
  <a
    href="/professora"
    class="professora-entry-desktop"
    data-testid="professora-entry-desktop"
    aria-label="Professora view"
    title="Professora view"
  >
    <!-- graduation cap icon -->
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  </a>
  <MobileTopBar />
  <!-- ...existing children... -->
</div>
```

`App.svelte` has no `<style>` block — only inline `style="..."` attributes. Add the new styles to `src/app.css` instead.

In `src/app.css`, find the `.main-content` rule (around lines 66-74) and add `position: relative;` to it (otherwise the absolute icon escapes to the nearest positioned ancestor). Then append a new rule below `.main-content`:

```css
.main-content {
  /* …existing rules… */
  position: relative;
}

.professora-entry-desktop {
  position: absolute;
  top: 16px;
  right: 20px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--text-dim, #8892a4);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  text-decoration: none;
  z-index: 5;
}
.professora-entry-desktop:hover {
  color: var(--text, #f0f0f0);
  background: rgba(255,255,255,0.08);
}
```

- [ ] **Step 4: Build and run the test**

```bash
npm run build
npx playwright test tests/professora.spec.js --project=chromium -g "desktop entry icon"
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.svelte src/app.css tests/professora.spec.js
git commit -m "feat(app): desktop top-right icon to /professora"
```

---

### Task 13: Mobile entry icon in `MobileTopBar`

**Files:**
- Modify: `src/lib/MobileTopBar.svelte` — add an icon button to the LEFT of the existing `mobile-cat-dropdown` selector, on the right side of the bar.
- Create: `tests/professora.mobile.spec.js`.
- Modify: `playwright.config.js` — wire the new mobile spec into the `mobile` project.

- [ ] **Step 1: Update `playwright.config.js`**

Modify both project entries:

```js
    {
      name: 'chromium',
      testIgnore: ['**/mobile.spec.js', '**/mobile-swipe.spec.js', '**/professora.mobile.spec.js'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      testMatch: ['**/mobile.spec.js', '**/mobile-swipe.spec.js', '**/professora.mobile.spec.js'],
      use: { ...devices['Pixel 7'] },
    },
```

- [ ] **Step 2: Create `tests/professora.mobile.spec.js` with the failing test**

```js
const { test, expect } = require('@playwright/test');
const { resetAll, BASE } = require('./fixtures/reset');

test.describe('Professora — mobile', () => {
  test.beforeEach(async () => {
    await resetAll();
  });

  test('mobile entry icon on top bar navigates to /professora', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.getByTestId('professora-entry-mobile').click();
    await expect(page).toHaveURL(`${BASE}/professora`);
    await expect(page.getByTestId('professora-page')).toBeVisible();
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npm run build
npx playwright test tests/professora.mobile.spec.js --project=mobile
```

Expected: FAIL.

- [ ] **Step 4: Add the entry icon to `MobileTopBar.svelte`**

Replace the entire body of `src/lib/MobileTopBar.svelte` with:

```svelte
<script lang="ts">
  import { session, deck } from '../stores/session';
  import { catConfig } from '../stores/cards';
  import { sheetOpen } from '../stores/ui';

  $: remaining = Math.max(0, $deck.length - $session.currentIndex);

  $: label = (() => {
    const activeCats = $session.activeCats;
    const total = Object.keys($catConfig).length;
    if (activeCats.length === 0 || activeCats.length === total) return 'All Categories';
    if (activeCats.length === 1) {
      return $catConfig[activeCats[0]]?.label || 'Categories';
    }
    return `${activeCats.length} selected`;
  })();
</script>

<div class="mobile-top-bar">
  <div class="stats">
    <span data-testid="mobile-counter-correct">
      <span class="dot green"></span> {$session.correct}
    </span>
    <span data-testid="mobile-counter-wrong">
      <span class="dot red"></span> {$session.wrong}
    </span>
    <span data-testid="mobile-counter-remaining">
      <span class="dot gray"></span> {remaining} left
    </span>
  </div>
  <div class="right-cluster">
    <a
      href="/professora"
      class="prof-entry"
      data-testid="professora-entry-mobile"
      aria-label="Professora view"
      title="Professora view"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    </a>
    <button
      class="mobile-cat-dropdown"
      data-testid="mobile-cat-dropdown"
      on:click={() => sheetOpen.set(true)}
    >
      {label} ▾
    </button>
  </div>
</div>

<style>
  .right-cluster { display: flex; align-items: center; gap: 8px; }
  .prof-entry {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: var(--text-dim, #8892a4);
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    text-decoration: none;
  }
</style>
```

- [ ] **Step 5: Build and run the mobile test**

```bash
npm run build
npx playwright test tests/professora.mobile.spec.js --project=mobile
```

Expected: PASS.

- [ ] **Step 6: Re-run the existing mobile spec to confirm no regression**

```bash
npx playwright test tests/mobile.spec.js --project=mobile
```

Expected: all PASS. (The new icon is positioned in a flex cluster alongside the existing dropdown; the dropdown's test ID and click behavior are unchanged.)

- [ ] **Step 7: Commit**

```bash
git add playwright.config.js src/lib/MobileTopBar.svelte tests/professora.mobile.spec.js
git commit -m "feat(mobile): top-bar icon to /professora"
```

---

### Task 14: Mobile manage panel as bottom sheet

**Files:**
- Modify: `src/stores/ui.ts` — add a second sheet flag for the professora panel.
- Modify: `src/lib/ProfessoraMobile.svelte` — replace inline `ManagePanel` with a "Manage" button that opens a `ProfessoraSheet` carrying the panel.
- Create: `src/lib/ProfessoraSheet.svelte` — bottom-sheet wrapper modeled on `BottomSheet.svelte` but parametrized over the open store and content slot.
- Modify: `tests/professora.mobile.spec.js` — add bottom-sheet test.

The existing `BottomSheet.svelte` is hard-wired to the `sheetOpen` store and to category-picker content. Forking a small parametrized sheet is cleaner than retrofitting; the gesture/animation logic is duplicated but isolated.

- [ ] **Step 1: Add the new store flag**

Replace the contents of `src/stores/ui.ts` with:

```ts
import { writable } from 'svelte/store';

export const groupCollapseState = writable<Record<string, boolean>>({});
export const sheetOpen = writable<boolean>(false);
// Open state for the professora manage bottom sheet (mobile only).
export const professoraSheetOpen = writable<boolean>(false);
```

- [ ] **Step 2: Write the failing test**

Append to `tests/professora.mobile.spec.js`:

```js
  test('mobile manage panel opens as a bottom sheet', async ({ page, request }) => {
    await resetAll();
    await page.goto(`${BASE}/professora`);

    // Manage button visible on mobile, panel inline collapsed.
    await expect(page.getByTestId('manage-sheet-toggle')).toBeVisible();

    // Click to open sheet — body becomes visible inside the sheet, not inline.
    await page.getByTestId('manage-sheet-toggle').click();
    await expect(page.getByTestId('manage-panel-body')).toBeVisible();
    await expect(page.getByTestId('professora-sheet')).toHaveClass(/open/);
  });
```

- [ ] **Step 3: Run the test to verify it fails**

```bash
npm run build
npx playwright test tests/professora.mobile.spec.js --project=mobile -g "bottom sheet"
```

Expected: FAIL.

- [ ] **Step 4: Create `ProfessoraSheet.svelte`**

Create `src/lib/ProfessoraSheet.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { professoraSheetOpen } from '../stores/ui';

  let sheetEl: HTMLDivElement;
  let backdropEl: HTMLDivElement;
  let isClosing = false;

  function close() {
    isClosing = true;
    sheetEl.classList.remove('open');
    backdropEl.style.opacity = '0';
    setTimeout(() => {
      isClosing = false;
      backdropEl.classList.remove('open');
      backdropEl.style.opacity = '';
      document.body.style.overflow = '';
      professoraSheetOpen.set(false);
    }, 300);
  }

  onMount(() => {
    const unsub = professoraSheetOpen.subscribe((open) => {
      if (!sheetEl || !backdropEl) return;
      if (open && !isClosing) {
        backdropEl.classList.add('open');
        requestAnimationFrame(() => sheetEl.classList.add('open'));
        document.body.style.overflow = 'hidden';
      }
    });
    return unsub;
  });

  let startY = 0;
  let currentY = 0;

  function onTouchStart(e: TouchEvent) {
    startY = e.touches[0].clientY;
    sheetEl.style.transition = 'none';
  }
  function onTouchMove(e: TouchEvent) {
    currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0) sheetEl.style.transform = `translateY(${diff}px)`;
  }
  function onTouchEnd() {
    sheetEl.style.transition = '';
    const diff = currentY - startY;
    if (diff > 80) close();
    else sheetEl.style.transform = '';
    startY = 0;
    currentY = 0;
  }
</script>

<div
  class="bottom-sheet-backdrop"
  bind:this={backdropEl}
  on:click={close}
  on:keydown={(e) => e.key === 'Escape' && close()}
  role="button"
  tabindex="-1"
  aria-label="Close sheet"
></div>
<div class="bottom-sheet" bind:this={sheetEl} data-testid="professora-sheet">
  <div
    class="bottom-sheet-handle"
    on:touchstart={onTouchStart}
    on:touchmove={onTouchMove}
    on:touchend={onTouchEnd}
  ></div>
  <div class="bottom-sheet-title">Manage categories</div>
  <div class="bottom-sheet-body">
    <slot />
  </div>
</div>
```

(This component reuses the same global classes as `BottomSheet.svelte` — `.bottom-sheet-backdrop`, `.bottom-sheet`, `.bottom-sheet-handle`, `.bottom-sheet-title`, `.bottom-sheet-body` — which already exist in `src/app.css`. No new CSS needed.)

- [ ] **Step 5: Replace `ProfessoraMobile.svelte`**

```svelte
<script lang="ts">
  import ProfessoraHeader from './ProfessoraHeader.svelte';
  import ProfessoraFilters from './ProfessoraFilters.svelte';
  import ManagePanel from './ManagePanel.svelte';
  import CardGrid from './CardGrid.svelte';
  import ProfessoraSheet from './ProfessoraSheet.svelte';
  import { professoraSheetOpen } from '../stores/ui';
</script>

<div class="professora-mobile" data-testid="professora-mobile">
  <ProfessoraHeader />
  <button
    type="button"
    class="manage-trigger"
    data-testid="manage-sheet-toggle"
    on:click={() => professoraSheetOpen.set(true)}
  >Manage categories</button>
  <ProfessoraFilters />
  <CardGrid />
</div>

<ProfessoraSheet>
  <ManagePanel defaultOpen={true} />
</ProfessoraSheet>

<style>
  .manage-trigger {
    margin: 8px 20px;
    padding: 10px 14px;
    background: rgba(255,255,255,0.06);
    color: var(--text, #f0f0f0);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    font-size: 0.95rem;
    cursor: pointer;
  }
</style>
```

Note: the `ManagePanel` toggle (`manage-panel-toggle`) is no longer the primary entry on mobile — it's instead opened by the sheet trigger. Inside the sheet, the panel renders with `defaultOpen={true}`, so its body is immediately visible. The desktop layout still uses the inline panel with its own toggle.

- [ ] **Step 6: Build and run mobile tests**

```bash
npm run build
npx playwright test tests/professora.mobile.spec.js --project=mobile
```

Expected: all PASS.

Re-run the desktop spec to confirm no regression (the inline manage toggle still works on desktop):

```bash
npx playwright test tests/professora.spec.js --project=chromium
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/stores/ui.ts src/lib/ProfessoraSheet.svelte src/lib/ProfessoraMobile.svelte tests/professora.mobile.spec.js
git commit -m "feat(professora): mobile manage panel as bottom sheet"
```

---

### Task 15: CLAUDE.md update + final full test run

**Files:**
- Modify: `CLAUDE.md`.

- [ ] **Step 1: Update `CLAUDE.md`**

In the **Architecture** section, after the existing "Modes" paragraph (around the bottom of the architecture block), insert a new paragraph:

```markdown
**Professora page (`/professora`)** — a separate Svelte tree mounted by `main.ts` based on `window.location.pathname`. Express has an SPA fallback for `/professora[/...]` URLs. Each category carries a `status` column (`unmarked` / `studying` / `complete`) on the `categories` table; the column is preserved across `/api/reseed` (reseed now upserts categories instead of truncating them, then prunes any categories not in the seed). The page surfaces a Manage panel (set status), filters (Studying/Complete chips + category multiselect), and a flat card grid. Status is set via `PUT /api/categories/:id/status`.
```

In the **Conventions** section, append a bullet:

```markdown
- `/api/reseed` no longer TRUNCATEs `categories` — it upserts label/css_class/group_name (preserving `status`) and prunes categories whose ids are not in the seed.
```

- [ ] **Step 2: Run the full test suite**

```bash
npm test
```

Expected: all PASS across both `chromium` and `mobile` projects.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: note /professora route and reseed semantics"
```

---

## Done

The `/professora` page is now reachable from desktop (top-right icon in `.main-content`) and mobile (icon left of the dropdown in `MobileTopBar`). Visiting it loads cards, shows status filters defaulted to Studying-only, lets the user mark categories via a 3-way pill in the Manage panel (collapsible inline on desktop, bottom-sheet on mobile), and renders a flat grid of `pt`/`en` tiles for whatever passes the filters. Status survives `/api/reseed` and is hydrated alongside the rest of `/api/cards` on every page load.
