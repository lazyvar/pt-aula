# Real-Behavior Test Suite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace shallow "something changed" assertions with deep assertions against a server-sourced truth map, reorganize by behavior concern, and add mobile viewport coverage.

**Architecture:** A new `tests/fixtures/truth.js` fetches `/api/cards` once per test and exposes synchronous lookups (pair lookup, category membership, deterministic `card_id`). All deep assertions flow through it — no hardcoded pt/en literals. Tests reorganize into `pair-integrity`, `deck-composition`, `mode`, `stats`, `mobile` files. A second Playwright project runs `mobile.spec.js` at a mobile viewport.

**Tech Stack:** Playwright, Node.js (test files are CommonJS, matching the existing repo style).

---

## Reference: `card_id` format (verified from `public/index.html:754-756`)

```js
function getCardId(card) {
  return card.pt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
```

The id is a slug of **`pt` only** — `en` is not part of it. CLAUDE.md currently says "constructed client-side from `pt` + `en` text"; that is wrong and will be corrected in Task 10.

---

## File Structure

**Create:**
- `tests/fixtures/truth.js` — server-sourced truth lookups
- `tests/fixtures/waits.js` — `waitForSessionWrite` helper
- `tests/pair-integrity.spec.js` — front/back pair correctness
- `tests/deck-composition.spec.js` — deck membership, size, no dupes
- `tests/stats.spec.js` — server-side stats accuracy
- `tests/mobile.spec.js` — core flows at mobile viewport

**Modify:**
- `tests/mode.spec.js` — rewrite with truth-based assertions
- `playwright.config.js` — add mobile project
- `public/index.html` — add `data-testid` to mobile-top-bar counters (~line 1063)
- `CLAUDE.md` — correct `card_id` description (~line 48)

**Delete:**
- `tests/deck.spec.js` (replaced by pair-integrity + deck-composition)
- `tests/marking.spec.js` (replaced by stats.spec.js)
- `tests/categories.spec.js` (replaced by deck-composition.spec.js)

---

## Task 1: Create the truth fixture

**Files:**
- Create: `tests/fixtures/truth.js`

- [ ] **Step 1: Write the truth fixture**

Create `tests/fixtures/truth.js`:

```js
// Server-sourced ground truth for tests.
// Fetches /api/cards fresh on each call to reflect what the server actually serves.

const BASE = 'http://localhost:3006';

function cardId(pt) {
  return pt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function loadTruth() {
  const res = await fetch(`${BASE}/api/cards`);
  if (!res.ok) throw new Error(`GET /api/cards failed: ${res.status}`);
  const { cards, categories } = await res.json();

  const byPt = new Map();
  const byEn = new Map();
  const byCategory = new Map();
  for (const c of cards) {
    byPt.set(c.pt, c);
    byEn.set(c.en, c);
    if (!byCategory.has(c.cat)) byCategory.set(c.cat, []);
    byCategory.get(c.cat).push(c);
  }

  return {
    allCards: cards,
    categories,
    getCardByPt(pt) { return byPt.get(pt); },
    getCardByEn(en) { return byEn.get(en); },
    getCardsInCategories(catIds) {
      const set = new Set(catIds);
      return cards.filter(c => set.has(c.cat));
    },
    // Default active cats on first load (see public/index.html:1348):
    //   all non-Topics categories.
    getDefaultActiveCats() {
      return Object.keys(categories).filter(id => categories[id].group !== 'Topics');
    },
    cardId,
  };
}

module.exports = { loadTruth, cardId, BASE };
```

- [ ] **Step 2: Commit**

```bash
git add tests/fixtures/truth.js
git commit -m "test: add server-sourced truth fixture for deep assertions"
```

---

## Task 2: Create the waits helper

**Files:**
- Create: `tests/fixtures/waits.js`

- [ ] **Step 1: Write the helper**

Create `tests/fixtures/waits.js`:

```js
// Helpers for synchronizing tests with unawaited server writes.
// The frontend calls saveSession() fire-and-forget after UI actions
// (see public/index.html:1262, 1269). Tests that read server state
// after a UI action must wait for the PUT to settle.

async function waitForSessionWrite(page) {
  await page.waitForLoadState('networkidle');
}

module.exports = { waitForSessionWrite };
```

