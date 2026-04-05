const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');

test.describe('Marking cards', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('marking right increments the correct counter', async ({ page }) => {
    await expect(page.getByTestId('counter-correct')).toContainText('0');

    await page.getByTestId('btn-right').click();

    await expect(page.getByTestId('counter-correct')).toContainText('1');
  });

  test('marking wrong increments the wrong counter', async ({ page }) => {
    await expect(page.getByTestId('counter-wrong')).toContainText('0');

    await page.getByTestId('btn-wrong').click();

    await expect(page.getByTestId('counter-wrong')).toContainText('1');
  });

  test('stats persist across reload', async ({ page }) => {
    await page.getByTestId('btn-right').click();
    await expect(page.getByTestId('counter-correct')).toContainText('1');

    await page.getByTestId('btn-wrong').click();
    await expect(page.getByTestId('counter-wrong')).toContainText('1');

    // mark() fires saveSession() without await, so wait for the PUT to settle
    // before reloading — otherwise the session write can race the navigation.
    await page.waitForLoadState('networkidle');

    await page.reload();
    await expect(page.getByTestId('card-container')).toBeVisible();

    await expect(page.getByTestId('counter-correct')).toContainText('1');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
  });
});
