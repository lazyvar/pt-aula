# Conjugation Tense Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a popover multi-select to the `✨ Conjugations` button so the user can pick which tenses to study. Selection persists in `localStorage`, defaults to all six on first load, and is sent to the server which filters against an allowlist.

**Architecture:** A new `ConjugationsButton.svelte` component owns popover state, the tense list, and `localStorage` hydration. It calls the existing `generate()` flow with an added `tenses` field. The server gains a body-level allowlist check.

**Tech Stack:** Svelte 4 + TypeScript, Express, Playwright. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-05-04-conjugation-tense-picker-design.md`

---

## File Map

- **Create** `src/lib/tenses.ts` — single source of truth for the six tense `{value, label}` pairs and the `TenseValue` type.
- **Create** `src/lib/ConjugationsButton.svelte` — popover trigger, checkboxes, `Generate` button, `localStorage` persistence, click-outside / Escape handling.
- **Modify** `src/lib/ControlButtons.svelte` — remove inline `✨ Conjugations` button; mount `<ConjugationsButton>` in its place.
- **Modify** `src/stores/generated.ts` — switch `generate()` to an options-object signature so callers can pass `tenses` without juggling positional args.
- **Modify** `server.js` — add body-level `tenses` validation (allowlist + non-empty filter) before building the combo grid.
- **Create** `tests/conjugation-tense-picker.spec.js` — popover behaviour, default selection, disabled-when-empty, request body shape, `localStorage` round-trip.
- **Create** `tests/conjugation-tenses-server.spec.js` — server-level 400 paths (empty array, all-invalid array). Validation paths return BEFORE the Claude call so they don't need an API key.
- **Modify** `tests/conjugations-mode.spec.js` — update `enterConjugationsMode` helper (one extra click on the popover's `Generate` button).
- **Modify** `tests/generated-mode.spec.js` — update each `✨ Conjugations` click sequence the same way; update the "no active categories" test.

---

## Task 1: Server — validate `tenses` request field

**Files:**
- Modify: `server.js:384` (the hardcoded `const tenses = [...]` line and its surroundings, lines 383–395)
- Create: `tests/conjugation-tenses-server.spec.js`

This task is TDD'd through Playwright. The validation paths return 400 BEFORE the Claude call, so they don't need `ANTHROPIC_API_KEY` — they work on the test server which doesn't have one.

The new tests use the test DB fixture without resetting it across tests in this file (no card-level state matters — we hit validation paths before any DB query that uses `tenses`). They DO need at least one `Verbs` category active in the DB though, because the server queries verbs BEFORE the tenses validation. Use the existing `resetAll()` from `tests/fixtures/reset.js` — it reseeds the verb categories.

- [ ] **Step 1: Write the failing tests**

Create `tests/conjugation-tenses-server.spec.js`:

```js
// tests/conjugation-tenses-server.spec.js
//
// Server-level validation for POST /api/generate-conjugations: reject
// requests where `tenses` is provided but resolves to an empty list
// after filtering against the server-side allowlist. These paths return
// 400 BEFORE the Claude call, so they don't need ANTHROPIC_API_KEY.
const { test, expect } = require('@playwright/test');
const { resetAll, BASE } = require('./fixtures/reset');

test.describe('POST /api/generate-conjugations — tenses validation', () => {
  test.beforeAll(async () => {
    // Reseed once. Subsequent tests don't mutate DB state — they hit
    // validation paths early.
    await resetAll();
  });

  // Pick a Verbs category so the upstream "no verb categories" check
  // doesn't short-circuit before tense validation runs.
  async function verbCatId() {
    const { categories } = await fetch(`${BASE}/api/cards`).then((r) => r.json());
    const id = Object.entries(categories).find(([, c]) => c.group === 'Verbs')?.[0];
    if (!id) throw new Error('no Verbs category in seed');
    return id;
  }

  test('empty tenses array → 400 "Pick at least one tense"', async () => {
    const activeCats = [await verbCatId()];
    const res = await fetch(`${BASE}/api/generate-conjugations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeCats, tenses: [] }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Pick at least one tense/i);
  });

  test('tenses array with only invalid values → 400 "Pick at least one tense"', async () => {
    const activeCats = [await verbCatId()];
    const res = await fetch(`${BASE}/api/generate-conjugations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeCats, tenses: ['bogus', 'also-bogus'] }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Pick at least one tense/i);
  });
});
```

- [ ] **Step 2: Run tests and verify they fail**

```bash
docker compose -f docker-compose.test.yml up -d --wait
npm run build
npx playwright test tests/conjugation-tenses-server.spec.js --project=chromium
```

Expected: both tests fail. They will probably hit the Claude call and 502 (because no API key), or 200 if Claude somehow returns something — either way, NOT 400.

- [ ] **Step 3: Implement server-side validation**

In `server.js`, find the block starting around line 383:

```js
    const tenses = ['presente', 'pretérito perfeito', 'pretérito imperfeito', 'futuro do pretérito', 'presente do subjuntivo', 'pretérito imperfeito do subjuntivo'];
