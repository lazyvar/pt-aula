# Difficult Cards Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Difficult (N)" deck-builder button that rebuilds the current deck from cards the user has recently been missing, where difficulty is tracked via a 5-bit recency ring buffer on `card_stats`.

**Architecture:** Server stores `recent_history` as a 5-bit integer ring buffer, updated on every mark. Client hydrates stats on boot, derives difficulty client-side, and exposes a new session action `reviewDifficultCards` — analogous to the existing `reviewWrongCards` but scoped by historical data. No snapshot/restore (unlike Generated Mode) — this is a plain deck rebuild.

**Tech Stack:** Express + Postgres (server), Svelte 4 + TypeScript (client), Playwright (tests).

**Spec:** `docs/superpowers/specs/2026-04-13-difficult-cards-mode-design.md`

---

## File Structure

**Modify:**
- `server.js` — add migration, update mark endpoint, include `recent_history` in GET /api/stats response.
- `src/types.ts` — extend `CardStat` with `recent_history`.
- `src/stores/stats.ts` — default `recent_history` to 0 for unseen.
- `src/stores/session.ts` — new `reviewDifficultCards` action.
- `src/lib/ControlButtons.svelte` — new "Difficult (N)" button wired to a derived count store.

**Create:**
- `src/lib/difficulty.ts` — pure helpers (`popcount5`, `isDifficult`, `difficultCards`).
- `src/stores/difficulty.ts` — derived `difficultCount` store from `statsCache` + `session.activeCats` + `allCards`.
- `tests/difficult-mode.spec.js` — Playwright E2E.
- `tests/fixtures/stats-helpers.js` — test helper for seeding `card_stats` rows with specific `recent_history` values (via a new dev-only endpoint — see Task 2).

---

## Task 1: Schema migration for `recent_history`

**Files:**
- Modify: `server.js` (the `init()` function, after existing `card_stats` CREATE TABLE)

- [ ] **Step 1: Add idempotent migration**

In `server.js`, inside `init()`, immediately after the `CREATE TABLE IF NOT EXISTS card_stats …` block, add:

```js
await pool.query(`ALTER TABLE card_stats ADD COLUMN IF NOT EXISTS recent_history INTEGER NOT NULL DEFAULT 0`);
```

- [ ] **Step 2: Verify migration runs cleanly**

```bash
docker compose -f docker-compose.test.yml up -d --wait
DATABASE_URL=postgres://postgres:postgres@localhost:5433/pt_aula_test node -e "require('./server.js')" &
sleep 2
docker compose -f docker-compose.test.yml exec -T db psql -U postgres -d pt_aula_test -c "\d card_stats"
```

Expected: output shows `recent_history | integer | not null default 0`.

- [ ] **Step 3: Commit**

```bash
git add server.js
git commit -m "feat(server): add recent_history column to card_stats"
```

---

## Task 2: Update mark endpoint to maintain `recent_history` and expose it

**Files:**
- Modify: `server.js` (`POST /api/stats/:cardId/mark` and `GET /api/stats`)

- [ ] **Step 1: Write failing test**

