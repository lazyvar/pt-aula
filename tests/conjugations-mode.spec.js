// tests/conjugations-mode.spec.js
//
// Regression: Generated Conjugations Mode must use the classic flip +
// self-mark UI in BOTH directions. The AI SentenceGrader (introduced by
// `feat(ui): mount SentenceGrader in generated en-to-pt mode`) is scoped
// to generated-SENTENCES mode only — conjugation cards are precise forms
// (e.g. `eu andei`) where exact match + self-mark is intentional.
//
// See docs/superpowers/specs/2026-04-21-ai-graded-sentence-mode-design.md
// ("Out of scope: /api/generate-conjugations").
const { test, expect } = require('@playwright/test');
const { blockFonts, BASE } = require('./fixtures/reset');

// These tests mock both /api/generate-sentences and /api/generate-conjugations,
// so they don't care about real seed contents — they just need a clean session
// row per test. Skipping resetAll (which reseeds ~2000 rows serially) keeps
// each test sub-second.
async function resetSession() {
  const r = await fetch(`${BASE}/api/session`, { method: 'DELETE' });
  if (!r.ok) throw new Error(`delete session failed: ${r.status}`);
}

const MOCK_CONJUGATIONS = Array.from({ length: 20 }, (_, i) => ({
  pt: `eu andei ${i + 1}`,
  en: `I walked ${i + 1} (past)`,
}));

// Intercepts used across every test in this file. The grade-sentence route
// must NEVER be called from within conjugations mode; asserting that here
// is load-bearing — a 500 would make the test fail fast if it ever fires.
async function wireRoutes(page) {
  await blockFonts(page);
  await page.route('**/api/generate-conjugations', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ cards: MOCK_CONJUGATIONS }),
    });
  });
  // Fail loud if the AI grader endpoint is hit while in conjugations mode.
  await page.route('**/api/grade-sentence', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'grade-sentence must not be called in conjugations mode' }),
    });
  });
}

async function enterConjugationsMode(page) {
  await page.goto('/');
  await expect(page.getByTestId('card-container')).toBeVisible();
  await page.getByRole('button', { name: '✨ Conjugations', exact: true }).first().click();
  await expect(page.getByText(/Generated Mode/)).toBeVisible();
}

async function setDirection(page, direction) {
  const toggle = page.getByTestId('mode-toggle').first();
  if ((await toggle.getAttribute('data-mode')) !== direction) {
    await toggle.click();
  }
  await expect(toggle).toHaveAttribute('data-mode', direction);
}

test.describe('Conjugations Mode — classic flip UI in both directions', () => {
  test.beforeEach(async ({ page }) => {
    await resetSession();
    await wireRoutes(page);
  });

  test('pt-to-en: classic flashcard UI, no SentenceGrader', async ({ page }) => {
    await enterConjugationsMode(page);
    await setDirection(page, 'pt-to-en');

    await expect(page.getByTestId('card-container')).toBeVisible();
    await expect(page.getByTestId('card-front')).toBeVisible();
    await expect(page.getByTestId('btn-right')).toBeVisible();
    await expect(page.getByTestId('btn-wrong')).toBeVisible();

    // Grader must not exist.
    await expect(page.getByTestId('sentence-grader')).toHaveCount(0);
    await expect(page.getByTestId('grader-input')).toHaveCount(0);
    await expect(page.getByTestId('grader-submit')).toHaveCount(0);
  });

  // This is THE regression. Before the fix, en-to-pt in conjugations mode
  // mounted the SentenceGrader because both sentences and conjugations use
  // the GENERATED_CAT sentinel and useAIGrader only checked cat + direction.
  test('en-to-pt: classic flashcard UI, no SentenceGrader (regression)', async ({ page }) => {
    await enterConjugationsMode(page);
    await setDirection(page, 'en-to-pt');

    await expect(page.getByTestId('card-container')).toBeVisible();
    await expect(page.getByTestId('card-front')).toBeVisible();
    await expect(page.getByTestId('btn-right')).toBeVisible();
    await expect(page.getByTestId('btn-wrong')).toBeVisible();

    await expect(page.getByTestId('sentence-grader')).toHaveCount(0);
    await expect(page.getByTestId('grader-input')).toHaveCount(0);
    await expect(page.getByTestId('grader-submit')).toHaveCount(0);
  });

  test('toggling direction mid-deck never spawns the grader', async ({ page }) => {
    await enterConjugationsMode(page);
    const toggle = page.getByTestId('mode-toggle').first();

    for (let i = 0; i < 4; i++) {
      await toggle.click();
      await expect(page.getByTestId('card-container')).toBeVisible();
      await expect(page.getByTestId('sentence-grader')).toHaveCount(0);
    }
  });

  test('/api/grade-sentence is never called while in conjugations mode', async ({ page }) => {
    let graderCalled = false;
    await page.unroute('**/api/grade-sentence');
    await page.route('**/api/grade-sentence', async (route) => {
      graderCalled = true;
      await route.fulfill({ status: 500, body: 'not allowed' });
    });

    await enterConjugationsMode(page);

    // Walk a few cards in en-to-pt, the direction that previously triggered the bug.
    await setDirection(page, 'en-to-pt');
    await page.getByTestId('btn-right').click();
    await page.getByTestId('btn-wrong').click();
    await page.getByTestId('btn-right').click();

    await setDirection(page, 'pt-to-en');
    await page.getByTestId('btn-right').click();

    await page.waitForTimeout(200);
    expect(graderCalled).toBe(false);
  });

  test('flip and keyboard shortcuts work in en-to-pt (Enter = right, Delete = wrong, Space = flip)', async ({ page }) => {
    await enterConjugationsMode(page);
    await setDirection(page, 'en-to-pt');

    // Space flips the card.
    await page.keyboard.press('Space');
    await expect(page.locator('#theCard.flipped')).toBeVisible();

    // Enter marks right → correct counter increments.
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('counter-correct')).toContainText('1');
    await expect(page.getByTestId('counter-wrong')).toContainText('0');

    // Delete marks wrong.
    await page.keyboard.press('Delete');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
  });

  test('btn-right / btn-wrong advance the deck in en-to-pt', async ({ page }) => {
    await enterConjugationsMode(page);
    await setDirection(page, 'en-to-pt');

    const remainingLocator = page.getByTestId('counter-remaining');
    await expect(remainingLocator).toContainText('20');

    await page.getByTestId('btn-right').click();
    await expect(remainingLocator).toContainText('19');
    await expect(page.getByTestId('counter-correct')).toContainText('1');

    await page.getByTestId('btn-wrong').click();
    await expect(remainingLocator).toContainText('18');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
  });

  test('banner says "N verbs" (not "sentences") in conjugations mode', async ({ page }) => {
    await enterConjugationsMode(page);
    const banner = page.getByTestId('gen-banner-label');
    await expect(banner).toContainText('20 verbs');
    await expect(banner).not.toContainText('sentences');
  });

  test('conjugation cards show their front/back text (not a grader prompt)', async ({ page }) => {
    await enterConjugationsMode(page);
    await setDirection(page, 'en-to-pt');

    // In en-to-pt, the front should be the English side (one of our mocks).
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const mockEns = new Set(MOCK_CONJUGATIONS.map((c) => c.en));
    expect(mockEns.has(front)).toBe(true);

    // And the grader prompt testid is absent.
    await expect(page.getByTestId('grader-prompt')).toHaveCount(0);
  });
});

