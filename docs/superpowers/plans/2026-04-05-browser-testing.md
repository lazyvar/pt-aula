# Browser Testing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Playwright browser test suite covering the core study loop (deck, marking, categories, mode, session) that runs locally via Docker Compose and in GitHub Actions CI.

**Architecture:** Playwright boots the real `server.js` against an ephemeral Postgres (Docker Compose locally, GH Actions service container in CI). Tests reset state via `POST /api/reseed` + `DELETE /api/stats` + `PUT /api/session` in `beforeEach`, run serially (`workers: 1`) because the app uses a global session row. Tests target existing behavior — each test should **pass on first run** since the features already exist.

**Tech Stack:** `@playwright/test`, Docker Compose, Postgres 16, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-04-05-browser-testing-design.md`

---

## File Structure

**Create:**
- `docker-compose.test.yml` — ephemeral Postgres on port 5433
- `playwright.config.js` — test runner config, boots `server.js`
- `tests/fixtures/reset.js` — `resetAll()` helper
- `tests/deck.spec.js`
- `tests/marking.spec.js`
- `tests/categories.spec.js`
- `tests/mode.spec.js`
- `tests/session.spec.js`
- `.github/workflows/test.yml`

**Modify:**
- `package.json` — add `@playwright/test` devDep + test scripts
- `.gitignore` — playwright artifacts
- `public/index.html` — add `data-testid` attributes

---

## Task 1: Install Playwright

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install Playwright as a dev dependency**

Run: `npm install --save-dev @playwright/test@latest`

Expected: `@playwright/test` appears under `devDependencies` in `package.json`.

- [ ] **Step 2: Install the Chromium browser**

Run: `npx playwright install chromium`

Expected: Chromium downloads to `~/Library/Caches/ms-playwright/` (macOS). No errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @playwright/test dev dependency"
```

---

## Task 2: Docker Compose test database

**Files:**
- Create: `docker-compose.test.yml`

- [ ] **Step 1: Create the compose file**

Write to `docker-compose.test.yml`:

```yaml
services:
  postgres-test:
    image: postgres:16-alpine
    container_name: pt-aula-postgres-test
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: pt_aula_test
    ports:
      - "5433:5432"
    tmpfs:
      - /var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d pt_aula_test"]
      interval: 1s
      timeout: 3s
      retries: 20
```

- [ ] **Step 2: Verify it starts and is healthy**

Run: `docker compose -f docker-compose.test.yml up -d --wait`

Expected: Container `pt-aula-postgres-test` starts, healthcheck passes, command returns success.

- [ ] **Step 3: Verify the DB is reachable**

Run: `docker exec pt-aula-postgres-test psql -U postgres -d pt_aula_test -c '\dt'`

