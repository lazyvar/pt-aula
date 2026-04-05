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