Create `tests/recent-history.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');
const { BASE } = require('./fixtures/reset');

test.describe('recent_history bit-shift semantics', () => {
  test.beforeEach(async () => { await resetAll(); });

  test('wrong mark shifts 1 into low bit, right shifts 0', async () => {
    const id = 'test-card';
    // 1 wrong
    await fetch(`${BASE}/api/stats/${id}/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correct: false }),
    });
    let stats = await fetch(`${BASE}/api/stats`).then(r => r.json());
    expect(stats[id].recent_history).toBe(0b00001);

    // 1 wrong, 1 right → 0b00010
    await fetch(`${BASE}/api/stats/${id}/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correct: true }),
    });
    stats = await fetch(`${BASE}/api/stats`).then(r => r.json());
    expect(stats[id].recent_history).toBe(0b00010);

    // 6 total marks: buffer must mask to 5 bits
    for (let i = 0; i < 4; i++) {
      await fetch(`${BASE}/api/stats/${id}/mark`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correct: false }),
      });
    }
    stats = await fetch(`${BASE}/api/stats`).then(r => r.json());
    // History: W R W W W W → last 5 = R W W W W = 0b01111
    expect(stats[id].recent_history).toBe(0b01111);
    expect(stats[id].recent_history & ~31).toBe(0); // stays within 5 bits
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
docker compose -f docker-compose.test.yml up -d --wait
npx playwright test tests/recent-history.spec.js --project=chromium
```

Expected: FAIL — `stats[id].recent_history` is undefined.

- [ ] **Step 3: Update GET /api/stats to include `recent_history`**

In `server.js`, replace the `GET /api/stats` handler:

```js
app.get("/api/stats", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT card_id, right_count, wrong_count, recent_history FROM card_stats"
  );
  const stats = {};
  for (const row of rows) {
    stats[row.card_id] = {
      right: row.right_count,
      wrong: row.wrong_count,
      recent_history: row.recent_history,
    };
  }
  res.json(stats);
});
```

- [ ] **Step 4: Update POST /api/stats/:cardId/mark to maintain `recent_history`**

Replace the handler:

```js
app.post("/api/stats/:cardId/mark", async (req, res) => {
  const { cardId } = req.params;
  const { correct } = req.body;
  const col = correct ? "right_count" : "wrong_count";
  const bit = correct ? 0 : 1;
  await pool.query(
    `INSERT INTO card_stats (card_id, ${col}, recent_history)
     VALUES ($1, 1, $2)
     ON CONFLICT (card_id) DO UPDATE SET
       ${col} = card_stats.${col} + 1,
       recent_history = ((card_stats.recent_history << 1) | $2) & 31`,
    [cardId, bit]
  );
  const { rows } = await pool.query(
    "SELECT right_count, wrong_count, recent_history FROM card_stats WHERE card_id = $1",
    [cardId]
  );
  res.json({
    right: rows[0].right_count,
    wrong: rows[0].wrong_count,
    recent_history: rows[0].recent_history,
  });
});
```

- [ ] **Step 5: Run test to verify it passes**

```bash
npx playwright test tests/recent-history.spec.js --project=chromium
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add server.js tests/recent-history.spec.js
git commit -m "feat(server): maintain recent_history ring buffer on mark"
```

---

## Task 3: Extend `CardStat` type and client stats handling

**Files:**
- Modify: `src/types.ts`
- Modify: `src/stores/stats.ts`

- [ ] **Step 1: Extend `CardStat` type**

In `src/types.ts`, replace the `CardStat` interface:

```ts
export interface CardStat {
  right: number;
  wrong: number;
  recent_history: number; // 5-bit ring buffer, low bit = most recent; 1 = wrong
}
```

- [ ] **Step 2: Update `getCardStats` default in `src/stores/stats.ts`**

Change the return in `getCardStats`:

```ts
export function getCardStats(card: Card): CardStat {
  const id = getCardId(card);
  return get(statsCache)[id] || { right: 0, wrong: 0, recent_history: 0 };
}
```

- [ ] **Step 3: Typecheck**

```bash
npm run check
```

Expected: no type errors. If any existing code destructures `CardStat` with exhaustive checks, add `recent_history: 0` there.

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/stores/stats.ts
git commit -m "feat(client): extend CardStat with recent_history"
```

---

## Task 4: Difficulty helpers (`src/lib/difficulty.ts`)

**Files:**
- Create: `src/lib/difficulty.ts`
- Create: `tests/unit/difficulty.test.ts` (if a unit test harness exists — if not, skip the unit test and rely on the Playwright tests in Task 7)

- [ ] **Step 1: Write the helpers**

Create `src/lib/difficulty.ts`:

```ts
import type { Card, CardStat, StatsMap } from '../types';
import { getCardId } from './cardId';

const MIN_ATTEMPTS = 3;
const MIN_RECENT_WRONGS = 2;
const WINDOW_MASK = 0b11111;

export function popcount5(n: number): number {
  let x = n & WINDOW_MASK;
  x = x - ((x >> 1) & 0b01010);
  x = (x & 0b00011) + ((x >> 2) & 0b00011) + ((x >> 4) & 0b00001);
  return x;
}

export function isDifficult(stat: CardStat | undefined): boolean {
  if (!stat) return false;
  const attempts = stat.right + stat.wrong;
  if (attempts < MIN_ATTEMPTS) return false;
  return popcount5(stat.recent_history) >= MIN_RECENT_WRONGS;
}

export function difficultCards(
  cards: Card[],
  stats: StatsMap,
  catFilter?: Set<string>,
): Card[] {
  return cards.filter((c) => {
    if (catFilter && !catFilter.has(c.cat)) return false;
    return isDifficult(stats[getCardId(c)]);
  });
}
```

- [ ] **Step 2: Sanity-check popcount by hand**

Verify by inspection:
- `popcount5(0b00000) === 0`
- `popcount5(0b00001) === 1`
- `popcount5(0b11111) === 5`
- `popcount5(0b10101) === 3`
- `popcount5(0b01010) === 2`

The formula above is a standard SWAR popcount restricted to 5 bits; the Playwright tests in Task 7 exercise it through the UI path.

- [ ] **Step 3: Typecheck**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/difficulty.ts
git commit -m "feat(client): add difficulty helpers (popcount5, isDifficult)"
```

---

## Task 5: `reviewDifficultCards` session action

**Files:**
- Modify: `src/stores/session.ts`

- [ ] **Step 1: Add the action**

In `src/stores/session.ts`, add after `reviewWrongCards`:

```ts
import { difficultCards } from '../lib/difficulty';
import { statsCache } from './stats';

/**
 * Rebuild the deck from cards the user is historically bad at (see
 * src/lib/difficulty.ts). Scoped to activeCats by default; if that set is
 * empty, falls back to all cards.
 */
export function reviewDifficultCards(allCardsIn: Card[]): void {
  const s = get(session);
  const stats = get(statsCache);
  const active = new Set(s.activeCats);

  let pool = difficultCards(allCardsIn, stats, active);
  if (pool.length === 0) {
    pool = difficultCards(allCardsIn, stats); // fallback: all cats
  }
  if (pool.length === 0) return;

  const shuffled = shuffle(pool);
  deck.set(shuffled);
  wrongCardsList.set([]);
  session.update((ss) => ({
    ...ss,
    deckOrder: shuffled.map((c) => c.pt),
    currentIndex: 0,
    correct: 0,
    wrong: 0,
    wrongCards: [],
  }));
}
```

Note: `import type { Card }` is already at the top of the file; add the two new imports (`difficultCards`, `statsCache`) at the top alongside the existing imports.

- [ ] **Step 2: Typecheck**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/stores/session.ts
git commit -m "feat(client): reviewDifficultCards session action"
```

---

## Task 6: Derived `difficultCount` store and "Difficult (N)" button

**Files:**
- Create: `src/stores/difficulty.ts`
- Modify: `src/lib/ControlButtons.svelte`

- [ ] **Step 1: Create derived store**

Create `src/stores/difficulty.ts`:

```ts
import { derived } from 'svelte/store';
import { session } from './session';
import { statsCache } from './stats';
import { allCards } from './cards';
import { difficultCards } from '../lib/difficulty';

export const difficultCount = derived(
  [allCards, statsCache, session],
  ([$allCards, $stats, $session]) => {
    const active = new Set($session.activeCats);
    let n = difficultCards($allCards, $stats, active).length;
    if (n === 0) {
      n = difficultCards($allCards, $stats).length;
    }
    return n;
  },
);
```

- [ ] **Step 2: Wire the button in ControlButtons.svelte**

In `src/lib/ControlButtons.svelte`, add to the imports block:

```ts
import { reviewDifficultCards } from '../stores/session';
import { difficultCount } from '../stores/difficulty';
```

Then add this button after the Shuffle button (between `Shuffle` and `Reset Stats`):

```svelte
<button
  class="ctrl-btn"
  data-testid="difficult-btn"
  on:click={() => reviewDifficultCards($allCards)}
  disabled={$difficultCount === 0}
>
  Difficult ({$difficultCount})
</button>
```

- [ ] **Step 3: Typecheck and smoke-test UI**

```bash
npm run check
npm run dev
```

In a browser at `http://localhost:5173`, verify:
- Button renders between Shuffle and Reset Stats, labeled "Difficult (0)".
- Button is disabled when count is 0.
- Mark a card wrong 2x in a row (if a card has enough prior attempts) → count may update; otherwise exercise via tests in Task 7.

Kill dev server after smoke test.

- [ ] **Step 4: Commit**

```bash
git add src/stores/difficulty.ts src/lib/ControlButtons.svelte
git commit -m "feat(client): add Difficult (N) deck-builder button"
```

---

## Task 7: Playwright E2E tests

**Files:**
- Create: `tests/difficult-mode.spec.js`

- [ ] **Step 1: Write the test file**

Create `tests/difficult-mode.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const { resetAll, setActiveCategories, BASE } = require('./fixtures/reset');
const { cardId } = require('./fixtures/truth');
const { waitForSessionWrite } = require('./fixtures/waits');

// Helper: mark a card N times via the server API directly.
async function mark(id, correct) {
  const res = await fetch(`${BASE}/api/stats/${id}/mark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correct }),
  });
  if (!res.ok) throw new Error(`mark failed: ${res.status}`);
  return res.json();
}