Expected: `Did not find any relations.` (empty DB, no tables yet — that's correct).

- [ ] **Step 4: Tear it down**

Run: `docker compose -f docker-compose.test.yml down`

Expected: Container stops and is removed.

- [ ] **Step 5: Commit**

```bash
git add docker-compose.test.yml
git commit -m "test: add docker compose for ephemeral test postgres"
```

---

## Task 3: Playwright config

**Files:**
- Create: `playwright.config.js`

- [ ] **Step 1: Write the config**

Write to `playwright.config.js`:

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
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
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

- [ ] **Step 2: Bring up the test DB**

Run: `docker compose -f docker-compose.test.yml up -d --wait`

Expected: Postgres healthy.

- [ ] **Step 3: Verify Playwright can boot the server**

Run: `npx playwright test --list`

Expected: "No tests found" (since `tests/` doesn't exist yet) — but no server errors. The webServer starts, then no specs match, exit 0 or "no tests" message.

If the command hangs or errors about DB connection: check that port 5433 is free and the Postgres container is running (`docker ps`).

- [ ] **Step 4: Tear down the DB**

Run: `docker compose -f docker-compose.test.yml down`

- [ ] **Step 5: Commit**

```bash
git add playwright.config.js
git commit -m "test: add playwright config with webServer and chromium project"
```

---

## Task 4: Update .gitignore

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Read current .gitignore**

Run: `cat .gitignore`

- [ ] **Step 2: Append Playwright artifacts**

Append these lines to `.gitignore`:

```
# Playwright
playwright-report/
test-results/
playwright/.cache/
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore playwright artifacts"
```

---

## Task 5: npm test scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add test scripts**

Edit the `"scripts"` block in `package.json` to add:

```json
"scripts": {
  "start": "node server.js",
  "test": "docker compose -f docker-compose.test.yml up -d --wait && playwright test; EXIT=$?; docker compose -f docker-compose.test.yml down; exit $EXIT",
  "test:ui": "docker compose -f docker-compose.test.yml up -d --wait && playwright test --ui",
  "test:headed": "docker compose -f docker-compose.test.yml up -d --wait && playwright test --headed"
}
```

- [ ] **Step 2: Verify `npm test` runs (expect zero tests)**

Run: `npm test`

Expected: Postgres starts, Playwright runs with "no tests found" or similar zero-test output, Postgres is torn down, exit code 0.

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "test: add npm test, test:ui, test:headed scripts"
```

---

## Task 6: Add data-testid attributes to frontend

**Files:**
- Modify: `public/index.html`

The tests need stable hooks. We add `data-testid` attributes on ambiguous elements (buttons that appear in multiple layout variants, counters, etc.).

- [ ] **Step 1: Identify the card-view render block**

Read `public/index.html` lines 1195-1240 to locate the main card render block (inside `renderCard()`).

- [ ] **Step 2: Add testids to the card view**

Edit `public/index.html`:

On line 1205 (`${correct}` span), change:
```html
<span><span class="dot green"></span> ${correct}</span>
```
to:
```html
<span data-testid="counter-correct"><span class="dot green"></span> ${correct}</span>
```

On line 1206 (`${wrong}` span), change:
```html
<span><span class="dot red"></span> ${wrong}</span>
```
to:
```html
<span data-testid="counter-wrong"><span class="dot red"></span> ${wrong}</span>
```

On line 1207 (remaining span), change:
```html
<span><span class="dot gray"></span> ${deck.length - currentIndex} left</span>
```
to:
```html
<span data-testid="counter-remaining"><span class="dot gray"></span> ${deck.length - currentIndex} left</span>
```

On line 1212 (card container), change:
```html
<div class="card-container" id="cardContainer" onclick="flipCard()">
```
to:
```html
<div class="card-container" id="cardContainer" data-testid="card-container" onclick="flipCard()">
```

On line 1214 (card front face), change:
```html
<div class="card-face card-front">
```
to:
```html
<div class="card-face card-front" data-testid="card-front">
```

On line 1220 (card back face), change:
```html
<div class="card-face card-back">
```
to:
```html
<div class="card-face card-back" data-testid="card-back">
```

On line 1230 (wrong button in card view), change:
```html
<button class="btn btn-wrong" onclick="mark(false)">✗ Again</button>
```
to:
```html
<button class="btn btn-wrong" data-testid="btn-wrong" onclick="mark(false)">✗ Again</button>
```

On line 1231 (right button in card view), change:
```html
<button class="btn btn-right" onclick="mark(true)">✓ Got it</button>
```
to:
```html
<button class="btn btn-right" data-testid="btn-right" onclick="mark(true)">✓ Got it</button>
```

- [ ] **Step 3: Add testid to mode toggle (card-view instance only)**

Read `public/index.html` line 1191 to find the mode toggle inside the card view's sidebar-controls. Change:
```html
<button class="ctrl-btn" onclick="toggleMode()">${mode === "pt-to-en" ? "PT → EN" : "EN → PT"}</button>
```
to:
```html
<button class="ctrl-btn" data-testid="mode-toggle" onclick="toggleMode()">${mode === "pt-to-en" ? "PT → EN" : "EN → PT"}</button>
```

**Important:** there are 4 instances of `toggleMode()` buttons across different layout variants (lines ~1085, ~1124, ~1148, ~1191). Only modify the one in the **card view** block (the one near `renderCard()`, around line 1191). Tests only exercise the card view, and using a single testid guarantees uniqueness.

- [ ] **Step 4: Add testid to category filter buttons**

Read `public/index.html` around line 794 where `filter-btn` is rendered. Change:
```html
`<button class="filter-btn ${c.active ? 'active' : ''}" onclick="toggleCat('${c.key}')">${c.label} (${c.count})</button>`
```
to:
```html
`<button class="filter-btn ${c.active ? 'active' : ''}" data-testid="category-filter" data-category-key="${c.key}" onclick="toggleCat('${c.key}')">${c.label} (${c.count})</button>`
```

- [ ] **Step 5: Start the dev server and smoke-test in the browser manually**

Run: `DATABASE_URL=postgres://localhost/pt_aula npm start` (use your real dev DB, not test)

Open `http://localhost:3005` in a browser. Click a card — it should still flip. Mark right/wrong — counters should still update. Toggle a category — deck should still filter. Verify nothing broke visually.

Stop the server (Ctrl-C).

- [ ] **Step 6: Commit**

```bash
git add public/index.html
git commit -m "test: add data-testid hooks for browser tests"
```

---

## Task 7: Create reset fixture

**Files:**
- Create: `tests/fixtures/reset.js`

- [ ] **Step 1: Write the reset helper**

Write to `tests/fixtures/reset.js`:

```js
// Resets the app to a clean, deterministic state for each test.
// Calls the server's own API endpoints so we don't need direct DB access.

const BASE = 'http://localhost:3006';

async function resetAll() {
  // 1. Reseed cards + categories from ./seeds
  const reseedRes = await fetch(`${BASE}/api/reseed`, { method: 'POST' });
  if (!reseedRes.ok) throw new Error(`reseed failed: ${reseedRes.status}`);

  // 2. Clear card stats
  const statsRes = await fetch(`${BASE}/api/stats`, { method: 'DELETE' });
  if (!statsRes.ok) throw new Error(`delete stats failed: ${statsRes.status}`);

  // 3. Delete the session row. GET /api/session then returns null, which makes
  //    the frontend fall through to startDeck() with its default activeCats
  //    (all non-Topics categories). PUT with activeCats:null would clobber
  //    that default and leave an empty deck, so we DELETE instead.
  const sessionRes = await fetch(`${BASE}/api/session`, { method: 'DELETE' });
  if (!sessionRes.ok) throw new Error(`delete session failed: ${sessionRes.status}`);
}

module.exports = { resetAll, BASE };
```

- [ ] **Step 2: Verify the helper structure is valid JS**

Run: `node -e "require('./tests/fixtures/reset.js')"`

Expected: No output, no errors. (If it errors with "fetch is not defined", ensure Node 20+ is used.)

- [ ] **Step 3: Commit**

```bash
git add tests/fixtures/reset.js
git commit -m "test: add resetAll fixture for per-test state isolation"
```

---

## Task 8: Deck spec (flow A)

**Files:**
- Create: `tests/deck.spec.js`

- [ ] **Step 1: Write the deck spec**

Write to `tests/deck.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');

test.describe('Deck basics', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    // Wait for card to render
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('loads a card with Portuguese text on the front', async ({ page }) => {
    const front = page.getByTestId('card-front');
    await expect(front).toBeVisible();
    const frontText = await front.locator('.card-word').textContent();
    expect(frontText?.trim().length ?? 0).toBeGreaterThan(0);
  });

  test('flipping the card reveals the English translation', async ({ page }) => {
    const card = page.locator('#theCard');
    await expect(card).not.toHaveClass(/flipped/);

    await page.getByTestId('card-container').click();

    await expect(card).toHaveClass(/flipped/);
    const back = page.getByTestId('card-back');
    const backText = await back.locator('.card-word').textContent();
    expect(backText?.trim().length ?? 0).toBeGreaterThan(0);
  });

  test('advancing shows a new card and decrements remaining count', async ({ page }) => {
    const firstWord = await page.getByTestId('card-front').locator('.card-word').textContent();
    const remainingBefore = await page.getByTestId('counter-remaining').textContent();

    await page.getByTestId('btn-right').click();

    // Card content should change (new card is showing)
    await expect(async () => {
      const nextWord = await page.getByTestId('card-front').locator('.card-word').textContent();
      expect(nextWord).not.toBe(firstWord);
    }).toPass({ timeout: 2000 });

    const remainingAfter = await page.getByTestId('counter-remaining').textContent();
    expect(remainingAfter).not.toBe(remainingBefore);
  });
});
```

- [ ] **Step 2: Run the deck spec**

Run: `npm test -- tests/deck.spec.js`

Expected: 3 tests pass. Postgres starts, tests run, Postgres stops.

If a test fails, read the error. Common issues:
- "Waiting for card-container to be visible" → the server isn't seeding or the page isn't rendering; check Playwright trace (`playwright-report/`)
- "New card is showing" assertion fails → check `mark()` logic in `public/index.html:1248`

- [ ] **Step 3: Commit**

```bash
git add tests/deck.spec.js
git commit -m "test: add deck flow spec (load, flip, advance)"
```

---

## Task 9: Marking spec (flow B)

**Files:**
- Create: `tests/marking.spec.js`

- [ ] **Step 1: Write the marking spec**

Write to `tests/marking.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');

test.describe('Marking cards', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('marking right increments the correct counter', async ({ page }) => {
    await expect(page.getByTestId('counter-correct')).toContainText('0');

    await page.getByTestId('btn-right').click();

    await expect(page.getByTestId('counter-correct')).toContainText('1');
  });

  test('marking wrong increments the wrong counter', async ({ page }) => {
    await expect(page.getByTestId('counter-wrong')).toContainText('0');

    await page.getByTestId('btn-wrong').click();

    await expect(page.getByTestId('counter-wrong')).toContainText('1');
  });

  test('stats persist across reload', async ({ page }) => {
    // Mark one right, one wrong
    await page.getByTestId('btn-right').click();
    await expect(page.getByTestId('counter-correct')).toContainText('1');

    await page.getByTestId('btn-wrong').click();
    await expect(page.getByTestId('counter-wrong')).toContainText('1');

    // mark() fires saveSession() without await, so wait for the PUT to settle
    // before reloading — otherwise the session write can race the navigation.
    await page.waitForLoadState('networkidle');

    // Reload; session should restore counters
    await page.reload();
    await expect(page.getByTestId('card-container')).toBeVisible();

    await expect(page.getByTestId('counter-correct')).toContainText('1');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
  });
});
```

- [ ] **Step 2: Run the marking spec**

Run: `npm test -- tests/marking.spec.js`

Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/marking.spec.js
git commit -m "test: add marking flow spec (right/wrong counters, persistence)"
```

---

## Task 10: Categories spec (flow C)

**Files:**
- Create: `tests/categories.spec.js`

- [ ] **Step 1: Write the categories spec**

Write to `tests/categories.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');

test.describe('Category filtering', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('sidebar lists category filter buttons', async ({ page }) => {
    const filters = page.getByTestId('category-filter');
    const count = await filters.count();
    expect(count).toBeGreaterThan(0);
  });

  test('toggling a category off removes it from active filters', async ({ page }) => {
    const firstFilter = page.getByTestId('category-filter').first();
    await expect(firstFilter).toHaveClass(/active/);

    await firstFilter.click();

    await expect(firstFilter).not.toHaveClass(/active/);
  });

  test('toggling a category back on restores active state', async ({ page }) => {
    const firstFilter = page.getByTestId('category-filter').first();
    await firstFilter.click();
    await expect(firstFilter).not.toHaveClass(/active/);

    await firstFilter.click();

    await expect(firstFilter).toHaveClass(/active/);
  });
});
```

Note: we assert on the visible active/inactive *state* of filter buttons rather than counting cards in the deck, because asserting deck contents requires enumerating cards and coupling to seed data. The active-state toggle is the user-visible behavior.

- [ ] **Step 2: Run the categories spec**

Run: `npm test -- tests/categories.spec.js`

Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/categories.spec.js
git commit -m "test: add category filter toggle spec"
```

---

## Task 11: Mode spec (flow D)

**Files:**
- Create: `tests/mode.spec.js`

- [ ] **Step 1: Write the mode spec**

Write to `tests/mode.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');

test.describe('Mode toggle (pt↔en)', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('default mode is pt-to-en (button shows PT → EN)', async ({ page }) => {
    const toggle = page.getByTestId('mode-toggle');
    await expect(toggle).toContainText('PT');
    await expect(toggle).toContainText('EN');
    // In pt-to-en mode, button text is "PT → EN"
    const text = (await toggle.textContent())?.trim() ?? '';
    expect(text.indexOf('PT')).toBeLessThan(text.indexOf('EN'));
  });

  test('toggling mode swaps front/back of the card', async ({ page }) => {
    const frontBefore = await page.getByTestId('card-front').locator('.card-word').textContent();

    await page.getByTestId('mode-toggle').click();

    // After toggle, the front word should be different (it's now the English side)
    await expect(async () => {
      const frontAfter = await page.getByTestId('card-front').locator('.card-word').textContent();
      expect(frontAfter).not.toBe(frontBefore);
    }).toPass({ timeout: 2000 });
  });

  test('mode persists across reload', async ({ page }) => {
    await page.getByTestId('mode-toggle').click();
    const textAfterToggle = (await page.getByTestId('mode-toggle').textContent())?.trim() ?? '';

    // toggleMode() calls saveSession() without await; wait for the PUT to settle.
    await page.waitForLoadState('networkidle');

    await page.reload();
    await expect(page.getByTestId('card-container')).toBeVisible();

    const textAfterReload = (await page.getByTestId('mode-toggle').textContent())?.trim() ?? '';
    expect(textAfterReload).toBe(textAfterToggle);
  });
});
```

- [ ] **Step 2: Run the mode spec**

Run: `npm test -- tests/mode.spec.js`

Expected: 3 tests pass.

- [ ] **Step 3: Commit**

```bash
git add tests/mode.spec.js
git commit -m "test: add pt↔en mode toggle spec"
```

---

## Task 12: Session spec (flow E)

**Files:**
- Create: `tests/session.spec.js`

- [ ] **Step 1: Write the session spec**

Write to `tests/session.spec.js`:

```js
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');

test.describe('Session persistence', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('mid-deck state is restored after reload', async ({ page }) => {
    // Mark 3 cards: 2 right, 1 wrong
    await page.getByTestId('btn-right').click();
    await page.getByTestId('btn-right').click();
    await page.getByTestId('btn-wrong').click();

    await expect(page.getByTestId('counter-correct')).toContainText('2');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');

    // Capture the current card's front word
    const currentFront = await page.getByTestId('card-front').locator('.card-word').textContent();
    const currentRemaining = await page.getByTestId('counter-remaining').textContent();

    // Wait for the fire-and-forget saveSession() PUT triggered by mark() to settle.
    await page.waitForLoadState('networkidle');

    // Reload
    await page.reload();
    await expect(page.getByTestId('card-container')).toBeVisible();

    // Counters restored
    await expect(page.getByTestId('counter-correct')).toContainText('2');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');

    // Same card still showing
    const restoredFront = await page.getByTestId('card-front').locator('.card-word').textContent();
    expect(restoredFront).toBe(currentFront);

    // Same remaining count
    const restoredRemaining = await page.getByTestId('counter-remaining').textContent();
    expect(restoredRemaining).toBe(currentRemaining);
  });
});
```

- [ ] **Step 2: Run the session spec**

Run: `npm test -- tests/session.spec.js`

Expected: 1 test passes.

- [ ] **Step 3: Commit**

```bash
git add tests/session.spec.js
git commit -m "test: add session persistence spec (reload mid-deck resume)"
```

---

## Task 13: Full local suite run

**Files:** none

- [ ] **Step 1: Run the full suite**

Run: `npm test`

Expected: All 13 tests pass across 5 spec files. Postgres spins up once, server boots once, all tests run, Postgres tears down.

If any test fails, debug with `npm run test:headed` to watch it in a browser, or open `playwright-report/index.html` after a failed run.

- [ ] **Step 2: No commit needed** (verification only)

---

## Task 14: GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/test.yml`

- [ ] **Step 1: Create the workflow**

Write to `.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: pt_aula_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U postgres -d pt_aula_test"
          --health-interval 1s
          --health-timeout 3s
          --health-retries 20

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      - name: Run Playwright tests
        env:
          CI: 'true'
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/pt_aula_test
        run: npx playwright test

      - name: Upload Playwright report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14
```

**Why CI bypasses `npm test`:** the `npm test` script brings up Docker Compose, but CI uses a GitHub Actions service container instead. We run `npx playwright test` directly with `DATABASE_URL` pointing at the service container on localhost:5432. The `webServer` config in `playwright.config.js` picks up the env var and boots `server.js` against it.

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/test.yml
git commit -m "ci: add github actions workflow for playwright tests"
```

- [ ] **Step 3: Push and verify CI runs**

Push to a branch or main. Open GitHub Actions tab and confirm the workflow runs and passes.

If it fails, download the `playwright-report` artifact to inspect the failure trace.

---

## Done

All core flows covered, local + CI testing in place. Future work (out of scope):
- Generated mode spec
- Reseed flow spec
- Cross-browser testing (firefox, webkit)
- Visual regression
