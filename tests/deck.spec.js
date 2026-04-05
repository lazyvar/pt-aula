const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');

test.describe('Deck basics', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
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

    await expect(async () => {
      const nextWord = await page.getByTestId('card-front').locator('.card-word').textContent();
      expect(nextWord).not.toBe(firstWord);
    }).toPass({ timeout: 2000 });

    const remainingAfter = await page.getByTestId('counter-remaining').textContent();
    expect(remainingAfter).not.toBe(remainingBefore);
  });
});