- [ ] **Step 2: Commit**

```bash
git add tests/fixtures/waits.js
git commit -m "test: add waitForSessionWrite helper"
```

---

## Task 3: Write pair-integrity.spec.js

**Files:**
- Create: `tests/pair-integrity.spec.js`

- [ ] **Step 1: Write the spec**

Create `tests/pair-integrity.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');
const { loadTruth } = require('./fixtures/truth');

test.describe('Card pair integrity', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('the visible front word is a real Portuguese card from seed data', async ({ page }) => {
    const truth = await loadTruth();
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    expect(front).toBeTruthy();
    const match = truth.getCardByPt(front);
    expect(match, `front word "${front}" should exist in /api/cards`).toBeTruthy();
  });

  test('flipping reveals the correct English translation for the visible Portuguese word', async ({ page }) => {
    const truth = await loadTruth();
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const expected = truth.getCardByPt(front);
    expect(expected).toBeTruthy();

    await page.getByTestId('card-container').click();
    await expect(page.locator('#theCard')).toHaveClass(/flipped/);

    const back = (await page.getByTestId('card-back').locator('.card-word').textContent())?.trim();
    expect(back).toBe(expected.en);
  });

  test('pair integrity holds across 5 consecutive cards', async ({ page }) => {
    const truth = await loadTruth();
    for (let i = 0; i < 5; i++) {
      const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
      const expected = truth.getCardByPt(front);
      expect(expected, `card ${i}: front "${front}" should exist in truth`).toBeTruthy();

      await page.getByTestId('card-container').click();
      const back = (await page.getByTestId('card-back').locator('.card-word').textContent())?.trim();
      expect(back, `card ${i}: back should be correct translation of "${front}"`).toBe(expected.en);

      // Advance to next card (mark right)
      await page.getByTestId('btn-right').click();
      // Wait for re-render with new card
      await expect(page.getByTestId('card-front').locator('.card-word')).not.toHaveText(front, { timeout: 2000 });
    }
  });
});
```

- [ ] **Step 2: Run the new spec to verify it passes**

```bash
npm test -- tests/pair-integrity.spec.js
```

Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/pair-integrity.spec.js
git commit -m "test: verify front/back card pair integrity via truth fixture"
```

---

## Task 4: Rewrite mode.spec.js with truth-based assertions

**Files:**
- Modify: `tests/mode.spec.js` (full replacement)

- [ ] **Step 1: Replace contents of `tests/mode.spec.js`**

```js
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');
const { loadTruth } = require('./fixtures/truth');
const { waitForSessionWrite } = require('./fixtures/waits');

test.describe('Mode toggle (pt↔en)', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('default mode is pt-to-en: front is a Portuguese word from truth', async ({ page }) => {
    const truth = await loadTruth();
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    expect(truth.getCardByPt(front)).toBeTruthy();

    // And button label reflects pt-to-en
    const toggle = page.getByTestId('mode-toggle');
    const text = (await toggle.textContent())?.trim() ?? '';
    expect(text.indexOf('PT')).toBeLessThan(text.indexOf('EN'));
  });

  test('in pt-to-en mode, flipping reveals the english translation of the front', async ({ page }) => {
    const truth = await loadTruth();
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const pair = truth.getCardByPt(front);
    expect(pair).toBeTruthy();

    await page.getByTestId('card-container').click();
    const back = (await page.getByTestId('card-back').locator('.card-word').textContent())?.trim();
    expect(back).toBe(pair.en);
  });

  test('toggling to en-to-pt: front is an english word from truth, back is its portuguese', async ({ page }) => {
    const truth = await loadTruth();
    await page.getByTestId('mode-toggle').click();

    // Wait for re-render (button label flips)
    await expect(page.getByTestId('mode-toggle')).toContainText('EN → PT');

    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const pair = truth.getCardByEn(front);
    expect(pair, `front "${front}" in en-to-pt mode should be an en value in truth`).toBeTruthy();

    await page.getByTestId('card-container').click();
    const back = (await page.getByTestId('card-back').locator('.card-word').textContent())?.trim();
    expect(back).toBe(pair.pt);
  });

  test('mode persists across reload', async ({ page }) => {
    await page.getByTestId('mode-toggle').click();
    await expect(page.getByTestId('mode-toggle')).toContainText('EN → PT');
    await waitForSessionWrite(page);

    await page.reload();
    await expect(page.getByTestId('card-container')).toBeVisible();
    await expect(page.getByTestId('mode-toggle')).toContainText('EN → PT');
  });
});
```

- [ ] **Step 2: Run the spec to verify it passes**

```bash
npm test -- tests/mode.spec.js
```

Expected: 4 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/mode.spec.js
git commit -m "test: rewrite mode spec with truth-based pair assertions"
```