```

Replace that single line with:

```js
    const ALL_TENSES = [
      'presente',
      'pretérito perfeito',
      'pretérito imperfeito',
      'futuro do pretérito',
      'presente do subjuntivo',
      'pretérito imperfeito do subjuntivo',
    ];
    const requestedTenses = Array.isArray(req.body.tenses) ? req.body.tenses : ALL_TENSES;
    const tenses = requestedTenses.filter((t) => ALL_TENSES.includes(t));
    if (tenses.length === 0) {
      return res.status(400).json({ error: 'Pick at least one tense' });
    }
```

Note: when `req.body.tenses` is `undefined` (back-compat), `requestedTenses` becomes `ALL_TENSES` and the filter is a no-op — old clients keep working.

- [ ] **Step 4: Run tests and verify they pass**

```bash
npm run build
npx playwright test tests/conjugation-tenses-server.spec.js --project=chromium
```

Expected: both tests pass.

- [ ] **Step 5: Commit**

```bash
git add server.js tests/conjugation-tenses-server.spec.js
git commit -m "$(cat <<'EOF'
feat(server): validate tenses field on generate-conjugations

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Client — `tenses.ts` constant module

**Files:**
- Create: `src/lib/tenses.ts`

No tests. This module is a static constant; svelte-check verifies the type during the next compile.

- [ ] **Step 1: Create the file**

`src/lib/tenses.ts`:

```ts
// src/lib/tenses.ts
//
// Single source of truth for conjugation tenses on the client.
// `value` strings MUST match the server's ALL_TENSES allowlist in
// server.js (POST /api/generate-conjugations). The English `label` is
// what the user sees in the picker.
export const TENSES = [
  { value: 'presente',                           label: 'Present' },
  { value: 'pretérito perfeito',                 label: 'Preterite' },
  { value: 'pretérito imperfeito',               label: 'Imperfect' },
  { value: 'futuro do pretérito',                label: 'Conditional' },
  { value: 'presente do subjuntivo',             label: 'Present subjunctive' },
  { value: 'pretérito imperfeito do subjuntivo', label: 'Imperfect subjunctive' },
] as const;

export type TenseValue = typeof TENSES[number]['value'];
```

- [ ] **Step 2: Verify svelte-check passes**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/tenses.ts
git commit -m "$(cat <<'EOF'
feat(client): add tenses constant module

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Client — `generate()` options-object signature

**Files:**
- Modify: `src/stores/generated.ts:22-59`
- Modify: `src/lib/ControlButtons.svelte:36-44` (single callsite today)

This is a pure refactor. After this task, callers pass an options object; `tenses` is wired through but the `ControlButtons` callsite still passes `undefined` so the server falls back to all-six. Behaviour does not change yet.

- [ ] **Step 1: Update `generate()` signature**

In `src/stores/generated.ts`, replace the existing `export async function generate(...)` (lines 22–59) with:

```ts
export async function generate(
  opts: {
    kind: GenerateKind;
    activeCats: string[];
    tenses?: string[];
  },
  callbacks: {
    takeSnapshot: () => DeckSnapshot;
    applyGenerated: (cards: Card[]) => void;
  },
): Promise<string | null> {
  const { kind, activeCats, tenses } = opts;
  const { takeSnapshot, applyGenerated } = callbacks;

  if (get(generatingKind) !== null || get(generatedMode)) return null;
  if (activeCats.length === 0) {
    return 'Select at least one category first.';
  }

  const url = kind === 'sentences' ? '/api/generate-sentences' : '/api/generate-conjugations';

  const body: { activeCats: string[]; tenses?: string[] } = { activeCats };
  if (kind === 'conjugations' && tenses !== undefined) {
    body.tenses = tenses;
  }

  generatingKind.set(kind);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json() as { cards?: Array<{ pt: string; en: string }>; error?: string };
    if (!res.ok) return data.error || 'Generation failed';
    if (!data.cards || data.cards.length === 0) return 'No sentences were generated. Try again.';

    savedSnapshot = takeSnapshot();
    const cards: Card[] = data.cards.map((c) => ({ pt: c.pt, en: c.en, cat: GENERATED_CAT }));
    generatedCards.set(cards);
    applyGenerated(cards);
    generatedKind.set(kind);
    generatedMode.set(true);
    document.body.classList.add('gen-mode');
    return null;
  } catch (err) {
    return 'Generation failed: ' + (err instanceof Error ? err.message : String(err));
  } finally {
    generatingKind.set(null);
  }
}
```

