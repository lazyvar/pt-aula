# Svelte Frontend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate pt-aula frontend from single-file `public/index.html` (1356 lines of inline HTML/CSS/JS) to a Svelte 4 + TypeScript + Vite SPA. Backend untouched. All existing Playwright specs keep passing. New characterization specs (added in Phase 0) also keep passing.

**Architecture:** Vanilla Svelte 4 SPA, `<script lang="ts">`, Vite build to `dist/`, Express serves `dist/` statically. Three Svelte writable stores (`session`, `stats`, `cards`) plus one generated-mode store (`generated`). Auto-PUT debounced + `beforeunload` flush via `sendBeacon`. ~6 Svelte components: `App`, `Sidebar`, `BottomSheet`, `CategoryPicker`, `ControlButtons`, `MobileTopBar`, `CardDeck`. Done screens + gen-banner + empty state inline in `App.svelte`.

**Tech Stack:** Svelte 4, TypeScript, Vite 5, @sveltejs/vite-plugin-svelte, Node 20, Express 4 (unchanged), Playwright (unchanged).

**Reference files:**
- Current frontend: `public/index.html` (1356 lines — CSS lines 9–727, HTML shell lines 729–732, JS lines 733–1355)
- Current server: `server.js` (static serve at line 15)
- Design spec: `docs/superpowers/specs/2026-04-05-svelte-frontend-migration-design.md`

**Selectors that MUST be preserved** (Playwright contract):
- `data-testid`: `category-filter`, `mobile-counter-correct`, `mobile-counter-wrong`, `mobile-counter-remaining`, `mobile-cat-dropdown`, `mode-toggle`, `card-container`, `card-front`, `card-back`, `counter-correct`, `counter-wrong`, `counter-remaining`, `btn-wrong`, `btn-right`
- `data-category-key` attribute on category filter buttons
- DOM IDs: `bottomSheet`, `sheetBackdrop`, `theCard`, `sheetHandle`, `cardContainer`
- CSS classes: `open` (on bottomSheet/backdrop), `flipped` (on theCard), `card-word`, `cat-group-header`, `ctrl-btn`, `active` (on filter buttons), `sidebar`

---

## Phase 0: Characterization Tests

**Purpose:** Lock in current frontend behavior with Playwright specs BEFORE touching any code. Each new spec must pass against the current `public/index.html` first, proving it tests real behavior. These specs then guard the Svelte rewrite.

**Files created:**
- `tests/generated-mode.spec.js`
- `tests/keyboard.spec.js`
- `tests/default-active-cats.spec.js`
- `tests/done-screens.spec.js`

**Testing infrastructure already available** (do not re-create):
- `tests/fixtures/reset.js` — `resetAll()`, `setActiveCategories(catIds)`, `BASE = 'http://localhost:3006'`
- `tests/fixtures/truth.js` — `loadTruth()`, `cardId()`, `BASE`
- `tests/fixtures/waits.js` — `waitForSessionWrite(page)`

**Important:** The `generate-sentences` server endpoint calls Anthropic's API. To test without real API calls, the characterization test uses a mock approach via Playwright's `page.route()` to intercept `/api/generate-sentences`. This keeps Phase 0 deterministic and CI-safe.

### Task 0.1: Spec for default activeCats on first boot

**Files:**
- Create: `tests/default-active-cats.spec.js`

- [ ] **Step 1: Write the spec**

```javascript
// tests/default-active-cats.spec.js
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');
const { loadTruth, BASE } = require('./fixtures/truth');
const { waitForSessionWrite } = require('./fixtures/waits');

test.describe('Default activeCats on first boot', () => {
  test.beforeEach(async () => {
    await resetAll();
  });

  test('first boot (no session) activates all non-Topics categories', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    await waitForSessionWrite(page);

    const truth = await loadTruth();
    const expected = new Set(truth.getDefaultActiveCats());

    const session = await fetch(`${BASE}/api/session`).then(r => r.json());
    expect(session).not.toBeNull();
    const actual = new Set(session.activeCats);

    expect(actual.size).toBe(expected.size);
    for (const id of expected) {
      expect(actual.has(id), `cat "${id}" should be active by default`).toBe(true);
    }
  });

  test('first-boot deck contains only cards from non-Topics categories', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();

    const truth = await loadTruth();
    const nonTopicsCats = new Set(truth.getDefaultActiveCats());

    // Walk first 20 cards, verify each is in a non-Topics category
    for (let i = 0; i < 20; i++) {
      if (await page.getByTestId('card-front').count() === 0) break;
      const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
      const card = truth.getCardByPt(front);
      expect(card, `card "${front}" should exist`).toBeTruthy();
      expect(nonTopicsCats.has(card.cat), `card "${front}" cat "${card.cat}" should be non-Topics`).toBe(true);
      await page.getByTestId('btn-right').click();
      await expect(async () => {
        const count = await page.getByTestId('card-front').count();
        if (count === 0) return;
        const next = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
        expect(next).not.toBe(front);
      }).toPass({ timeout: 2000 });
    }
  });
});
```

- [ ] **Step 2: Bring up test DB + server**

```bash
docker compose -f docker-compose.test.yml up -d --wait
```

- [ ] **Step 3: Run spec against CURRENT frontend to verify it passes**

```bash
npx playwright test tests/default-active-cats.spec.js
```

Expected: 2 passed. If either fails, stop and investigate — the test is miscalibrated or the current behavior differs from the spec assumption.

- [ ] **Step 4: Commit**

```bash
git add tests/default-active-cats.spec.js
git commit -m "test: add spec for default activeCats on first boot"
```

### Task 0.2: Spec for keyboard shortcuts

**Files:**
- Create: `tests/keyboard.spec.js`

- [ ] **Step 1: Write the spec**

```javascript
// tests/keyboard.spec.js
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');
const { waitForSessionWrite } = require('./fixtures/waits');

test.describe('Keyboard shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('Space flips the card', async ({ page }) => {
    await expect(page.locator('#theCard')).not.toHaveClass(/flipped/);
    await page.keyboard.press('Space');
    await expect(page.locator('#theCard')).toHaveClass(/flipped/);
    await page.keyboard.press('Space');
    await expect(page.locator('#theCard')).not.toHaveClass(/flipped/);
  });

  test('ArrowRight flips the card', async ({ page }) => {
    await expect(page.locator('#theCard')).not.toHaveClass(/flipped/);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#theCard')).toHaveClass(/flipped/);
  });

  test('ArrowLeft flips the card', async ({ page }) => {
    await expect(page.locator('#theCard')).not.toHaveClass(/flipped/);
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#theCard')).toHaveClass(/flipped/);
  });

  test('Enter marks the current card correct', async ({ page }) => {
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('counter-correct')).toContainText('1');
    await expect(page.getByTestId('counter-wrong')).toContainText('0');
  });

  test('Backspace marks the current card wrong', async ({ page }) => {
    await page.keyboard.press('Backspace');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
    await expect(page.getByTestId('counter-correct')).toContainText('0');
  });

  test('Delete marks the current card wrong', async ({ page }) => {
    await page.keyboard.press('Delete');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
  });

  test('multiple shortcuts in sequence', async ({ page }) => {
    await page.keyboard.press('Space');           // flip
    await page.keyboard.press('Enter');            // mark correct (advances card)
    await page.keyboard.press('Backspace');        // mark wrong
    await page.keyboard.press('Enter');            // mark correct
    await expect(page.getByTestId('counter-correct')).toContainText('2');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
    await waitForSessionWrite(page);
  });
});
```

- [ ] **Step 2: Run spec against CURRENT frontend to verify it passes**

```bash
npx playwright test tests/keyboard.spec.js
```

Expected: 7 passed.

- [ ] **Step 3: Commit**

```bash
git add tests/keyboard.spec.js
git commit -m "test: add spec for keyboard shortcuts (Space/arrows/Enter/Backspace)"
```

### Task 0.3: Spec for done screens and empty state

**Files:**
- Create: `tests/done-screens.spec.js`

- [ ] **Step 1: Write the spec**