---

## Task 5: Write deck-composition.spec.js

**Files:**
- Create: `tests/deck-composition.spec.js`

- [ ] **Step 1: Write the spec**

Create `tests/deck-composition.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');
const { loadTruth } = require('./fixtures/truth');
const { waitForSessionWrite } = require('./fixtures/waits');

// Walk the deck by marking each card right until the done-screen appears.
// Returns the ordered list of pt strings that were shown.
async function walkDeck(page) {
  const seen = [];
  // Safety cap: don't loop forever.
  for (let guard = 0; guard < 500; guard++) {
    // If the done-screen has rendered, card-front no longer exists — we're finished.
    if (await page.getByTestId('card-front').count() === 0) break;
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    seen.push(front);
    await page.getByTestId('btn-right').click();
    // Wait for re-render: either the front word changed or the card-front disappeared (done-screen).
    await expect(async () => {
      const count = await page.getByTestId('card-front').count();
      if (count === 0) return; // done-screen rendered, OK
      const nextFront = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
      expect(nextFront).not.toBe(front);
    }).toPass({ timeout: 2000 });
  }
  return seen;
}

test.describe('Deck composition', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('deck size equals the number of cards in active categories', async ({ page }) => {
    const truth = await loadTruth();
    const activeCats = truth.getDefaultActiveCats();
    const expectedCount = truth.getCardsInCategories(activeCats).length;

    const initialRemaining = parseInt(
      (await page.getByTestId('counter-remaining').textContent())?.trim() ?? '0',
      10
    );
    expect(initialRemaining).toBe(expectedCount);
  });

  test('no duplicates within a single deck pass', async ({ page }) => {
    const seen = await walkDeck(page);
    const unique = new Set(seen);
    expect(unique.size).toBe(seen.length);
  });

  test('every card shown belongs to an active category', async ({ page }) => {
    const truth = await loadTruth();
    const activeCats = new Set(truth.getDefaultActiveCats());
    const seen = await walkDeck(page);
    for (const pt of seen) {
      const card = truth.getCardByPt(pt);
      expect(card, `card "${pt}" should exist in truth`).toBeTruthy();
      expect(activeCats.has(card.cat), `card "${pt}" cat "${card.cat}" should be in active cats`).toBe(true);
    }
  });

  test('toggling a category off removes its cards from the remaining deck', async ({ page }) => {
    const truth = await loadTruth();

    // Expand all sidebar groups to make filter buttons clickable.
    const headers = page.locator('.sidebar .cat-group-header');
    const headerCount = await headers.count();
    for (let i = 0; i < headerCount; i++) await headers.nth(i).click();

    // Pick an active category to toggle off.
    const firstActive = page.locator('.sidebar [data-testid="category-filter"].active').first();
    await expect(firstActive).toBeVisible();
    const catKey = await firstActive.getAttribute('data-category-key');
    const catCardPts = new Set(truth.getCardsInCategories([catKey]).map(c => c.pt));
    expect(catCardPts.size).toBeGreaterThan(0);

    // Toggle that category off.
    const stableLocator = page.locator(`.sidebar [data-testid="category-filter"][data-category-key="${catKey}"]`);
    await stableLocator.click();
    await expect(stableLocator).not.toHaveClass(/active/);
    await waitForSessionWrite(page);

    // Walk the remaining deck and verify no card belongs to the toggled-off category.
    const seen = await walkDeck(page);
    for (const pt of seen) {
      expect(catCardPts.has(pt), `card "${pt}" should not appear after its category was toggled off`).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run the spec to verify it passes**

```bash
npm test -- tests/deck-composition.spec.js
```

Expected: 4 tests pass. (If walkDeck is too slow because the default deck is large, we'll revisit — but current seeds should make this run in a few seconds.)

- [ ] **Step 3: Commit**

```bash
git add tests/deck-composition.spec.js
git commit -m "test: verify deck composition against active categories"
```

---

## Task 6: Write stats.spec.js

**Files:**
- Create: `tests/stats.spec.js`

- [ ] **Step 1: Write the spec**

Create `tests/stats.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');
const { loadTruth, cardId, BASE } = require('./fixtures/truth');
const { waitForSessionWrite } = require('./fixtures/waits');

