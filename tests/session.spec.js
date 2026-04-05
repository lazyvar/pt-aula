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
