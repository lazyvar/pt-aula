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