test.describe('Sentences vs Conjugations isolation', () => {
  // Ensure the fix hasn't accidentally broken sentences mode — the grader
  // MUST still appear for generated sentences in en-to-pt. Paired with the
  // conjugations-never-grades tests above, this pins the wiring at the
  // kind level, not just the direction or cat.
  const MOCK_SENTENCES = Array.from({ length: 20 }, (_, i) => ({
    pt: `Eu fui à loja ${i + 1}.`,
    en: `I went to the store ${i + 1}.`,
  }));

  test.beforeEach(async ({ page }) => {
    await resetSession();
    await blockFonts(page);
    await page.route('**/api/generate-sentences', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ cards: MOCK_SENTENCES }),
      });
    });
    await page.route('**/api/generate-conjugations', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ cards: MOCK_CONJUGATIONS }),
      });
    });
  });

  test('sentences mode still uses the AI grader in en-to-pt (sanity check)', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    await setDirection(page, 'en-to-pt');

    await page.getByRole('button', { name: '✨ Sentences', exact: true }).first().click();
    await expect(page.getByText(/Generated Mode/)).toBeVisible();

    await expect(page.getByTestId('sentence-grader')).toBeVisible();
    await expect(page.getByTestId('card-container')).toHaveCount(0);
  });

  test('banner label differs: "sentences" for sentences, "verbs" for conjugations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();

    // Sentences → "sentences"
    await page.getByRole('button', { name: '✨ Sentences', exact: true }).first().click();
    const sentencesBanner = page.getByTestId('gen-banner-label');
    await expect(sentencesBanner).toContainText('20 sentences');
    await expect(sentencesBanner).not.toContainText('verbs');

    // Exit, then Conjugations → "verbs"
    await page.getByRole('button', { name: 'Exit' }).click();
    await expect(page.getByText(/Generated Mode/)).not.toBeVisible();
    await page.getByRole('button', { name: '✨ Conjugations', exact: true }).first().click();
    const verbsBanner = page.getByTestId('gen-banner-label');
    await expect(verbsBanner).toContainText('20 verbs');
    await expect(verbsBanner).not.toContainText('sentences');
  });

  test('exiting sentences and entering conjugations swaps UI from grader to flip', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    await setDirection(page, 'en-to-pt');

    // Enter sentences → grader appears.
    await page.getByRole('button', { name: '✨ Sentences', exact: true }).first().click();
    await expect(page.getByTestId('sentence-grader')).toBeVisible();

    // Exit.
    await page.getByRole('button', { name: 'Exit' }).click();
    await expect(page.getByText(/Generated Mode/)).not.toBeVisible();

    // Enter conjugations → grader must NOT appear, classic UI does.
    await page.getByRole('button', { name: '✨ Conjugations', exact: true }).first().click();
    await expect(page.getByText(/Generated Mode/)).toBeVisible();
    await expect(page.getByTestId('sentence-grader')).toHaveCount(0);
    await expect(page.getByTestId('card-container')).toBeVisible();
    await expect(page.getByTestId('btn-right')).toBeVisible();
  });
});