test.describe('Stats accuracy', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('cardId helper matches slug format used by frontend (pt only)', async () => {
    // These sample transformations mirror the frontend getCardId regex.
    expect(cardId('Olá mundo')).toBe('ola-mundo');
    expect(cardId('Você está bem?')).toBe('voce-esta-bem');
    expect(cardId('   spaced   ')).toBe('spaced');
    expect(cardId('Eu não sei')).toBe('eu-nao-sei');
  });

  test('marking the current card right records under its slug id in /api/stats', async ({ page }) => {
    // Capture the visible front pt word.
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const expectedId = cardId(front);

    await page.getByTestId('btn-right').click();
    await waitForSessionWrite(page);

    const stats = await fetch(`${BASE}/api/stats`).then(r => r.json());
    expect(stats[expectedId], `stats should have entry for id "${expectedId}"`).toBeTruthy();
    expect(stats[expectedId].right).toBe(1);
    expect(stats[expectedId].wrong ?? 0).toBe(0);
  });

  test('marking the current card wrong records under its slug id in /api/stats', async ({ page }) => {
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const expectedId = cardId(front);

    await page.getByTestId('btn-wrong').click();
    await waitForSessionWrite(page);

    const stats = await fetch(`${BASE}/api/stats`).then(r => r.json());
    expect(stats[expectedId]).toBeTruthy();
    expect(stats[expectedId].wrong).toBe(1);
    expect(stats[expectedId].right ?? 0).toBe(0);
  });

  test('UI counter matches server state after several marks', async ({ page }) => {
    await page.getByTestId('btn-right').click();
    await page.getByTestId('btn-right').click();
    await page.getByTestId('btn-wrong').click();

    await expect(page.getByTestId('counter-correct')).toContainText('2');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
    await waitForSessionWrite(page);

    const stats = await fetch(`${BASE}/api/stats`).then(r => r.json());
    const totalRight = Object.values(stats).reduce((s, v) => s + (v.right || 0), 0);
    const totalWrong = Object.values(stats).reduce((s, v) => s + (v.wrong || 0), 0);
    expect(totalRight).toBe(2);
    expect(totalWrong).toBe(1);
  });

  test('stats survive a page reload', async ({ page }) => {
    await page.getByTestId('btn-right').click();
    await page.getByTestId('btn-wrong').click();
    await expect(page.getByTestId('counter-correct')).toContainText('1');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
    await waitForSessionWrite(page);

    await page.reload();
    await expect(page.getByTestId('card-container')).toBeVisible();
    await expect(page.getByTestId('counter-correct')).toContainText('1');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
  });
});
```

- [ ] **Step 2: Run the spec to verify it passes**

```bash
npm test -- tests/stats.spec.js
```

Expected: 5 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/stats.spec.js
git commit -m "test: verify stats recorded under correct card_id on server"
```

---

## Task 7: Add test ids to mobile-top-bar counters

**Files:**
- Modify: `public/index.html:1063-1072`

Rationale: the desktop `counter-correct/wrong/remaining` data-testids live inside `.progress-area .stats`, which is hidden on mobile via `@media (max-width: 768px) { .progress-area .stats { display: none; } }` (see `public/index.html:285`). Mobile tests need their own testids on the mobile-top-bar counters.

- [ ] **Step 1: Replace the `mobileTopBarHTML` function**

In `public/index.html`, find the function at approximately line 1063:

```js
function mobileTopBarHTML(correct, wrong, remaining) {
  return `<div class="mobile-top-bar">
    <div class="stats">
      <span><span class="dot green"></span> ${correct}</span>
      <span><span class="dot red"></span> ${wrong}</span>
      <span><span class="dot gray"></span> ${remaining} left</span>
    </div>
    <button class="mobile-cat-dropdown" onclick="openBottomSheet()">${mobileDropdownLabel()} ▾</button>
  </div>`;
}
```