```javascript
// tests/done-screens.spec.js
const { test, expect } = require('@playwright/test');
const { resetAll, setActiveCategories } = require('./fixtures/reset');
const { loadTruth } = require('./fixtures/truth');

// Pick the smallest non-Topics category for fast walks.
function pickSmallestCategory(truth) {
  const counts = Object.keys(truth.categories)
    .filter(id => truth.categories[id].group !== 'Topics')
    .map(id => ({ id, count: truth.getCardsInCategories([id]).length }))
    .filter(x => x.count > 0)
    .sort((a, b) => a.count - b.count);
  return counts[0].id;
}

test.describe('Done screens', () => {
  test.beforeEach(async () => {
    await resetAll();
  });

  test('empty deck shows "Cadê as cartas?" state with no active categories', async ({ page }) => {
    // Set a session with an empty activeCats. The frontend's loadSession will
    // then find deck.length === 0 and fall into the empty-state branch.
    // NOTE: setActiveCategories with [] will make the frontend startDeck() from
    // empty cats, producing an empty deck.
    await setActiveCategories([]);
    await page.goto('/');
    await expect(page.getByText('Cadê as cartas?')).toBeVisible();
    await expect(page.getByText(/Pick some topics/)).toBeVisible();
    // Card container should not exist
    await expect(page.getByTestId('card-container')).toHaveCount(0);
  });

  test('finishing a deck with 100% correct shows "Parabéns!"', async ({ page }) => {
    const truth = await loadTruth();
    const cat = pickSmallestCategory(truth);
    await setActiveCategories([cat]);
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();

    const deckSize = truth.getCardsInCategories([cat]).length;
    for (let i = 0; i < deckSize; i++) {
      await page.getByTestId('btn-right').click();
    }

    await expect(page.getByText('Parabéns!')).toBeVisible();
    await expect(page.getByText(/100% accuracy/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Study Again' })).toBeVisible();
  });

  test('finishing a deck with wrong answers shows "Round done!" with review button', async ({ page }) => {
    const truth = await loadTruth();
    const cat = pickSmallestCategory(truth);
    await setActiveCategories([cat]);
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();

    const deckSize = truth.getCardsInCategories([cat]).length;
    // Mark first card wrong, rest correct
    await page.getByTestId('btn-wrong').click();
    for (let i = 1; i < deckSize; i++) {
      await page.getByTestId('btn-right').click();
    }

    await expect(page.getByText('Round done!')).toBeVisible();
    await expect(page.getByText(/You finished/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Review Wrong Cards' })).toBeVisible();
  });

  test('clicking "Review Wrong Cards" starts a new round with only the missed cards', async ({ page }) => {
    const truth = await loadTruth();
    const cat = pickSmallestCategory(truth);
    await setActiveCategories([cat]);
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();

    const deckSize = truth.getCardsInCategories([cat]).length;
    // Mark first 2 cards wrong, rest correct
    const wrongFronts = [];
    for (let i = 0; i < 2 && i < deckSize; i++) {
      const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
      wrongFronts.push(front);
      await page.getByTestId('btn-wrong').click();
    }
    for (let i = 2; i < deckSize; i++) {
      await page.getByTestId('btn-right').click();
    }

    await expect(page.getByRole('button', { name: 'Review Wrong Cards' })).toBeVisible();
    await page.getByRole('button', { name: 'Review Wrong Cards' }).click();

    // Now on review round — counter should show 2 remaining
    await expect(page.getByTestId('card-container')).toBeVisible();
    await expect(page.getByTestId('counter-remaining')).toContainText('2');
    await expect(page.getByTestId('counter-correct')).toContainText('0');
    await expect(page.getByTestId('counter-wrong')).toContainText('0');
  });
});
```

- [ ] **Step 2: Run spec against CURRENT frontend to verify it passes**

```bash
npx playwright test tests/done-screens.spec.js
```

Expected: 4 passed.

- [ ] **Step 3: Commit**

```bash
git add tests/done-screens.spec.js
git commit -m "test: add spec for done screens (empty/parabéns/round-done/review)"
```

### Task 0.4: Spec for Generated Mode

**Files:**
- Create: `tests/generated-mode.spec.js`

**Approach:** Generated Mode calls `/api/generate-sentences` which hits the Anthropic API. For deterministic/CI-safe tests, use `page.route()` to intercept this endpoint with a fixed 20-card response.

- [ ] **Step 1: Write the spec**

```javascript
// tests/generated-mode.spec.js
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');
const { BASE } = require('./fixtures/truth');

// Mock response: 20 sentence pairs
const MOCK_SENTENCES = Array.from({ length: 20 }, (_, i) => ({
  pt: `Frase de teste ${i + 1}`,
  en: `Test sentence ${i + 1}`,
}));

test.describe('Generated Mode', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    // Intercept the generate endpoint with a fixed response.
    await page.route('**/api/generate-sentences', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ cards: MOCK_SENTENCES }),
      });
    });
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('clicking Generate enters gen mode, shows banner, shows generated cards', async ({ page }) => {
    // Desktop sidebar has the Generate button
    await page.getByRole('button', { name: /Generate/ }).first().click();

    // Gen banner visible
    await expect(page.getByText(/Generated Mode/)).toBeVisible();
    await expect(page.getByText(/20 sentences/)).toBeVisible();

    // body has gen-mode class
    await expect(page.locator('body')).toHaveClass(/gen-mode/);

    // First generated card's pt is one of our mocks
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const mockPts = new Set(MOCK_SENTENCES.map(s => s.pt));
    expect(mockPts.has(front)).toBe(true);

    // Remaining count == 20
    await expect(page.getByTestId('counter-remaining')).toContainText('20');
  });

  test('in gen mode, marking cards does NOT write stats or session', async ({ page }) => {
    // Enter gen mode
    await page.getByRole('button', { name: /Generate/ }).first().click();
    await expect(page.getByText(/Generated Mode/)).toBeVisible();

    // Mark a card correct
    await page.getByTestId('btn-right').click();

    // Counter should increment client-side
    await expect(page.getByTestId('counter-correct')).toContainText('1');

    // But server stats should remain empty
    await page.waitForTimeout(300);  // allow any accidental writes to settle
    const stats = await fetch(`${BASE}/api/stats`).then(r => r.json());
    expect(Object.keys(stats).length).toBe(0);

    // And session should NOT have been overwritten with generated deck state.
    // Session's wrongCards/deckOrder should still reflect the real deck, not mocks.
    const session = await fetch(`${BASE}/api/session`).then(r => r.json());
    const mockPts = new Set(MOCK_SENTENCES.map(s => s.pt));
    for (const pt of (session?.deckOrder || [])) {
      expect(mockPts.has(pt), `session.deckOrder should not contain mock pt "${pt}"`).toBe(false);
    }
  });

  test('exiting gen mode restores the previous deck', async ({ page }) => {
    // Capture pre-generate state: counters, current card
    const beforeFront = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const beforeRemaining = await page.getByTestId('counter-remaining').textContent();

    // Mark one wrong to seed wrongCards
    await page.getByTestId('btn-wrong').click();
    await page.waitForLoadState('networkidle');

    const afterMarkFront = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const afterMarkRemaining = await page.getByTestId('counter-remaining').textContent();

    // Enter gen mode
    await page.getByRole('button', { name: /Generate/ }).first().click();
    await expect(page.getByText(/Generated Mode/)).toBeVisible();

    // Exit gen mode
    await page.getByRole('button', { name: 'Exit' }).click();
    await expect(page.getByText(/Generated Mode/)).not.toBeVisible();
    await expect(page.locator('body')).not.toHaveClass(/gen-mode/);

    // Current card and remaining should match post-mark state
    const restoredFront = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const restoredRemaining = await page.getByTestId('counter-remaining').textContent();
    expect(restoredFront).toBe(afterMarkFront);
    expect(restoredRemaining).toBe(afterMarkRemaining);
    // Wrong counter from before entering gen mode should still be 1
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
  });

  test('Generate button is disabled when no categories are active', async ({ page }) => {
    // Dismiss all cats by clicking each active filter.
    // First expand all groups in sidebar.
    const headers = page.locator('.sidebar .cat-group-header');
    const headerCount = await headers.count();
    for (let i = 0; i < headerCount; i++) await headers.nth(i).click();

    // Click every active filter to deactivate.
    // We loop until none remain active.
    for (let guard = 0; guard < 50; guard++) {
      const active = page.locator('.sidebar [data-testid="category-filter"].active').first();
      if (await active.count() === 0) break;
      await active.click();
    }

    // Set up a dialog handler for the alert.
    let alertFired = false;
    page.on('dialog', async (dialog) => {
      alertFired = true;
      expect(dialog.message()).toContain('Select at least one category');
      await dialog.dismiss();
    });

    await page.getByRole('button', { name: /Generate/ }).first().click();
    await page.waitForTimeout(200);
    expect(alertFired).toBe(true);
    // Should NOT be in gen mode
    await expect(page.locator('body')).not.toHaveClass(/gen-mode/);
  });
});
```

- [ ] **Step 2: Run spec against CURRENT frontend to verify it passes**

```bash
npx playwright test tests/generated-mode.spec.js
```

Expected: 4 passed.

- [ ] **Step 3: Commit**

```bash
git add tests/generated-mode.spec.js
git commit -m "test: add spec for Generated Mode (enter/mark-without-stats/exit/empty-cats)"
```

### Task 0.5: Run full test suite to confirm no regressions

- [ ] **Step 1: Run full test suite against current frontend**

```bash
npx playwright test
```

Expected: all existing specs pass + all 4 new spec files pass. No failures.

- [ ] **Step 2: Bring down test DB**

```bash
docker compose -f docker-compose.test.yml down
```

---

## Phase 1: Scaffold Svelte + Vite + TypeScript

**Purpose:** Stand up a minimal Svelte 4 + Vite + TS project alongside the existing `public/index.html`. Dev server runs on :5173 with `/api` proxied to :3005. Production build produces `dist/` but is not yet served by Express — the old app still runs unchanged.

**Files created:**
- `vite.config.ts`
- `svelte.config.js`
- `tsconfig.json`
- `tsconfig.node.json`
- `index.html` (at repo root — Vite entry)
- `src/main.ts`
- `src/App.svelte` (hello-world)
- `src/app.d.ts`
- `.gitignore` (append `dist/`, `node_modules/` if not already)

**Files modified:**
- `package.json` — add dev deps, add `dev`/`build`/`preview` scripts

### Task 1.1: Install Svelte + Vite + TS dev dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install dev deps**

```bash
npm install --save-dev svelte@^4.2.0 vite@^5.4.0 @sveltejs/vite-plugin-svelte@^3.1.0 typescript@^5.5.0 @tsconfig/svelte@^5.0.0 svelte-check@^3.8.0 tslib@^2.6.0
```

Expected: packages installed, `package.json` updated, `package-lock.json` updated.

- [ ] **Step 2: Verify install**

```bash
npx vite --version
npx tsc --version
```

Expected: Vite 5.x, TypeScript 5.x printed.