test.describe('Difficult cards mode', () => {
  test.beforeEach(async () => { await resetAll(); });

  test('cards with <3 attempts are never difficult', async ({ page }) => {
    // Grab a real card id from /api/cards
    const { cards } = await fetch(`${BASE}/api/cards`).then(r => r.json());
    const id = cardId(cards[0].pt);

    // 2 wrong marks → still not difficult (attempts=2 < 3)
    await mark(id, false);
    await mark(id, false);

    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    const btn = page.getByTestId('difficult-btn');
    await expect(btn).toBeDisabled();
    await expect(btn).toContainText('Difficult (0)');
  });

  test('card with 2 wrong in last 5 and >=3 attempts is difficult', async ({ page }) => {
    const { cards } = await fetch(`${BASE}/api/cards`).then(r => r.json());
    const id = cardId(cards[0].pt);

    // 1 right, 2 wrong → attempts=3, recent_history=0b011, popcount=2 → difficult
    await mark(id, true);
    await mark(id, false);
    await mark(id, false);

    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    const btn = page.getByTestId('difficult-btn');
    await expect(btn).toContainText('Difficult (1)');
    await expect(btn).toBeEnabled();
  });

  test('3 correct answers after buffer fill drops card out of difficult', async ({ page }) => {
    const { cards } = await fetch(`${BASE}/api/cards`).then(r => r.json());
    const id = cardId(cards[0].pt);

    // Seed: 2 wrong then 3 right
    // History after W W R R R = 0b00 11 000 masked → last 5 bits = 0b11000 → popcount=2
    // That IS still difficult. We need enough rights to shift the wrongs out.
    // W W R R R R R: history = 0b1100000 & 31 = 0b00000 → popcount=0 → not difficult
    await mark(id, false);
    await mark(id, false);
    for (let i = 0; i < 5; i++) await mark(id, true);

    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    const btn = page.getByTestId('difficult-btn');
    await expect(btn).toContainText('Difficult (0)');
    await expect(btn).toBeDisabled();
  });

  test('clicking Difficult rebuilds deck with only difficult cards', async ({ page }) => {
    const { cards } = await fetch(`${BASE}/api/cards`).then(r => r.json());
    const target = cards[0];
    const id = cardId(target.pt);

    // Make exactly one card difficult
    await mark(id, true);
    await mark(id, false);
    await mark(id, false);

    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    await page.getByTestId('difficult-btn').click();
    await waitForSessionWrite(page);

    // Deck should contain exactly 1 card and it should be our target
    const session = await fetch(`${BASE}/api/session`).then(r => r.json());
    expect(session.deckOrder).toHaveLength(1);
    expect(session.deckOrder[0]).toBe(target.pt);
  });

  test('hybrid fallback: if active cats have no difficult cards, pulls from all cats', async ({ page }) => {
    const { cards, categories } = await fetch(`${BASE}/api/cards`).then(r => r.json());

    // Pick a card and make it difficult
    const target = cards[0];
    const targetCat = target.cat;
    const id = cardId(target.pt);
    await mark(id, true);
    await mark(id, false);
    await mark(id, false);

    // Activate a DIFFERENT category (one that contains no difficult cards)
    const otherCat = Object.keys(categories).find((c) => c !== targetCat);
    expect(otherCat).toBeTruthy();
    await setActiveCategories([otherCat]);

    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    const btn = page.getByTestId('difficult-btn');
    // Fallback makes the single difficult card visible globally
    await expect(btn).toContainText('Difficult (1)');
    await btn.click();
    await waitForSessionWrite(page);

    const session = await fetch(`${BASE}/api/session`).then(r => r.json());
    expect(session.deckOrder).toEqual([target.pt]);
  });
});
```

- [ ] **Step 2: Run the tests**

```bash
npm test -- tests/difficult-mode.spec.js
```

Expected: all 5 tests PASS.

- [ ] **Step 3: Run the full suite to catch regressions**

```bash
npm test
```

Expected: entire Playwright suite passes (chromium + mobile).

- [ ] **Step 4: Commit**

```bash
git add tests/difficult-mode.spec.js
git commit -m "test: e2e coverage for difficult cards mode"
```

---

## Task 8: Final verification

- [ ] **Step 1: Typecheck + build**

```bash
npm run check && npm run build
```

Expected: both succeed.

- [ ] **Step 2: Manual smoke test**

```bash
npm run dev
```

In a browser:
1. Mark one card W W W in a row → "Difficult (1)" appears, enabled.
2. Click Difficult → deck becomes that single card.
3. Mark it right 5 times → "Difficult (0)", disabled.
4. Reload the page — state persists (count recomputes from stats on boot).

- [ ] **Step 3: Final commit if any tweaks were needed**

If anything was adjusted during smoke test, commit. Otherwise skip.

---

## Notes for the executing engineer

- **Do not touch** `src/stores/generated.ts` or `tests/generated-mode.spec.js` — the user has in-progress work there from a separate session.
- The `card_stats` table stores card ids as slugs derived from `card.pt` (see `src/lib/cardId.ts`). That slug algorithm is load-bearing — do not change it.
- The `session` table has exactly one row (`id=1`); this feature doesn't add any session columns.
- When adding the `difficult-btn` to `ControlButtons.svelte`, keep it outside the Generated Mode buttons since it's a regular deck-builder action and should remain enabled during normal use.
