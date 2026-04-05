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
    const text = (await toggle.textContent())?.trim() ?? '';
    expect(text.indexOf('PT')).toBeLessThan(text.indexOf('EN'));
  });

  test('toggling mode swaps front/back of the card', async ({ page }) => {
    const frontBefore = await page.getByTestId('card-front').locator('.card-word').textContent();

    await page.getByTestId('mode-toggle').click();

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
