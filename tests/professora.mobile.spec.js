const { test, expect } = require('@playwright/test');
const { resetAll, BASE } = require('./fixtures/reset');

test.describe('Professora — mobile', () => {
  test.beforeEach(async () => {
    await resetAll();
  });

  test('mobile entry icon on top bar navigates to /professora', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.getByTestId('professora-entry-mobile').click();
    await expect(page).toHaveURL(`${BASE}/professora`);
    await expect(page.getByTestId('professora-page')).toBeVisible();
  });

  test('mobile manage panel opens as a bottom sheet', async ({ page }) => {
    await page.goto(`${BASE}/professora`);

    // Manage button visible on mobile, panel inline collapsed.
    await expect(page.getByTestId('manage-sheet-toggle')).toBeVisible();

    // Click to open sheet — body becomes visible inside the sheet, not inline.
    await page.getByTestId('manage-sheet-toggle').click();
    await expect(page.getByTestId('manage-panel-body')).toBeVisible();
    await expect(page.getByTestId('professora-sheet')).toHaveClass(/open/);
  });

  test('desktop entry icon is hidden on mobile', async ({ page }) => {
    await page.goto(`${BASE}/`);
    // The mobile icon is visible.
    await expect(page.getByTestId('professora-entry-mobile')).toBeVisible();
    // The desktop icon is NOT visible (CSS display:none under the mobile breakpoint).
    await expect(page.getByTestId('professora-entry-desktop')).toBeHidden();
  });

  test('mobile sheet shows panel without duplicate "Manage categories" toggle', async ({ page }) => {
    await page.goto(`${BASE}/professora`);
    await page.getByTestId('manage-sheet-toggle').click();
    // The bottom sheet itself is open.
    await expect(page.getByTestId('professora-sheet')).toHaveClass(/open/);
    // Inside the sheet, the inner panel toggle should NOT exist.
    await expect(page.locator('[data-testid="professora-sheet"] [data-testid="manage-panel-toggle"]')).toHaveCount(0);
    // Group headers should be visible directly.
    await expect(page.locator('[data-testid="professora-sheet"] [data-testid="manage-group-toggle"]').first()).toBeVisible();
  });
});