- [ ] **Step 2: Update the callsite in `ControlButtons.svelte`**

In `src/lib/ControlButtons.svelte`, find lines 36-44:

```svelte
  async function onGenerate(kind: GenerateKind) {
    const err = await generate(
      kind,
      get(session).activeCats,
      snapshotDeck,
      applyGeneratedDeck,
    );
    if (err) alert(err);
  }
```

Replace with:

```svelte
  async function onGenerate(kind: GenerateKind) {
    const err = await generate(
      { kind, activeCats: get(session).activeCats },
      { takeSnapshot: snapshotDeck, applyGenerated: applyGeneratedDeck },
    );
    if (err) alert(err);
  }
```

- [ ] **Step 3: Verify check + existing tests still pass**

```bash
npm run check
npx playwright test tests/generated-mode.spec.js --project=chromium
```

Expected: no errors; existing tests pass (behaviour unchanged — body still contains only `activeCats` for current callsite).

- [ ] **Step 4: Commit**

```bash
git add src/stores/generated.ts src/lib/ControlButtons.svelte
git commit -m "$(cat <<'EOF'
refactor(generated): switch generate() to options-object signature

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Write the failing popover test spec

**Files:**
- Create: `tests/conjugation-tense-picker.spec.js`

Write the full test file before building the component so the component is built against a concrete spec.

- [ ] **Step 1: Create the test file**

`tests/conjugation-tense-picker.spec.js`:

```js
// tests/conjugation-tense-picker.spec.js
//
// Popover-based tense multi-select on the ✨ Conjugations button.
// Covers: open/close interaction, default selection, disabled-when-empty,
// request body shape (tenses field), localStorage round-trip, and that
// the existing Generated Mode flow still works after the popover step.
const { test, expect } = require('@playwright/test');
const { resetAll, blockFonts, BASE } = require('./fixtures/reset');

const MOCK_CONJUGATIONS = Array.from({ length: 20 }, (_, i) => ({
  pt: `eu andei ${i + 1}`,
  en: `I walked ${i + 1} (past)`,
}));

const ALL_TENSES = [
  'presente',
  'pretérito perfeito',
  'pretérito imperfeito',
  'futuro do pretérito',
  'presente do subjuntivo',
  'pretérito imperfeito do subjuntivo',
];

async function wireRoutes(page) {
  await blockFonts(page);
  await page.route('**/api/generate-conjugations', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ cards: MOCK_CONJUGATIONS }),
    });
  });
}

// Playwright's default `page` fixture creates a fresh browser context per
// test, so localStorage starts empty in every test without explicit
// clearing. Reloads within a single test preserve localStorage as
// expected, which the persistence test below relies on.