### Task 1.2: Create tsconfig files

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`

- [ ] **Step 1: Write tsconfig.json**

```json
{
  "extends": "@tsconfig/svelte/tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "resolveJsonModule": true,
    "allowJs": true,
    "checkJs": false,
    "isolatedModules": true,
    "moduleDetection": "force",
    "moduleResolution": "bundler",
    "strict": true,
    "noImplicitAny": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.svelte"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 2: Write tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

### Task 1.3: Create Vite and Svelte config

**Files:**
- Create: `vite.config.ts`
- Create: `svelte.config.js`

- [ ] **Step 1: Write vite.config.ts**

```ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3005',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
```

- [ ] **Step 2: Write svelte.config.js**

```js
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
};
```

### Task 1.4: Create entry HTML and main.ts

**Files:**
- Create: `index.html` (at repo root — Vite's entry, NOT `public/index.html`)
- Create: `src/main.ts`
- Create: `src/App.svelte`
- Create: `src/app.d.ts`

- [ ] **Step 1: Write index.html**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Português Aula</title>
<link rel="icon" type="image/png" href="/favicon.png">
<link href="https://fonts.googleapis.com/css2?family=Dela+Gothic+One&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body>
<div id="app"></div>
<script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 2: Write src/main.ts**

```ts
import App from './App.svelte';

const app = new App({
  target: document.getElementById('app')!,
});

export default app;
```

- [ ] **Step 3: Write src/App.svelte (hello-world placeholder)**

```svelte
<script lang="ts">
  // placeholder — replaced in Phase 2
</script>

<main>
  <h1>Português Aula — Svelte scaffold</h1>
</main>

<style>
  main { padding: 40px; font-family: 'DM Sans', sans-serif; }
</style>
```

- [ ] **Step 4: Write src/app.d.ts**

```ts
/// <reference types="svelte" />
/// <reference types="vite/client" />
```

### Task 1.5: Add dev/build scripts to package.json

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add scripts**

Edit `package.json` `"scripts"` section to add these keys (keep all existing keys, e.g. `start`, `test`, `test:ui`, `test:headed`):

```json
"dev": "vite",
"build": "vite build",
"preview": "vite preview",
"check": "svelte-check --tsconfig ./tsconfig.json"
```

- [ ] **Step 2: Verify final package.json scripts section**

Should contain: `start`, `test`, `test:ui`, `test:headed`, `dev`, `build`, `preview`, `check`.

### Task 1.6: Add dist/ to .gitignore

**Files:**
- Modify: `.gitignore` (create if missing)

- [ ] **Step 1: Check current .gitignore**

```bash
cat .gitignore 2>/dev/null || echo "(no .gitignore)"
```

- [ ] **Step 2: Ensure these entries are present**

Append (or create) to `.gitignore`:
```
node_modules
dist
.DS_Store
```

(If entries already exist, skip that entry. Don't duplicate.)

### Task 1.7: Verify scaffold runs

- [ ] **Step 1: Start Express backend in one terminal**

```bash
npm start
```

Expected: "Server running on http://localhost:3005".

Note: requires local Postgres at `postgres://localhost/pt_aula` with pt_aula DB created. If missing, this verification can be done later — the scaffold check doesn't require the API to respond.

- [ ] **Step 2: In another terminal, start Vite dev server**

```bash
npm run dev
```

Expected: "VITE ... ready ... Local: http://localhost:5173/".

- [ ] **Step 3: Open browser to http://localhost:5173**

Expected: "Português Aula — Svelte scaffold" heading visible, font loaded.

- [ ] **Step 4: Build production bundle**

Stop the dev server (Ctrl-C), then:

```bash
npm run build
```

Expected: `dist/` created with `index.html` and asset files. No build errors.

**Expected Vite warning:** Vite will warn that `public/index.html` would shadow `dist/index.html`. This is because Vite treats `public/` as its static-assets directory and copies it into `dist/`. During Phases 1–5 this collision is harmless (we only serve `public/index.html` via Express until cutover). The old `public/index.html` is deleted in Phase 5 Task 5.6, which resolves the warning permanently.

If the warning blocks the build, add `publicDir: false` temporarily to `vite.config.ts` for Phases 1–4, then remove it in Phase 5 after `public/index.html` is deleted. Since favicon lives in the same `public/` dir, removing it means moving favicon to a Vite-friendly path; leave `publicDir` alone and accept the warning unless it errors out.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts svelte.config.js index.html src/ .gitignore
git commit -m "feat: scaffold Svelte 4 + TypeScript + Vite frontend"
```

---

## Phase 2: Types, Stores, and Core Logic

**Purpose:** Port all state management and stateless helpers into typed modules. `App.svelte` remains hello-world for now; stores are written and unit-smoke-tested by hydrating them from the real API in `App.svelte`.

**Files created:**
- `src/types.ts`
- `src/lib/cardId.ts`
- `src/stores/cards.ts`
- `src/stores/stats.ts`
- `src/stores/session.ts`
- `src/stores/generated.ts`

**Files modified:**
- `src/App.svelte` (hook up hydration + basic render to verify stores)

### Task 2.1: Define shared types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Write types.ts**

```ts
// src/types.ts

export interface Card {
  pt: string;
  en: string;
  cat: string;
}

export interface CatConfig {
  cls: string;
  label: string;
  group: string;
}

export type CatConfigMap = Record<string, CatConfig>;

export interface Session {
  deckOrder: string[];       // array of pt strings
  currentIndex: number;
  correct: number;
  wrong: number;
  mode: 'pt-to-en' | 'en-to-pt';
  activeCats: string[];      // array of category ids
  wrongCards: string[];      // array of pt strings
}

export interface CardStat {
  right: number;
  wrong: number;
}

export type StatsMap = Record<string, CardStat>;

export interface DeckSnapshot {
  deck: Card[];
  currentIndex: number;
  correct: number;
  wrong: number;
  wrongCards: Card[];
}

export const GENERATED_CAT = '__generated__';
```

### Task 2.2: Port getCardId()

**Files:**
- Create: `src/lib/cardId.ts`

- [ ] **Step 1: Write cardId.ts (verbatim port from public/index.html:754-756)**

```ts
// src/lib/cardId.ts

/**
 * Slugifies a card's pt text to produce the stable ID used in card_stats.
 * This algorithm is load-bearing: if it changes, stats silently orphan.
 * Matches tests/fixtures/truth.js:cardId() exactly.
 */
export function getCardId(card: { pt: string }): string {
  return card.pt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
```

### Task 2.3: Create cards store

**Files:**
- Create: `src/stores/cards.ts`

- [ ] **Step 1: Write cards.ts**

```ts
// src/stores/cards.ts
import { writable, get } from 'svelte/store';
import type { Card, CatConfigMap } from '../types';

export const allCards = writable<Card[]>([]);
export const catConfig = writable<CatConfigMap>({});

/**
 * Fetch /api/cards once and populate the stores.
 */
export async function hydrateCards(): Promise<void> {
  const res = await fetch('/api/cards');
  if (!res.ok) throw new Error(`GET /api/cards failed: ${res.status}`);
  const data = await res.json() as { cards: Card[]; categories: CatConfigMap };
  allCards.set(data.cards);
  catConfig.set(data.categories);
}

/**
 * Returns all category ids whose group_name is not "Topics".
 * Used as the default activeCats on first boot.
 * Matches public/index.html:1348.
 */
export function getDefaultActiveCats(): string[] {
  const cfg = get(catConfig);
  return Object.keys(cfg).filter((id) => cfg[id].group !== 'Topics');
}
```

### Task 2.4: Create stats store

**Files:**
- Create: `src/stores/stats.ts`

- [ ] **Step 1: Write stats.ts**

```ts
// src/stores/stats.ts
import { writable, get } from 'svelte/store';
import type { Card, StatsMap, CardStat } from '../types';
import { getCardId } from '../lib/cardId';

export const statsCache = writable<StatsMap>({});

/**
 * Fetch all card stats once and populate the store.
 */
export async function hydrateStats(): Promise<void> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error(`GET /api/stats failed: ${res.status}`);
  const data = await res.json() as StatsMap;
  statsCache.set(data);
}

/**
 * Look up a card's current stats. Returns zeros if unseen.
 */
export function getCardStats(card: Card): CardStat {
  const id = getCardId(card);
  return get(statsCache)[id] || { right: 0, wrong: 0 };
}

/**
 * Mark a card right or wrong. POSTs to /api/stats/:id/mark and updates
 * the local store with the server's response.
 */
export async function markCard(card: Card, correct: boolean): Promise<void> {
  const id = getCardId(card);
  try {
    const res = await fetch(`/api/stats/${encodeURIComponent(id)}/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correct }),
    });
    if (!res.ok) throw new Error(`mark failed: ${res.status}`);
    const updated = await res.json() as CardStat;
    statsCache.update((s) => ({ ...s, [id]: updated }));
  } catch (err) {
    console.error('markCard failed', err);
  }
}

/**
 * DELETE /api/stats — clears all stats on server and locally.
 */
export async function resetStats(): Promise<void> {
  await fetch('/api/stats', { method: 'DELETE' });
  statsCache.set({});
}
```

### Task 2.5: Create generated-mode store

**Files:**
- Create: `src/stores/generated.ts`

- [ ] **Step 1: Write generated.ts**

```ts
// src/stores/generated.ts
import { writable, get } from 'svelte/store';
import type { Card, DeckSnapshot } from '../types';
import { GENERATED_CAT } from '../types';

export const generatedMode = writable<boolean>(false);
export const isGenerating = writable<boolean>(false);
export const generatedCards = writable<Card[]>([]);

// Snapshot of real deck state before entering gen mode.
// Not a Svelte store — plain module-level variable since components don't need
// to react to snapshot changes.
let savedSnapshot: DeckSnapshot | null = null;

/**
 * Call POST /api/generate-sentences with the active categories, swap the
 * deck to the generated cards on success.
 *
 * @param activeCats  array of category ids
 * @param takeSnapshot  called to capture the current deck state before the swap
 * @param applyGenerated  called with the generated Card[] to install into the app
 * @returns error message string on failure, null on success (or user-cancel)
 */
export async function generate(
  activeCats: string[],
  takeSnapshot: () => DeckSnapshot,
  applyGenerated: (cards: Card[]) => void,
): Promise<string | null> {
  if (get(isGenerating) || get(generatedMode)) return null;
  if (activeCats.length === 0) {
    return 'Select at least one category first.';
  }

  isGenerating.set(true);
  try {
    const res = await fetch('/api/generate-sentences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeCats }),
    });
    const data = await res.json() as { cards?: Array<{ pt: string; en: string }>; error?: string };
    if (!res.ok) return data.error || 'Generation failed';
    if (!data.cards || data.cards.length === 0) return 'No sentences were generated. Try again.';

    savedSnapshot = takeSnapshot();
    const cards: Card[] = data.cards.map((c) => ({ pt: c.pt, en: c.en, cat: GENERATED_CAT }));
    generatedCards.set(cards);
    applyGenerated(cards);
    generatedMode.set(true);
    document.body.classList.add('gen-mode');
    return null;
  } catch (err) {
    return 'Generation failed: ' + (err instanceof Error ? err.message : String(err));
  } finally {
    isGenerating.set(false);
  }
}

/**
 * Exit generated mode and restore the saved deck snapshot.
 * Caller must apply the snapshot to whatever state the real deck lives in.
 */
export function exitGenerated(applySnapshot: (snap: DeckSnapshot) => void): void {
  if (!get(generatedMode) || !savedSnapshot) return;
  applySnapshot(savedSnapshot);
  savedSnapshot = null;
  generatedMode.set(false);
  generatedCards.set([]);
  document.body.classList.remove('gen-mode');
}
```

### Task 2.6: Create session store with debounced auto-PUT

**Files:**
- Create: `src/stores/session.ts`

- [ ] **Step 1: Write session.ts**

```ts
// src/stores/session.ts
import { writable, get } from 'svelte/store';
import type { Card, Session } from '../types';
import { generatedMode } from './generated';

const INITIAL: Session = {
  deckOrder: [],
  currentIndex: 0,
  correct: 0,
  wrong: 0,
  mode: 'pt-to-en',
  activeCats: [],
  wrongCards: [],
};

export const session = writable<Session>(INITIAL);

// deck and wrongCards are derived from session (which holds pt strings)
// against allCards. Components compute them via derived stores. We also
// hold them as mutable stores here for actions that need to mutate directly.
export const deck = writable<Card[]>([]);
export const wrongCardsList = writable<Card[]>([]);

let hydrated = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 150;

// Subscribe once at module load to auto-PUT on every session mutation.
session.subscribe((s) => {
  if (!hydrated) return;
  if (get(generatedMode)) return;  // gen mode never writes session
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    fetch('/api/session', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
    }).catch((err) => console.error('session PUT failed', err));
  }, DEBOUNCE_MS);
});

/**
 * Fetch /api/session. If a session exists AND has a non-empty deckOrder
 * that contains at least one known card, return it. Otherwise return null.
 *
 * Populates session, deck, and wrongCardsList stores on success.
 * Sets hydrated=true regardless (so subsequent writes trigger auto-PUT).
 *
 * NOTE: matches current public/index.html:loadSession() behavior — it returns
 * false when deck is empty after filtering, which causes startDeck() to run.
 */
export async function hydrateSession(allCards: Card[]): Promise<boolean> {
  const res = await fetch('/api/session');
  if (!res.ok) {
    hydrated = true;
    return false;
  }
  const s = await res.json() as Session | null;
  if (!s) {
    hydrated = true;
    return false;
  }

  const cardMap = new Map(allCards.map((c) => [c.pt, c]));
  const resolvedDeck = s.deckOrder.map((pt) => cardMap.get(pt)).filter(Boolean) as Card[];
  const resolvedWrong = (s.wrongCards || []).map((pt) => cardMap.get(pt)).filter(Boolean) as Card[];

  // Restore session state even if deck is empty — activeCats may be populated
  // and we want startDeck() to use them.
  session.set({
    ...s,
    // Keep the deckOrder from server so hydrated=true write-back is a no-op.
  });
  deck.set(resolvedDeck);
  wrongCardsList.set(resolvedWrong);
  hydrated = true;
  return resolvedDeck.length > 0;
}

/**
 * Flush any pending auto-PUT using sendBeacon. Called from beforeunload.
 */
export function flushSession(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
    const body = JSON.stringify(get(session));
    navigator.sendBeacon('/api/session', body);
  }
}

/**
 * DELETE /api/session on the server.
 */
export async function deleteSession(): Promise<void> {
  await fetch('/api/session', { method: 'DELETE' });
}

// --- Fisher-Yates shuffle (ported from public/index.html:977-984) ---
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- Actions ---

/**
 * Reset the deck: shuffle all cards matching activeCats, reset counters.
 * Ported from public/index.html:1006-1015.
 */
export function startDeck(allCardsIn: Card[]): void {
  const active = new Set(get(session).activeCats);
  const shuffled = shuffle(allCardsIn.filter((c) => active.has(c.cat)));
  deck.set(shuffled);
  wrongCardsList.set([]);
  session.update((s) => ({
    ...s,
    deckOrder: shuffled.map((c) => c.pt),
    currentIndex: 0,
    correct: 0,
    wrong: 0,
    wrongCards: [],
  }));
}

/**
 * Shuffle remaining cards (from currentIndex onward). Ported from :1017-1025.
 */
export function shuffleRemaining(allCardsIn: Card[]): void {
  const currentDeck = get(deck);
  const s = get(session);
  const remaining = currentDeck.slice(s.currentIndex);
  if (remaining.length === 0) {
    startDeck(allCardsIn);
    return;
  }
  const shuffled = shuffle(remaining);
  const newDeck = [...currentDeck.slice(0, s.currentIndex), ...shuffled];
  deck.set(newDeck);
  session.update((ss) => ({ ...ss, deckOrder: newDeck.map((c) => c.pt) }));
}

/**
 * Review only the missed cards. Ported from :1027-1036.
 */
export function reviewWrongCards(): void {
  const wrong = get(wrongCardsList);
  const shuffled = shuffle(wrong);
  deck.set(shuffled);
  wrongCardsList.set([]);
  session.update((s) => ({
    ...s,
    deckOrder: shuffled.map((c) => c.pt),
    currentIndex: 0,
    correct: 0,
    wrong: 0,
    wrongCards: [],
  }));
}

/**
 * Toggle a category on/off. No-op if generatedMode is active.
 * Ported from :1038-1052.
 */
export function toggleCat(cat: string, allCardsIn: Card[]): void {
  if (get(generatedMode)) return;
  const s = get(session);
  const active = new Set(s.activeCats);
  const currentDeck = get(deck);
  const currentWrong = get(wrongCardsList);

  if (active.has(cat)) {
    active.delete(cat);
    const newDeck = currentDeck.filter((c) => c.cat !== cat);
    deck.set(newDeck);
    wrongCardsList.set(currentWrong.filter((c) => c.cat !== cat));
    const newIndex = Math.min(s.currentIndex, newDeck.length);
    session.update((ss) => ({
      ...ss,
      activeCats: [...active],
      deckOrder: newDeck.map((c) => c.pt),
      wrongCards: currentWrong.filter((c) => c.cat !== cat).map((c) => c.pt),
      currentIndex: newIndex,
    }));
  } else {
    active.add(cat);
    const newCards = shuffle(allCardsIn.filter((c) => c.cat === cat));
    // Insert after current position, matching current behavior:
    // deck = [...deck.slice(0, currentIndex), ...deck.slice(currentIndex), ...newCards]
    // (This appends new cards at the end of the remaining slice.)
    const newDeck = [
      ...currentDeck.slice(0, s.currentIndex),
      ...currentDeck.slice(s.currentIndex),
      ...newCards,
    ];
    deck.set(newDeck);
    session.update((ss) => ({
      ...ss,
      activeCats: [...active],
      deckOrder: newDeck.map((c) => c.pt),
    }));
  }
}

/**
 * Toggle mode. No-op on deck, just flips mode.
 */
export function toggleMode(): void {
  session.update((s) => ({
    ...s,
    mode: s.mode === 'pt-to-en' ? 'en-to-pt' : 'pt-to-en',
  }));
}

/**
 * Mark the current card correct/wrong. Updates counters, currentIndex,
 * and wrongCards (for review). Does NOT POST stats — caller is responsible.
 * Ported from :1248-1264.
 */
export function mark(card: Card, gotIt: boolean): void {
  const currentWrong = get(wrongCardsList);
  const newWrong = gotIt ? currentWrong : [...currentWrong, card];
  wrongCardsList.set(newWrong);
  session.update((s) => ({
    ...s,
    correct: s.correct + (gotIt ? 1 : 0),
    wrong: s.wrong + (gotIt ? 0 : 1),
    wrongCards: newWrong.map((c) => c.pt),
    currentIndex: s.currentIndex + 1,
  }));
}

/**
 * Snapshot for Generated Mode entry.
 */
export function snapshotDeck(): import('../types').DeckSnapshot {
  const s = get(session);
  return {
    deck: get(deck),
    currentIndex: s.currentIndex,
    correct: s.correct,
    wrong: s.wrong,
    wrongCards: get(wrongCardsList),
  };
}

/**
 * Restore a saved snapshot. Used on exiting Generated Mode.
 */
export function restoreSnapshot(snap: import('../types').DeckSnapshot): void {
  deck.set(snap.deck);
  wrongCardsList.set(snap.wrongCards);
  session.update((s) => ({
    ...s,
    deckOrder: snap.deck.map((c) => c.pt),
    currentIndex: snap.currentIndex,
    correct: snap.correct,
    wrong: snap.wrong,
    wrongCards: snap.wrongCards.map((c) => c.pt),
  }));
}

/**
 * Apply generated cards as the current deck (bypasses session since
 * generatedMode makes auto-PUT a no-op).
 */
export function applyGeneratedDeck(cards: Card[]): void {
  deck.set(cards);
  wrongCardsList.set([]);
  // We mutate session for counter display, but auto-PUT is suppressed
  // by generatedMode in the subscribe above.
  session.update((s) => ({
    ...s,
    currentIndex: 0,
    correct: 0,
    wrong: 0,
  }));
}
```

### Task 2.7: Hook up hydration in App.svelte (smoke test)

**Files:**
- Modify: `src/App.svelte`

- [ ] **Step 1: Rewrite App.svelte for hydration smoke test**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { allCards, hydrateCards, getDefaultActiveCats, catConfig } from './stores/cards';
  import { statsCache, hydrateStats } from './stores/stats';
  import { session, hydrateSession, startDeck, deck, flushSession } from './stores/session';
  import { get } from 'svelte/store';

  let loaded = false;
  let error: string | null = null;

  onMount(async () => {
    try {
      await hydrateCards();
      await hydrateStats();
      const restored = await hydrateSession(get(allCards));
      if (!restored) {
        // First boot: set default activeCats, then startDeck
        const defaults = getDefaultActiveCats();
        session.update((s) => ({ ...s, activeCats: defaults }));
        startDeck(get(allCards));
      }
      loaded = true;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    window.addEventListener('beforeunload', flushSession);
    return () => window.removeEventListener('beforeunload', flushSession);
  });
</script>

{#if error}
  <main><p style="color:red">Error: {error}</p></main>
{:else if !loaded}
  <main><p>Loading…</p></main>
{:else}
  <main>
    <h1>Svelte scaffold — hydrated</h1>
    <p>Cards loaded: {$allCards.length}</p>
    <p>Categories: {Object.keys($catConfig).length}</p>
    <p>Stats entries: {Object.keys($statsCache).length}</p>
    <p>Session mode: {$session.mode}</p>
    <p>Active cats: {$session.activeCats.length}</p>
    <p>Deck size: {$deck.length}</p>
    <p>currentIndex: {$session.currentIndex}</p>
  </main>
{/if}

<style>
  main { padding: 40px; font-family: 'DM Sans', sans-serif; }
  p { margin: 4px 0; }
</style>
```

- [ ] **Step 2: Start Express backend (with real DB)**

In a terminal:
```bash
npm start
```

(Or use the test DB via `docker compose -f docker-compose.test.yml up -d --wait`, then `PORT=3005 DATABASE_URL=postgres://pt_aula:pt_aula@localhost:5432/pt_aula npm start`.)

- [ ] **Step 3: Start Vite dev server and verify**

```bash
npm run dev
```

Open http://localhost:5173.

Expected: "Svelte scaffold — hydrated" with non-zero values for all fields. Default active cats should equal count of non-Topics categories. Deck size > 0.

- [ ] **Step 4: Type-check**

```bash
npm run check
```

Expected: 0 errors, 0 warnings.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: add types, stores, and hydration for Svelte frontend"
```

---

## Phase 3: Port CSS

**Purpose:** Move all styles from `public/index.html` into `src/App.svelte` `<style>` block, wrapped in `:global()` so they apply across all components. No visual regression from current app.

**Files modified:**
- `src/App.svelte`

### Task 3.1: Copy CSS into App.svelte

**Files:**
- Modify: `src/App.svelte`

- [ ] **Step 1: Read current CSS block**

Read `public/index.html` lines 9-727. This is the entire `<style>` block (between `<style>` and `</style>` tags).

- [ ] **Step 2: Add all CSS inside a `:global{}` wrapper in App.svelte**

Replace the existing `<style>` block in `src/App.svelte` with:

```svelte
<style>
  :global(*) { margin: 0; padding: 0; box-sizing: border-box; }

  :global(:root) {
    /* paste the :root custom properties block from public/index.html:12-21 */
  }

  /* Wrap every selector in :global() to disable Svelte's scoping, since the
     markup lives across multiple components that will be written in Phase 4
     and the class names must keep matching globally. */

  /* ... paste remaining CSS from public/index.html:23-727 here, with each
     top-level selector wrapped in :global(). */
</style>
```

**The transform pattern:**
- `body { ... }` → `:global(body) { ... }`
- `.sidebar { ... }` → `:global(.sidebar) { ... }`
- `.cat-group-header.collapsed .chevron { ... }` → `:global(.cat-group-header.collapsed .chevron) { ... }`
- `@media (max-width: 768px) { .sidebar { display: none; } }` → `@media (max-width: 768px) { :global(.sidebar) { display: none; } }`
- `@keyframes slideIn { ... }` → `:global(@keyframes slideIn { ... })` (or leave bare — Svelte's `@keyframes` become local by default, so `:global` is needed)
- `body::before { ... }` → `:global(body::before) { ... }`

**Tip:** a quick sed-style transform can convert most selectors:
```bash
# NOT a command to run — just illustrative of the transform
# "^(\s*)([.\w].*?)\s*\{" → "$1:global($2) {"
```
However, `@media`, `@keyframes`, `:root`, and nested blocks need manual handling. Prefer a careful manual paste with the patterns above.

- [ ] **Step 3: Verify in browser**

With `npm run dev` running, reload http://localhost:5173. The smoke-test page from Phase 2 should now have the DM Sans font, dark background, and the body gradient animation visible. The styling won't fully match until components are built (Phase 4), but the page body should look like the styled pt-aula app.

- [ ] **Step 4: Run svelte-check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/App.svelte
git commit -m "style: port CSS from public/index.html into App.svelte :global block"
```

---

## Phase 4: Port Components

**Purpose:** Port each region of the old index.html into its Svelte component. Components communicate through stores (not props/events) where possible, so each is self-contained. By the end of this phase, the Vite dev server at :5173 should be a pixel-and-behavior match for the current app.

**Component dependency order** (bottom-up — build leaves first, then assemble):
1. `CategoryPicker.svelte` — pure presentational, reads `catConfig`/`allCards`/`session`, calls `toggleCat`
2. `ControlButtons.svelte` — reads `session`/`isGenerating`/`generatedMode`, calls actions
3. `Sidebar.svelte` — composes CategoryPicker + ControlButtons
4. `BottomSheet.svelte` — composes CategoryPicker + ControlButtons with drag gesture
5. `MobileTopBar.svelte` — reads `session`/`catConfig`, opens BottomSheet
6. `CardDeck.svelte` — reads `deck`/`session`/`statsCache`, handles swipe, calls `mark`/`markCard`
7. `App.svelte` — top-level layout, responsive switch, done screens, empty state, gen-banner, keyboard handlers

**Stores introduced by this phase:**
- Add to `src/stores/ui.ts` — a group-collapse state store used by both Sidebar and BottomSheet. See Task 4.0.

### Task 4.0: Add UI state store

**Files:**
- Create: `src/stores/ui.ts`

- [ ] **Step 1: Write ui.ts**

```ts
// src/stores/ui.ts
import { writable } from 'svelte/store';

// Keyed by "side-<GroupName>" or "mob-<GroupName>". Maps to collapsed bool.
// Matches public/index.html:792 groupCollapseState.
// Default behavior: groups start collapsed (collapsed !== false).
export const groupCollapseState = writable<Record<string, boolean>>({});

// bottom sheet open state (only relevant on mobile viewport)
export const sheetOpen = writable<boolean>(false);
```

### Task 4.1: Port CategoryPicker

**Files:**
- Create: `src/lib/CategoryPicker.svelte`

**Purpose:** Renders the "Selected" chip row + grouped category filter buttons. Used by both Sidebar (desktop) and BottomSheet (mobile). Accepts a `prefix` prop to key its group-collapse state separately from the other instance.

**Source reference:** `public/index.html:766-807` (`renderSelectedChips`, `renderCatGroups`).

- [ ] **Step 1: Write CategoryPicker.svelte**

```svelte
<script lang="ts">
  import { allCards, catConfig } from '../stores/cards';
  import { session } from '../stores/session';
  import { toggleCat } from '../stores/session';
  import { groupCollapseState } from '../stores/ui';
  import type { Card } from '../types';

  export let prefix: 'side-' | 'mob-';

  // Reactive: compute groups from catConfig + activeCats + allCards
  $: activeCats = new Set($session.activeCats);
  $: groups = buildGroups($catConfig, $allCards, activeCats);

  function buildGroups(
    cfg: typeof $catConfig,
    cards: Card[],
    active: Set<string>,
  ) {
    const out: Record<string, Array<{ key: string; label: string; count: number; active: boolean }>> = {};
    for (const [key, val] of Object.entries(cfg)) {
      const group = val.group || 'Topics';
      if (!out[group]) out[group] = [];
      const count = cards.filter((c) => c.cat === key).length;
      out[group].push({ key, label: val.label, count, active: active.has(key) });
    }
    return out;
  }

  function toggleGroup(stateKey: string) {
    groupCollapseState.update((s) => ({
      ...s,
      [stateKey]: s[stateKey] === false ? true : false,
    }));
  }

  function onFilterClick(catKey: string) {
    toggleCat(catKey, $allCards);
  }

  function onChipClick(catKey: string) {
    toggleCat(catKey, $allCards);
  }

  $: selectedChips = $session.activeCats
    .map((key) => ({ key, cc: $catConfig[key] }))
    .filter((x) => x.cc);
</script>

{#if selectedChips.length > 0}
  <div class="selected-section">
    <div class="selected-label">Selected</div>
    <div class="selected-chips">
      {#each selectedChips as { key, cc } (key)}
        <button class="chip" on:click={() => onChipClick(key)}>
          {cc.label} <span class="chip-x">✕</span>
        </button>
      {/each}
    </div>
  </div>
{/if}

{#each Object.entries(groups) as [groupName, cats] (groupName)}
  {@const stateKey = prefix + groupName}
  {@const collapsed = $groupCollapseState[stateKey] !== false}
  <div class="cat-group">
    <div
      class="cat-group-header {collapsed ? 'collapsed' : ''}"
      on:click={() => toggleGroup(stateKey)}
      on:keydown={(e) => e.key === 'Enter' && toggleGroup(stateKey)}
      role="button"
      tabindex="0"
    >
      <span>{groupName}</span>
      <span class="chevron">&#9660;</span>
    </div>
    <div class="cat-group-items {collapsed ? 'hidden' : ''}">
      {#each cats as c (c.key)}
        <button
          class="filter-btn {c.active ? 'active' : ''}"
          data-testid="category-filter"
          data-category-key={c.key}
          on:click={() => onFilterClick(c.key)}
        >
          {c.label} ({c.count})
        </button>
      {/each}
    </div>
  </div>
{/each}
```

- [ ] **Step 2: Type-check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/CategoryPicker.svelte src/stores/ui.ts
git commit -m "feat: add CategoryPicker component + UI state store"
```

### Task 4.2: Port ControlButtons

**Files:**
- Create: `src/lib/ControlButtons.svelte`

**Purpose:** Mode toggle + Shuffle + Reset Stats + Reseed + Generate buttons. Used in both Sidebar (stacked) and BottomSheet (row). The layout is controlled by parent CSS (`.sidebar-controls` vs `.bottom-sheet-controls`), so this component renders the same buttons regardless.

**Source reference:** `public/index.html:1081-1085` and `:1191-1195` (the button blocks in sidebar-controls and bottom-sheet-controls).

- [ ] **Step 1: Write ControlButtons.svelte**

```svelte
<script lang="ts">
  import { session, toggleMode, shuffleRemaining, startDeck, deleteSession } from '../stores/session';
  import { allCards, hydrateCards } from '../stores/cards';
  import { resetStats } from '../stores/stats';
  import { isGenerating, generatedMode, generate } from '../stores/generated';
  import { snapshotDeck, applyGeneratedDeck } from '../stores/session';
  import { get } from 'svelte/store';

  async function onResetStats() {
    await resetStats();
    await deleteSession();
    startDeck(get(allCards));
  }

  async function onReseed() {
    await fetch('/api/reseed', { method: 'POST' });
    await hydrateCards();
    session.update((s) => ({ ...s, activeCats: [] }));
    startDeck(get(allCards));
  }

  async function onGenerate() {
    const err = await generate(
      get(session).activeCats,
      snapshotDeck,
      applyGeneratedDeck,
    );
    if (err) alert(err);
  }
</script>

<button class="ctrl-btn" data-testid="mode-toggle" on:click={toggleMode}>
  {$session.mode === 'pt-to-en' ? 'PT → EN' : 'EN → PT'}
</button>
<button class="ctrl-btn" on:click={() => shuffleRemaining($allCards)}>Shuffle</button>
<button class="ctrl-btn" on:click={onResetStats}>Reset Stats</button>
<button class="ctrl-btn" on:click={onReseed}>Reseed</button>
<button
  class="ctrl-btn gen-btn"
  on:click={onGenerate}
  disabled={$isGenerating || $generatedMode}
>
  {$isGenerating ? '⏳ Generating…' : '✨ Generate'}
</button>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/ControlButtons.svelte
git commit -m "feat: add ControlButtons component (mode/shuffle/reset/reseed/generate)"
```

### Task 4.3: Port Sidebar

**Files:**
- Create: `src/lib/Sidebar.svelte`

**Purpose:** Desktop sidebar. Header + scrollable CategoryPicker + ControlButtons at bottom.

**Source reference:** `public/index.html:1183-1197` (the `.sidebar` → `.sidebar-scroll` → `.sidebar-controls` block).

- [ ] **Step 1: Write Sidebar.svelte**

```svelte
<script lang="ts">
  import CategoryPicker from './CategoryPicker.svelte';
  import ControlButtons from './ControlButtons.svelte';
</script>

<div class="sidebar">
  <div class="sidebar-scroll">
    <div class="header">
      <h1>🇧🇷 Português Aula</h1>
    </div>
    <CategoryPicker prefix="side-" />
  </div>
  <div class="sidebar-controls">
    <ControlButtons />
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/Sidebar.svelte
git commit -m "feat: add Sidebar component"
```

### Task 4.4: Port BottomSheet

**Files:**
- Create: `src/lib/BottomSheet.svelte`

**Purpose:** Mobile bottom sheet with drag-to-close. Same content as Sidebar but different layout.

**Source reference:** `public/index.html:839-871` (drag gesture) + `:1074-1088` (markup).

**Important:** The `#bottomSheet`, `#sheetBackdrop`, `#sheetHandle` DOM IDs are referenced by Playwright tests and must be preserved. The `.open` class controls visibility.

- [ ] **Step 1: Write BottomSheet.svelte**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import CategoryPicker from './CategoryPicker.svelte';
  import ControlButtons from './ControlButtons.svelte';
  import { sheetOpen } from '../stores/ui';

  let sheetEl: HTMLDivElement;
  let backdropEl: HTMLDivElement;

  function open() {
    sheetOpen.set(true);
    backdropEl.classList.add('open');
    requestAnimationFrame(() => {
      sheetEl.classList.add('open');
    });
    document.body.style.overflow = 'hidden';
  }

  function close() {
    sheetEl.classList.remove('open');
    backdropEl.style.opacity = '0';
    setTimeout(() => {
      backdropEl.classList.remove('open');
      backdropEl.style.opacity = '';
      document.body.style.overflow = '';
      sheetOpen.set(false);
    }, 300);
  }

  // Open/close imperatively in response to sheetOpen changes from outside
  // (e.g., MobileTopBar clicks).
  $: if (sheetEl && backdropEl) {
    if ($sheetOpen && !sheetEl.classList.contains('open')) {
      backdropEl.classList.add('open');
      requestAnimationFrame(() => sheetEl.classList.add('open'));
      document.body.style.overflow = 'hidden';
    }
  }

  // Drag-to-close gesture. Ported from public/index.html:839-871.
  let startY = 0;
  let currentY = 0;

  function onTouchStart(e: TouchEvent) {
    startY = e.touches[0].clientY;
    sheetEl.style.transition = 'none';
  }

  function onTouchMove(e: TouchEvent) {
    currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0) {
      sheetEl.style.transform = `translateY(${diff}px)`;
    }
  }

  function onTouchEnd() {
    sheetEl.style.transition = '';
    const diff = currentY - startY;
    if (diff > 80) {
      close();
    } else {
      sheetEl.style.transform = '';
    }
    startY = 0;
    currentY = 0;
  }
</script>

<div
  class="bottom-sheet-backdrop"
  id="sheetBackdrop"
  bind:this={backdropEl}
  on:click={close}
  on:keydown={(e) => e.key === 'Escape' && close()}
  role="button"
  tabindex="-1"
  aria-label="Close sheet"
></div>
<div class="bottom-sheet" id="bottomSheet" bind:this={sheetEl}>
  <div
    class="bottom-sheet-handle"
    id="sheetHandle"
    on:touchstart={onTouchStart}
    on:touchmove={onTouchMove}
    on:touchend={onTouchEnd}
  ></div>
  <div class="bottom-sheet-title">Categories</div>
  <div class="bottom-sheet-body" id="sheetBody">
    <CategoryPicker prefix="mob-" />
  </div>
  <div class="bottom-sheet-controls">
    <ControlButtons />
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/BottomSheet.svelte
git commit -m "feat: add BottomSheet component with drag-to-close gesture"
```

### Task 4.5: Port MobileTopBar

**Files:**
- Create: `src/lib/MobileTopBar.svelte`

**Purpose:** Mobile-only top bar showing counters + "Categories" dropdown button.

**Source reference:** `public/index.html:1054-1072`.

- [ ] **Step 1: Write MobileTopBar.svelte**

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
  <button
    class="mobile-cat-dropdown"
    data-testid="mobile-cat-dropdown"
    on:click={() => sheetOpen.set(true)}
  >
    {label} ▾
  </button>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/MobileTopBar.svelte
git commit -m "feat: add MobileTopBar component"
```

### Task 4.6: Port CardDeck

**Files:**
- Create: `src/lib/CardDeck.svelte`

**Purpose:** The active card view: progress bar + counters + flip card + answer buttons + swipe gestures + per-card stats display.

**Source reference:**
- Rendered structure: `public/index.html:1171-1240`
- Swipe gestures: `:873-932`
- Flip logic: `:1242-1246`
- mark(): `:1248-1264`

**Important:** `#theCard`, `#cardContainer`, `flipped` class, `card-word` class, and all data-testids are Playwright contract.

- [ ] **Step 1: Write CardDeck.svelte**

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { session, deck, mark as sessionMark } from '../stores/session';
  import { catConfig } from '../stores/cards';
  import { statsCache, markCard, getCardStats } from '../stores/stats';
  import { generatedMode } from '../stores/generated';
  import type { Card } from '../types';

  let isFlipped = false;
  let cardEl: HTMLDivElement;
  let containerEl: HTMLDivElement;

  // Reset flip on card change
  $: currentCard = $deck[$session.currentIndex];
  $: if (currentCard) isFlipped = false;

  $: front = $session.mode === 'pt-to-en' ? currentCard?.pt : currentCard?.en;
  $: back = $session.mode === 'pt-to-en' ? currentCard?.en : currentCard?.pt;
  $: frontLabel = $session.mode === 'pt-to-en' ? 'Português' : 'English';
  $: backLabel = $session.mode === 'pt-to-en' ? 'English' : 'Português';
  $: progressPct = $deck.length > 0 ? ($session.currentIndex / $deck.length) * 100 : 0;
  $: remaining = Math.max(0, $deck.length - $session.currentIndex);

  // Category tag: generated cards use a sentinel cat. Fallback: cat-generated / "✨ Generated".
  $: cc = currentCard
    ? $catConfig[currentCard.cat] || { cls: 'cat-generated', label: '✨ Generated', group: '' }
    : null;

  // Per-card stats display (reactively recomputed as statsCache updates).
  $: cardStats = currentCard ? getCardStats(currentCard) : { right: 0, wrong: 0 };
  $: showCardStats = cardStats.right > 0 || cardStats.wrong > 0;

  function flipCard() {
    isFlipped = !isFlipped;
  }

  async function mark(gotIt: boolean) {
    if (!currentCard) return;
    const card = currentCard;
    sessionMark(card, gotIt);
    if (!$generatedMode) {
      await markCard(card, gotIt);
    }
  }

  // Expose mark() to App.svelte for keyboard handlers.
  // (App dispatches on keydown via a custom event listener — easier alternative
  // is for App to import mark() directly from a shared helper, but since mark
  // touches component-local state cleanup, we keep it here.)

  // Swipe gestures. Ported from public/index.html:873-932.
  onMount(() => {
    if (!containerEl) return;
    let startX = 0;
    let startY = 0;
    let swiping = false;

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      swiping = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
        swiping = true;
        e.preventDefault();
        if (cardEl) {
          const rotation = dx * 0.05;
          const translateX = dx * 0.3;
          cardEl.style.transition = 'none';
          cardEl.style.transform = `translateX(${translateX}px) rotate(${rotation}deg)${isFlipped ? ' rotateY(180deg)' : ''}`;
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (swiping && Math.abs(dx) > 80) {
        if (cardEl) {
          cardEl.style.transition = 'transform 0.3s ease';
          cardEl.style.transform = `translateX(${dx > 0 ? 300 : -300}px) rotate(${dx > 0 ? 15 : -15}deg)`;
        }
        setTimeout(() => {
          if (dx > 0) mark(true);
          else mark(false);
        }, 200);
      } else {
        if (cardEl) {
          cardEl.style.transition = '';
          cardEl.style.transform = '';
        }
      }
      setTimeout(() => { swiping = false; }, 0);
    };

    const onClickCapture = (e: MouseEvent) => {
      if (swiping) {
        e.stopPropagation();
        e.preventDefault();
      }
    };

    containerEl.addEventListener('touchstart', onTouchStart, { passive: true });
    containerEl.addEventListener('touchmove', onTouchMove, { passive: false });
    containerEl.addEventListener('touchend', onTouchEnd);
    containerEl.addEventListener('click', onClickCapture, true);

    return () => {
      containerEl.removeEventListener('touchstart', onTouchStart);
      containerEl.removeEventListener('touchmove', onTouchMove);
      containerEl.removeEventListener('touchend', onTouchEnd);
      containerEl.removeEventListener('click', onClickCapture, true);
    };
  });

  // Wire up keyboard handlers (owned by App.svelte but need access to mark/flip).
  // App.svelte will dispatch via window events.
  export function handleKeydown(e: KeyboardEvent) {
    if (!currentCard) return;
    if (e.code === 'Space' || e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      e.preventDefault();
      flipCard();
    } else if (e.code === 'Enter') {
      mark(true);
    } else if (e.code === 'Backspace' || e.code === 'Delete') {
      e.preventDefault();
      mark(false);
    }
  }
</script>

<div class="progress-area">
  <div class="progress-bar">
    <div class="progress-fill" style="width:{progressPct}%"></div>
  </div>
  <div class="stats">
    <span data-testid="counter-correct">
      <span class="dot green"></span> {$session.correct}
    </span>
    <span data-testid="counter-wrong">
      <span class="dot red"></span> {$session.wrong}
    </span>
    <span data-testid="counter-remaining">
      <span class="dot gray"></span> {remaining} left
    </span>
  </div>
</div>

<div class="card-area">
  <div
    class="card-container"
    id="cardContainer"
    data-testid="card-container"
    bind:this={containerEl}
    on:click={flipCard}
    on:keydown={(e) => e.key === 'Enter' && flipCard()}
    role="button"
    tabindex="0"
  >
    <div class="card {isFlipped ? 'flipped' : ''}" id="theCard" bind:this={cardEl}>
      <div class="card-face card-front" data-testid="card-front">
        {#if cc}<span class="category-tag {cc.cls}">{cc.label}</span>{/if}
        <div class="card-label">{frontLabel}</div>
        <div class="card-word">{front}</div>
        {#if showCardStats}
          <div style="font-size:0.7rem;color:var(--text-dim);margin-top:8px">
            {cardStats.right}&#10003; {cardStats.wrong}&#10007;
          </div>
        {/if}
      </div>
      <div class="card-face card-back" data-testid="card-back">
        {#if cc}<span class="category-tag {cc.cls}">{cc.label}</span>{/if}
        <div class="card-label">{backLabel}</div>
        <div class="card-word">{back}</div>
        {#if showCardStats}
          <div style="font-size:0.7rem;color:var(--text-dim);margin-top:8px">
            {cardStats.right}&#10003; {cardStats.wrong}&#10007;
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="buttons">
    <button class="btn btn-wrong" data-testid="btn-wrong" on:click={() => mark(false)}>✗ Again</button>
    <button class="btn btn-right" data-testid="btn-right" on:click={() => mark(true)}>✓ Got it</button>
  </div>
  <div class="keyboard-hint">Space/←/→ = flip · Enter = got it · Delete = again</div>
</div>
```

- [ ] **Step 2: Type-check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/CardDeck.svelte
git commit -m "feat: add CardDeck component with flip + swipe + per-card stats"
```

### Task 4.7: Wire full App.svelte with layout, done screens, gen-banner, keyboard

**Files:**
- Modify: `src/App.svelte`

**Purpose:** Replace the Phase 2 smoke-test App with the full layout. Add done screens, empty state, gen-banner, and keyboard handlers. The CSS block stays unchanged.

**Source references:**
- Empty state markup: `public/index.html:1101-1114`
- Round-done screen (wrong cards): `:1117-1142`
- Parabéns screen: `:1143-1165`
- Gen banner: `:1090-1096`
- Keyboard handler: `:1337-1342`

- [ ] **Step 1: Write full App.svelte script block**

Replace the existing `<script>` section of `src/App.svelte` with:

```svelte
<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import Sidebar from './lib/Sidebar.svelte';
  import BottomSheet from './lib/BottomSheet.svelte';
  import MobileTopBar from './lib/MobileTopBar.svelte';
  import CardDeck from './lib/CardDeck.svelte';

  import { allCards, hydrateCards, getDefaultActiveCats } from './stores/cards';
  import { hydrateStats } from './stores/stats';
  import { session, hydrateSession, startDeck, deck, flushSession, reviewWrongCards, wrongCardsList, mark as sessionMark } from './stores/session';
  import { markCard } from './stores/stats';
  import { generatedMode, generatedCards, exitGenerated } from './stores/generated';
  import { restoreSnapshot } from './stores/session';

  let loaded = false;
  let error: string | null = null;
  let cardDeckRef: CardDeck | undefined;

  $: isFinished = loaded && $deck.length > 0 && $session.currentIndex >= $deck.length;
  $: isEmpty = loaded && $deck.length === 0;
  $: isActive = loaded && !isEmpty && !isFinished;

  function onKeydown(e: KeyboardEvent) {
    // Delegate to CardDeck when active. Other states have no shortcuts.
    if (isActive && cardDeckRef) {
      cardDeckRef.handleKeydown(e);
    }
  }

  function onExitGenerated() {
    exitGenerated(restoreSnapshot);
  }

  onMount(async () => {
    try {
      await hydrateCards();
      await hydrateStats();
      const restored = await hydrateSession(get(allCards));
      if (!restored) {
        // First boot (or empty session): set default activeCats then startDeck.
        const active = get(session).activeCats;
        if (active.length === 0) {
          session.update((s) => ({ ...s, activeCats: getDefaultActiveCats() }));
        }
        startDeck(get(allCards));
      }
      loaded = true;
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    }

    window.addEventListener('beforeunload', flushSession);
    window.addEventListener('keydown', onKeydown);
  });

  onDestroy(() => {
    window.removeEventListener('beforeunload', flushSession);
    window.removeEventListener('keydown', onKeydown);
  });
</script>

{#if error}
  <main style="padding:40px"><p style="color:red">Error: {error}</p></main>
{:else if !loaded}
  <main style="padding:40px"><p>Loading…</p></main>
{:else}
  {#if $generatedMode}
    <div class="gen-banner">
      <span>✨ Generated Mode · {$generatedCards.length} sentences</span>
      <button on:click={onExitGenerated}>Exit</button>
    </div>
  {/if}

  <div class="layout">
    <Sidebar />
    <div class="main-content">
      <MobileTopBar />
      {#if isEmpty}
        <div class="card-area">
          <div class="done-screen animate-in">
            <div style="font-size:3rem;margin-bottom:16px">🦜</div>
            <h2>Cadê as cartas?</h2>
            <p style="margin-top:8px">Pick some topics from the sidebar<br>and let's get studying!</p>
          </div>
        </div>
      {:else if isFinished}
        <div class="card-area">
          {#if $wrongCardsList.length > 0}
            <div class="done-screen animate-in">
              <h2>Round done!</h2>
              <p>You finished {$deck.length} cards</p>
              <div class="stats" style="margin-bottom:20px; font-size:1rem;">
                <span><span class="dot green"></span> {$session.correct} correct</span>
                <span><span class="dot red"></span> {$session.wrong} wrong</span>
              </div>
              <p style="font-size:0.95rem;">
                {$wrongCardsList.length} card{$wrongCardsList.length === 1 ? '' : 's'} to review
              </p>
              <button
                class="btn btn-wrong"
                on:click={reviewWrongCards}
                style="margin:20px auto 0;"
              >Review Wrong Cards</button>
            </div>
          {:else}
            <div class="done-screen animate-in">
              <h2>Parabéns! 🎉</h2>
              <p>You got all {$deck.length} cards right!</p>
              <div class="stats" style="margin-bottom:20px; font-size:1rem;">
                <span><span class="dot green"></span> {$session.correct} correct</span>
              </div>
              <p style="font-size:0.95rem;">100% accuracy</p>
              <button
                class="btn btn-right"
                on:click={() => startDeck($allCards)}
                style="margin:20px auto 0;"
              >Study Again</button>
            </div>
          {/if}
        </div>
      {:else}
        <CardDeck bind:this={cardDeckRef} />
      {/if}
    </div>
  </div>
  <BottomSheet />
{/if}

<!-- CSS block from Phase 3 stays unchanged below -->
<style>
  /* ... all :global() CSS from Phase 3 ... */
</style>
```

**Note on the `<style>` block:** it was written in Phase 3 and must not be touched here. The snippet above only shows the new `<script>` and markup; splice into the existing App.svelte, replacing the old script and markup sections.

- [ ] **Step 2: Type-check**

```bash
npm run check
```

Expected: 0 errors. If there are errors about `cardDeckRef.handleKeydown` not being declared, verify `handleKeydown` has `export function` in `CardDeck.svelte` (Task 4.6).

- [ ] **Step 3: Manual smoke-test in dev server**

With Express running on :3005 and `npm run dev` on :5173, open http://localhost:5173 and verify:
- Desktop: sidebar visible with category groups, card visible, buttons work
- Click a category: it toggles, deck updates
- Click card: flips
- Click ✓/✗: counter updates, next card appears
- Press Space/arrows/Enter/Backspace: keyboard shortcuts work
- Shrink browser to <768px: sidebar hides, top bar appears, bottom sheet opens via dropdown button
- Finish a deck: appropriate done screen appears
- Click Generate (with at least one cat active): generated cards appear (requires ANTHROPIC_API_KEY on server)

Any failure here: fix before committing.

- [ ] **Step 4: Commit**

```bash
git add src/App.svelte
git commit -m "feat: wire full App.svelte layout with done screens + gen-banner + keyboard"
```

---

## Phase 5: Cutover

**Purpose:** Switch Express to serve `dist/` instead of `public/`, update Dockerfile, delete old `public/index.html`, update test scripts to build before running tests. After this phase, deleted state = migration complete.

**Files modified:**
- `Dockerfile`
- `server.js`
- `package.json` (test scripts)
- `.github/workflows/test.yml`

**Files deleted:**
- `public/index.html`

**Files moved:**
- `public/favicon.png` → Vite's static dir (we'll put it at repo root `public/favicon.png` — Vite treats a `public/` sibling to `index.html` as the static dir by default). Keep at the existing path.

### Task 5.1: Update Dockerfile

**Files:**
- Modify: `Dockerfile`

- [ ] **Step 1: Replace Dockerfile contents**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3005
CMD ["npm", "start"]
```

Changes from original:
- Removed `--production` from `npm ci` (we need devDeps for Vite build)
- Added `RUN npm run build` between `COPY . .` and `EXPOSE`

### Task 5.2: Update server.js to serve dist/

**Files:**
- Modify: `server.js`

- [ ] **Step 1: Edit line 15**

Change:
```js
app.use(express.static(path.join(__dirname, "public")));
```

To:
```js
app.use(express.static(path.join(__dirname, "dist")));
```

### Task 5.3: Favicon — verify Vite config

Vite's default static directory is `public/` (sibling to `index.html`). The existing `public/favicon.png` is ALREADY in the right place for Vite — it will be copied to `dist/favicon.png` during build.

However, `public/index.html` is also in that directory and will also be copied to `dist/` by Vite unless we delete it (Task 5.7). **Do not delete the old index.html yet** — do it in Task 5.7 after tests pass.

- [ ] **Step 1: Verify favicon survives build**

```bash
npm run build
ls dist/favicon.png
```

Expected: `dist/favicon.png` exists.

- [ ] **Step 2: Verify no index.html collision**

```bash
ls dist/index.html
head -5 dist/index.html
```

Expected: `dist/index.html` exists and references `/assets/...` (Vite build output), not the old inline-everything index.html. If it's the old file, Vite's `public/` copy has clobbered the Vite-generated `index.html` — this is a known Vite pitfall. To avoid: `public/index.html` MUST be deleted in Task 5.7 before production use.

Since tests will run against a fresh build, we need to confirm Vite handles this correctly. Check `dist/index.html` content: if it contains `<script type="module" src="/assets/...">`, Vite won out. If it contains `let allCards = []`, `public/index.html` won — stop and investigate (probably need to rename `public/` to something else for static assets OR delete the old index.html now).

**Workaround if needed:** delete `public/index.html` as part of THIS task if Vite's build isn't generating the correct `dist/index.html`.

### Task 5.4: Update test scripts to build before testing

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Update the `test` script**

Change:
```json
"test": "docker compose -f docker-compose.test.yml up -d --wait && playwright test; EXIT=$?; docker compose -f docker-compose.test.yml down; exit $EXIT"
```

To:
```json
"test": "npm run build && docker compose -f docker-compose.test.yml up -d --wait && playwright test; EXIT=$?; docker compose -f docker-compose.test.yml down; exit $EXIT"
```

- [ ] **Step 2: Update `test:ui` and `test:headed` similarly**

Change:
```json
"test:ui": "docker compose -f docker-compose.test.yml up -d --wait && playwright test --ui"
```

To:
```json
"test:ui": "npm run build && docker compose -f docker-compose.test.yml up -d --wait && playwright test --ui"
```

And:
```json
"test:headed": "docker compose -f docker-compose.test.yml up -d --wait && playwright test --headed"
```

To:
```json
"test:headed": "npm run build && docker compose -f docker-compose.test.yml up -d --wait && playwright test --headed"
```

### Task 5.5: Update CI workflow

**Files:**
- Modify: `.github/workflows/test.yml`

- [ ] **Step 1: Read current workflow**

```bash
cat .github/workflows/test.yml
```

- [ ] **Step 2: Add `npm run build` step**

Before the step that runs `playwright test` (or `npm test`), add:

```yaml
      - name: Build frontend
        run: npm run build
```

If the workflow uses `npm test` (which now includes build), no workflow change is needed — but verify `package-lock.json` dev deps are available. The workflow should `npm ci` (not `npm ci --production`).

If the workflow uses `npm ci --production`, change to `npm ci`.

### Task 5.6: Delete old public/index.html and run full test suite

**Files:**
- Delete: `public/index.html`

- [ ] **Step 1: Delete old frontend**

```bash
rm public/index.html
```

- [ ] **Step 2: Verify public/ now contains only favicon.png**

```bash
ls public/
```

Expected: `favicon.png` only (and possibly other assets if present).

- [ ] **Step 3: Run the full test suite**

```bash
npm test
```

This runs: `npm run build` → docker compose up → `playwright test` → docker compose down.

Expected: all tests pass. If any fail:

1. **Selector-based failures** (e.g., `.cat-group-header` not found, `#bottomSheet` not found): check the Svelte component has the exact class/ID. Do NOT update tests — update Svelte components to match.
2. **Timing failures** (element not visible, etc.): likely a missing `await` or a race. Check the hydration sequence in `App.svelte`.
3. **Gen mode test failures**: verify `document.body.classList.add('gen-mode')` is called in `generated.ts`.
4. **Default activeCats failures**: verify `getDefaultActiveCats()` runs on first boot in `App.svelte:onMount`.

Fix components iteratively until all tests pass.

- [ ] **Step 4: Type-check**

```bash
npm run check
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile server.js package.json .github/workflows/test.yml
git rm public/index.html
git commit -m "feat: cut over to Svelte frontend, serve dist/ from Express"
```

### Task 5.7: Verify production build locally

- [ ] **Step 1: Build + start + smoke-test**

```bash
npm run build
npm start
```

In another terminal/tab open http://localhost:3005.

Expected: full app loads, styled correctly, interactions work. Match-test against what was working on :5173 in Phase 4.

- [ ] **Step 2: Stop server**

Ctrl-C the server.

### Task 5.8: Optional — add manual Playwright spec for prod-like serve

Not required — existing specs already hit the production-style served `dist/` via :3006.

---

## Post-migration cleanup (optional)

- [ ] Consider moving `src/lib/cardId.ts` to share with test fixtures via a shared module (currently duplicated in `tests/fixtures/truth.js`). Out of scope for this plan.
- [ ] Consider splitting the giant `<style>` block in `App.svelte` into per-component scoped styles. Out of scope — was rejected during brainstorming for readability.
