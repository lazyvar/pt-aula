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
});