test.describe('Conjugation Tense Picker — popover', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await wireRoutes(page);
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('clicking ✨ Conjugations opens the popover; outside click closes it', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '✨ Conjugations', exact: true }).first();
    const popover = page.getByTestId('conjugation-tense-popover').first();

    await expect(popover).toBeHidden();
    await trigger.click();
    await expect(popover).toBeVisible();

    // Click outside (on the card area) → close.
    await page.getByTestId('card-container').click();
    await expect(popover).toBeHidden();
  });

  test('Escape closes the popover', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '✨ Conjugations', exact: true }).first();
    const popover = page.getByTestId('conjugation-tense-popover').first();

    await trigger.click();
    await expect(popover).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
  });

  test('all six checkboxes are checked by default on first load', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '✨ Conjugations', exact: true }).first();
    await trigger.click();

    const popover = page.getByTestId('conjugation-tense-popover').first();
    const checkboxes = popover.getByRole('checkbox');
    await expect(checkboxes).toHaveCount(6);

    for (let i = 0; i < 6; i++) {
      await expect(checkboxes.nth(i)).toBeChecked();
    }
  });

  test('Generate button is disabled when zero tenses are selected', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '✨ Conjugations', exact: true }).first();
    await trigger.click();

    const popover = page.getByTestId('conjugation-tense-popover').first();
    const generate = popover.getByTestId('conjugation-generate');
    const checkboxes = popover.getByRole('checkbox');

    await expect(generate).toBeEnabled();

    for (let i = 0; i < 6; i++) {
      await checkboxes.nth(i).uncheck();
    }
    await expect(generate).toBeDisabled();
  });

  test('selecting a subset and clicking Generate POSTs the chosen tenses', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '✨ Conjugations', exact: true }).first();
    await trigger.click();

    const popover = page.getByTestId('conjugation-tense-popover').first();
    const checkboxes = popover.getByRole('checkbox');

    // Uncheck everything, then check just "Present" and "Imperfect subjunctive".
    for (let i = 0; i < 6; i++) await checkboxes.nth(i).uncheck();
    await checkboxes.nth(0).check(); // presente
    await checkboxes.nth(5).check(); // pretérito imperfeito do subjuntivo

    const reqPromise = page.waitForRequest('**/api/generate-conjugations');
    await popover.getByTestId('conjugation-generate').click();
    const req = await reqPromise;

    const body = JSON.parse(req.postData() || '{}');
    expect(Array.isArray(body.tenses)).toBe(true);
    expect(new Set(body.tenses)).toEqual(new Set(['presente', 'pretérito imperfeito do subjuntivo']));

    // Generated Mode kicks in normally.
    await expect(page.getByText(/Generated Mode/)).toBeVisible();
  });

  test('clicking Generate closes the popover', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '✨ Conjugations', exact: true }).first();
    await trigger.click();

    const popover = page.getByTestId('conjugation-tense-popover').first();
    await popover.getByTestId('conjugation-generate').click();

    await expect(popover).toBeHidden();
    await expect(page.getByText(/Generated Mode/)).toBeVisible();
  });

  test('localStorage persists the last selection across reloads', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '✨ Conjugations', exact: true }).first();
    await trigger.click();

    const popover = page.getByTestId('conjugation-tense-popover').first();
    const checkboxes = popover.getByRole('checkbox');
    for (let i = 0; i < 6; i++) await checkboxes.nth(i).uncheck();
    await checkboxes.nth(2).check(); // pretérito imperfeito

    // Close the popover (Escape) so we don't depend on Generate-then-network.
    await page.keyboard.press('Escape');

    // Verify localStorage was written.
    const stored = await page.evaluate(() =>
      window.localStorage.getItem('pt-aula:conjugation-tenses'),
    );
    expect(JSON.parse(stored)).toEqual(['pretérito imperfeito']);

    // Reload, reopen popover, expect the same single checkbox checked.
    await page.reload();
    await expect(page.getByTestId('card-container')).toBeVisible();
    await page.getByRole('button', { name: '✨ Conjugations', exact: true }).first().click();

    const popover2 = page.getByTestId('conjugation-tense-popover').first();
    const cbs2 = popover2.getByRole('checkbox');
    await expect(cbs2.nth(0)).not.toBeChecked();
    await expect(cbs2.nth(1)).not.toBeChecked();
    await expect(cbs2.nth(2)).toBeChecked();
    await expect(cbs2.nth(3)).not.toBeChecked();
    await expect(cbs2.nth(4)).not.toBeChecked();
    await expect(cbs2.nth(5)).not.toBeChecked();
  });

  test('Generate without tenses key (default state) sends all six', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '✨ Conjugations', exact: true }).first();
    await trigger.click();

    const reqPromise = page.waitForRequest('**/api/generate-conjugations');
    await page.getByTestId('conjugation-generate').first().click();
    const req = await reqPromise;

    const body = JSON.parse(req.postData() || '{}');
    expect(new Set(body.tenses)).toEqual(new Set(ALL_TENSES));
  });
});
```

- [ ] **Step 2: Run the new spec and verify every test fails**

```bash
docker compose -f docker-compose.test.yml up -d --wait
npm run build
npx playwright test tests/conjugation-tense-picker.spec.js --project=chromium
```

Expected: every test fails — the popover, checkboxes, and `data-testid="conjugation-generate"` button do not exist yet.

- [ ] **Step 3: Commit (failing spec is intentional)**

```bash
git add tests/conjugation-tense-picker.spec.js
git commit -m "$(cat <<'EOF'
test: failing spec for conjugation tense picker popover

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Build `ConjugationsButton.svelte` and wire it in