Replace with:

```js
function mobileTopBarHTML(correct, wrong, remaining) {
  return `<div class="mobile-top-bar">
    <div class="stats">
      <span data-testid="mobile-counter-correct"><span class="dot green"></span> ${correct}</span>
      <span data-testid="mobile-counter-wrong"><span class="dot red"></span> ${wrong}</span>
      <span data-testid="mobile-counter-remaining"><span class="dot gray"></span> ${remaining} left</span>
    </div>
    <button class="mobile-cat-dropdown" data-testid="mobile-cat-dropdown" onclick="openBottomSheet()">${mobileDropdownLabel()} ▾</button>
  </div>`;
}
```

- [ ] **Step 2: Commit**

```bash
git add public/index.html
git commit -m "test: add data-testids to mobile-top-bar counters and dropdown"
```

---

## Task 8: Add mobile project to playwright.config.js

**Files:**
- Modify: `playwright.config.js`

- [ ] **Step 1: Replace `playwright.config.js`**

```js
// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const PORT = 3006;
const BASE_URL = `http://localhost:${PORT}`;

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['html'], ['list']] : 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    launchOptions: { slowMo: Number(process.env.SLOW_MO) || 0 },
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: '**/mobile.spec.js',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile',
      testMatch: '**/mobile.spec.js',
      use: {
        ...devices['Pixel 7'],
      },
    },
  ],
  webServer: {
    command: `DATABASE_URL=${process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5433/pt_aula_test'} PORT=${PORT} node server.js`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
```

- [ ] **Step 2: Verify config parses (dry list)**

Since mobile.spec.js does not exist yet, listing projects should still succeed but show zero mobile tests:

```bash
npx playwright test --list
```

Expected: desktop specs listed under `[chromium]`; no `[mobile]` entries yet (fine — that project matches `mobile.spec.js` which we write next).

- [ ] **Step 3: Commit**

```bash
git add playwright.config.js
git commit -m "test: add mobile playwright project using Pixel 7 viewport"
```

---

## Task 9: Write mobile.spec.js

**Files:**
- Create: `tests/mobile.spec.js`

- [ ] **Step 1: Write the spec**

Create `tests/mobile.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');
const { loadTruth, cardId, BASE } = require('./fixtures/truth');
const { waitForSessionWrite } = require('./fixtures/waits');

// Runs in the "mobile" Playwright project (Pixel 7 viewport).
// At <=768px the sidebar is hidden; mode toggle + category filters live
// in the bottom sheet opened via the mobile-cat-dropdown button.

test.describe('Mobile UI — core flows', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('mobile top bar shows counters and card area is visible', async ({ page }) => {
    await expect(page.getByTestId('mobile-counter-correct')).toContainText('0');
    await expect(page.getByTestId('mobile-counter-wrong')).toContainText('0');
    await expect(page.getByTestId('mobile-counter-remaining')).toContainText('left');
    await expect(page.getByTestId('card-front')).toBeVisible();
  });

  test('tapping the card flips it and reveals the correct translation', async ({ page }) => {
    const truth = await loadTruth();
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const pair = truth.getCardByPt(front);
    expect(pair).toBeTruthy();

    await page.getByTestId('card-container').click();
    await expect(page.locator('#theCard')).toHaveClass(/flipped/);
    const back = (await page.getByTestId('card-back').locator('.card-word').textContent())?.trim();
    expect(back).toBe(pair.en);
  });

  test('marking right updates mobile counter and records server stat', async ({ page }) => {
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const expectedId = cardId(front);

    await page.getByTestId('btn-right').click();

    await expect(page.getByTestId('mobile-counter-correct')).toContainText('1');
    await waitForSessionWrite(page);

    const stats = await fetch(`${BASE}/api/stats`).then(r => r.json());
    expect(stats[expectedId]?.right).toBe(1);
  });

  test('mode toggle inside bottom sheet swaps front/back direction', async ({ page }) => {
    const truth = await loadTruth();

    // Open the bottom sheet.
    await page.getByTestId('mobile-cat-dropdown').click();
    const sheet = page.locator('#bottomSheet');
    await expect(sheet).toHaveClass(/open/);

    // The mode toggle button in the sheet shows current mode label.
    const modeBtn = sheet.locator('button.ctrl-btn', { hasText: 'PT → EN' });
    await expect(modeBtn).toBeVisible();
    await modeBtn.click();

    // Close sheet by tapping backdrop.
    await page.locator('#sheetBackdrop').click();
    await expect(sheet).not.toHaveClass(/open/);

    // Front should now be an English word from truth.
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const pair = truth.getCardByEn(front);
    expect(pair, `front "${front}" should be an english value in truth`).toBeTruthy();
  });

  test('toggling a category in bottom sheet removes its cards from the deck', async ({ page }) => {
    const truth = await loadTruth();

    // Open the bottom sheet.
    await page.getByTestId('mobile-cat-dropdown').click();
    const sheet = page.locator('#bottomSheet');
    await expect(sheet).toHaveClass(/open/);

    // Expand all groups inside the sheet.
    const headers = sheet.locator('.cat-group-header');
    const headerCount = await headers.count();
    for (let i = 0; i < headerCount; i++) await headers.nth(i).click();

    // Pick the first active filter button inside the sheet.
    const firstActive = sheet.locator('[data-testid="category-filter"].active').first();
    await expect(firstActive).toBeVisible();
    const catKey = await firstActive.getAttribute('data-category-key');
    const catCardPts = new Set(truth.getCardsInCategories([catKey]).map(c => c.pt));
    expect(catCardPts.size).toBeGreaterThan(0);

    // Toggle off.
    const stableLocator = sheet.locator(`[data-testid="category-filter"][data-category-key="${catKey}"]`);
    await stableLocator.click();
    await expect(stableLocator).not.toHaveClass(/active/);
    await waitForSessionWrite(page);

    // Close sheet and check current card is not from toggled-off cat.
    await page.locator('#sheetBackdrop').click();
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    expect(catCardPts.has(front), `card "${front}" should not appear after category was toggled off`).toBe(false);
  });
});
```

- [ ] **Step 2: Run the mobile spec**

```bash
npm test -- --project=mobile
```

Expected: 5 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/mobile.spec.js
git commit -m "test: add mobile viewport spec for core flows and bottom sheet"
```

