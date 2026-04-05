const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');

test.describe('Category filtering', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    // Category groups are collapsed by default. Expand all sidebar groups so
    // filter buttons become visible and clickable.
    const headers = page.locator('.sidebar .cat-group-header');
    const count = await headers.count();
    for (let i = 0; i < count; i++) {
      await headers.nth(i).click();
    }
  });

  test('sidebar lists category filter buttons', async ({ page }) => {
    const filters = page.locator('.sidebar [data-testid="category-filter"]');
    const count = await filters.count();
    expect(count).toBeGreaterThan(0);
  });

  test('toggling a category off removes it from active filters', async ({ page }) => {
    // Find the first active filter button and capture its category key so the
    // locator stays stable across DOM re-renders triggered by toggleCat().
    const firstActive = page.locator('.sidebar [data-testid="category-filter"].active').first();
    await expect(firstActive).toBeVisible();
    const catKey = await firstActive.getAttribute('data-category-key');
    const stableLocator = page.locator(`.sidebar [data-testid="category-filter"][data-category-key="${catKey}"]`);

    await stableLocator.click();

    await expect(stableLocator).not.toHaveClass(/active/);
  });

  test('toggling a category back on restores active state', async ({ page }) => {
    // Use a stable locator (keyed by data-category-key) across re-renders.
    const firstActive = page.locator('.sidebar [data-testid="category-filter"].active').first();
    await expect(firstActive).toBeVisible();
    const catKey = await firstActive.getAttribute('data-category-key');
    const stableLocator = page.locator(`.sidebar [data-testid="category-filter"][data-category-key="${catKey}"]`);

    await stableLocator.click();
    await expect(stableLocator).not.toHaveClass(/active/);

    await stableLocator.click();

    await expect(stableLocator).toHaveClass(/active/);
  });
});