**Files:**
- Create: `src/lib/ConjugationsButton.svelte`
- Modify: `src/lib/ControlButtons.svelte` (replace inline conjugations button + remove dead imports)

- [ ] **Step 1: Create `ConjugationsButton.svelte`**

`src/lib/ConjugationsButton.svelte`:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { session } from '../stores/session';
  import { snapshotDeck, applyGeneratedDeck } from '../stores/session';
  import { generatingKind, generatedMode, generate } from '../stores/generated';
  import { TENSES, type TenseValue } from './tenses';

  // When true (default), surface test ids on the trigger + popover.
  // Pass false in the mobile bottom-sheet copy to avoid strict-mode
  // selector violations.
  export let testIds = true;

  const STORAGE_KEY = 'pt-aula:conjugation-tenses';
  const ALL_VALUES: readonly TenseValue[] = TENSES.map((t) => t.value);

  let popoverOpen = false;
  let triggerEl: HTMLButtonElement;
  let popoverEl: HTMLDivElement;
  let selected: Set<TenseValue> = new Set(ALL_VALUES);

  // Hydrate from localStorage. Drop unknown values; fall back to all-six
  // if missing or corrupt.
  onMount(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === null) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const allowed = new Set<TenseValue>(ALL_VALUES);
      const next: Set<TenseValue> = new Set(
        parsed.filter((v): v is TenseValue => typeof v === 'string' && allowed.has(v as TenseValue)),
      );
      // Valid array (including empty) wins. Unparseable JSON is caught below.
      selected = next;
    } catch {
      // Corrupt JSON or missing API — keep the all-six default.
    }
  });

  function persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...selected]));
    } catch {
      // localStorage may be disabled; ignore.
    }
  }

  function toggle(value: TenseValue, checked: boolean) {
    if (checked) selected.add(value);
    else selected.delete(value);
    selected = selected; // reactive nudge
    persist();
  }

  function openPopover() {
    if ($generatingKind !== null || $generatedMode) return;
    popoverOpen = true;
  }

  function closePopover() {
    popoverOpen = false;
  }

  async function onGenerate() {
    if (selected.size === 0) return;
    closePopover();
    const err = await generate(
      {
        kind: 'conjugations',
        activeCats: get(session).activeCats,
        tenses: [...selected],
      },
      { takeSnapshot: snapshotDeck, applyGenerated: applyGeneratedDeck },
    );
    if (err) alert(err);
  }

  function onDocumentClick(e: MouseEvent) {
    if (!popoverOpen) return;
    const target = e.target as Node | null;
    if (!target) return;
    if (popoverEl?.contains(target)) return;
    if (triggerEl?.contains(target)) return;
    closePopover();
  }

  function onDocumentKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && popoverOpen) closePopover();
  }

  onMount(() => {
    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onDocumentKeydown);
  });
  onDestroy(() => {
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onDocumentKeydown);
  });
</script>