---

## Task 10: Delete obsolete specs and correct CLAUDE.md

**Files:**
- Delete: `tests/deck.spec.js`, `tests/marking.spec.js`, `tests/categories.spec.js`
- Modify: `CLAUDE.md:48`

- [ ] **Step 1: Delete the three obsolete spec files**

```bash
git rm tests/deck.spec.js tests/marking.spec.js tests/categories.spec.js
```

- [ ] **Step 2: Fix the `card_id` description in CLAUDE.md**

Find this line in `CLAUDE.md`:

```
- Card IDs used by `card_stats.card_id` are constructed client-side from `pt` + `en` text — they are not the DB `cards.id` serial. Check the frontend for the exact format before touching stats code.
```

Replace with:

```
- Card IDs used by `card_stats.card_id` are constructed client-side as a slug of the card's `pt` text only (lowercase, diacritics stripped, non-alphanumerics collapsed to `-`, trimmed). See `getCardId()` in `public/index.html`. They are not the DB `cards.id` serial.
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md tests/
git commit -m "test: remove obsolete specs and fix card_id docs in CLAUDE.md"
```

---

## Task 11: Run the full suite and verify everything passes

- [ ] **Step 1: Run all projects**

```bash
npm test
```

Expected: All specs pass across both `chromium` and `mobile` projects. Specifically:
- `pair-integrity.spec.js` — 3 tests
- `deck-composition.spec.js` — 4 tests
- `mode.spec.js` — 4 tests
- `stats.spec.js` — 5 tests
- `session.spec.js` — 1 test (unchanged)
- `mobile.spec.js` — 5 tests (mobile project)

Total: 22 tests, all green.

- [ ] **Step 2: No commit (verification only)**

If any failures: diagnose with `--headed` or `--ui`, fix the underlying issue (either test or flaky wait), commit the fix, re-run.