<div class="conjugations-wrap">
  <button
    type="button"
    class="ctrl-btn gen-btn"
    bind:this={triggerEl}
    on:click={openPopover}
    disabled={$generatingKind !== null || $generatedMode}
  >
    {$generatingKind === 'conjugations' ? '⏳ Generating…' : '✨ Conjugations'}
  </button>

  {#if popoverOpen}
    <div
      class="tense-popover"
      bind:this={popoverEl}
      data-testid={testIds ? 'conjugation-tense-popover' : undefined}
      role="dialog"
      aria-label="Choose tenses"
    >
      <ul class="tense-list">
        {#each TENSES as tense (tense.value)}
          <li>
            <label>
              <input
                type="checkbox"
                checked={selected.has(tense.value)}
                on:change={(e) => toggle(tense.value, (e.currentTarget as HTMLInputElement).checked)}
              />
              <span>{tense.label}</span>
            </label>
          </li>
        {/each}
      </ul>
      <button
        type="button"
        class="ctrl-btn gen-btn tense-generate"
        data-testid={testIds ? 'conjugation-generate' : undefined}
        on:click={onGenerate}
        disabled={selected.size === 0}
      >
        Generate
      </button>
    </div>
  {/if}
</div>

<style>
  .conjugations-wrap {
    position: relative;
    display: contents;
  }
  .tense-popover {
    position: absolute;
    bottom: 100%;
    left: 0;
    margin-bottom: 8px;
    background: var(--card-front, #1a1a2e);
    color: var(--text, #f0f0f0);
    border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
    border-radius: 10px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
    padding: 10px 12px;
    min-width: 220px;
    z-index: 50;
  }
  .tense-list {
    list-style: none;
    margin: 0 0 8px 0;
    padding: 0;
  }
  .tense-list li {
    margin: 4px 0;
  }
  .tense-list label {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 0.95rem;
  }
  .tense-generate {
    width: 100%;
  }
</style>
```

Notes for the implementer:

- `display: contents` on `.conjugations-wrap` keeps the trigger button in the parent flexbox layout while still providing a positioning context for the popover. If the parent's CSS doesn't tolerate `display: contents`, switch to `display: inline-block; position: relative;` and accept a small layout reflow.
- The trigger uses the same `ctrl-btn gen-btn` classes as the original button, so the visual styling is unchanged.

- [ ] **Step 2: Wire it into `ControlButtons.svelte`**

In `src/lib/ControlButtons.svelte`, find lines 93-99 (the inline Conjugations button):

```svelte
<button
  class="ctrl-btn gen-btn"
  on:click={() => onGenerate('conjugations')}
  disabled={$generatingKind !== null || $generatedMode}
>
  {$generatingKind === 'conjugations' ? '⏳ Generating…' : '✨ Conjugations'}
</button>
```

Replace those 6 lines with:

```svelte
<ConjugationsButton {testIds} />
```

At the top of the `<script>` block, add the import (after the existing `generated` import on line 5):

```ts
  import ConjugationsButton from './ConjugationsButton.svelte';
```

`ControlButtons.svelte` still uses `onGenerate` for the Sentences button — keep that function intact. Don't remove unused imports unless `npm run check` flags them.

- [ ] **Step 3: Verify svelte-check passes**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 4: Run the new popover spec — all tests should pass**

```bash
npx playwright test tests/conjugation-tense-picker.spec.js --project=chromium
```

Expected: all 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ConjugationsButton.svelte src/lib/ControlButtons.svelte
git commit -m "$(cat <<'EOF'
feat(ui): conjugation tense picker popover

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Update existing test specs for the popover step

**Files:**
- Modify: `tests/conjugations-mode.spec.js:50-55` (`enterConjugationsMode` helper) and line 246 (one inline duplicate)
- Modify: `tests/generated-mode.spec.js:29, 49, 85, 102-130, 246, 266`

The popover adds one click between `✨ Conjugations` and the actual generation. Every existing place that clicks the conjugations button needs the extra click on `Generate`.

- [ ] **Step 1: Update `tests/conjugations-mode.spec.js`**

Replace the `enterConjugationsMode` helper (lines 50-55):

```js
async function enterConjugationsMode(page) {
  await page.goto('/');
  await expect(page.getByTestId('card-container')).toBeVisible();
  await page.getByRole('button', { name: '✨ Conjugations', exact: true }).first().click();
  await expect(page.getByText(/Generated Mode/)).toBeVisible();
}
```

with:

```js
async function enterConjugationsMode(page) {
  await page.goto('/');
  await expect(page.getByTestId('card-container')).toBeVisible();
  await page.getByRole('button', { name: '✨ Conjugations', exact: true }).first().click();
  await page.getByTestId('conjugation-generate').first().click();
  await expect(page.getByText(/Generated Mode/)).toBeVisible();
}
```

Find the one remaining inline use later in the file (around line 246, inside the `'banner label differs...'` test):

```js
    await page.getByRole('button', { name: '✨ Conjugations', exact: true }).first().click();
    const verbsBanner = page.getByTestId('gen-banner-label');
```

Replace with:

```js
    await page.getByRole('button', { name: '✨ Conjugations', exact: true }).first().click();
    await page.getByTestId('conjugation-generate').first().click();
    const verbsBanner = page.getByTestId('gen-banner-label');
```

And similarly in the `'exiting sentences and entering conjugations swaps UI...'` test (around line 266):

```js
    await page.getByRole('button', { name: '✨ Conjugations', exact: true }).first().click();
    await expect(page.getByText(/Generated Mode/)).toBeVisible();
```

becomes:

```js
    await page.getByRole('button', { name: '✨ Conjugations', exact: true }).first().click();
    await page.getByTestId('conjugation-generate').first().click();
    await expect(page.getByText(/Generated Mode/)).toBeVisible();
```

- [ ] **Step 2: Update `tests/generated-mode.spec.js`**

For each of these tests, the same pattern applies — click the button, then click Generate inside the popover.

**Lines 27-45** (`'clicking Generate enters gen mode...'`): the click on line 29 needs the popover Generate added immediately after.

```js
    // Desktop sidebar has the Generate button
    await page.getByRole('button', { name: '✨ Conjugations', exact: true }).first().click();
    await page.getByTestId('conjugation-generate').first().click();
```

**Lines 47-70** (`'in gen mode, marking cards does NOT write stats...'`): line 49 same change.

```js
    // Enter gen mode
    await page.getByRole('button', { name: '✨ Conjugations', exact: true }).first().click();
    await page.getByTestId('conjugation-generate').first().click();
    await expect(page.getByText(/Generated Mode/)).toBeVisible();
```

**Lines 72-100** (`'exiting gen mode restores...'`): line 85 same change.

```js
    // Enter gen mode
    await page.getByRole('button', { name: '✨ Conjugations', exact: true }).first().click();
    await page.getByTestId('conjugation-generate').first().click();
    await expect(page.getByText(/Generated Mode/)).toBeVisible();
```

**Lines 102-130** (`'Generate button is disabled when no categories are active'`): the alert now fires AFTER the Generate click inside the popover. The trigger click only opens the popover. Update lines 125-127:

```js
    await page.getByRole('button', { name: '✨ Conjugations', exact: true }).first().click();
    await page.waitForTimeout(200);
    expect(alertFired).toBe(true);
```

becomes:

```js
    await page.getByRole('button', { name: '✨ Conjugations', exact: true }).first().click();
    await page.getByTestId('conjugation-generate').first().click();
    await page.waitForTimeout(200);
    expect(alertFired).toBe(true);
```

**Lines 156-183** (`'only the pressed button shows the Generating… label'`): this test is inside the Sentences describe block and clicks the Sentences button — the assertions about Conjugations on lines 177-179 just check the Conjugations button is still visible with its normal label. With the new component the label is unchanged, so this test continues to work as-is. No change.

- [ ] **Step 3: Run all updated tests**

```bash
npx playwright test tests/conjugations-mode.spec.js tests/generated-mode.spec.js tests/conjugation-tense-picker.spec.js --project=chromium
```

Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add tests/conjugations-mode.spec.js tests/generated-mode.spec.js
git commit -m "$(cat <<'EOF'
test: insert popover Generate click into conjugations specs

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Full-suite verification

- [ ] **Step 1: Run the full Playwright suite**

```bash
npm test
```

Expected: all tests pass on both `chromium` and `mobile` projects.

If anything fails, fix in place — most likely candidates are:
- A test you missed in another file that clicks `✨ Conjugations` (search: `grep -n "✨ Conjugations" tests/`).
- A mobile-specific layout problem with `display: contents` — switch the wrapper to `display: inline-block; position: relative;` if so.
- A strict-mode locator violation if `data-testid="conjugation-tense-popover"` matches both desktop and mobile copies — that's why `.first()` is used in the new spec; verify no other call sites need it.

- [ ] **Step 2: Run svelte-check one more time**

```bash
npm run check
```

- [ ] **Step 3: Final commit only if anything was fixed in Step 1 or 2**

```bash
git status
# if there are tracked changes:
git add <files>
git commit -m "$(cat <<'EOF'
fix(tense-picker): <specific issue>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Notes & gotchas

- The test DB Postgres on :5433 should already be up from Task 1. If the runner reboots between tasks, `docker compose -f docker-compose.test.yml up -d --wait` brings it back.
- `npm test` builds first; running individual specs requires a prior `npm run build`. The plan's commands include the explicit build before each first-spec-of-a-task.
- All conjugation tests use `.first()` because the desktop sidebar and mobile bottom sheet both render `<ConjugationsButton>`. Any test that runs in the `mobile` Playwright project needs the same `.first()` discipline for new selectors.
- Tense `value` strings include accented characters and spaces; URL-encode them if any future test puts them in a URL (the current spec only sends them in JSON bodies, which is fine).
