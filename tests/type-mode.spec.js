// tests/type-mode.spec.js — desktop "type to answer" mode
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');

async function readBack(page) {
  // The back face is always rendered (CSS-flipped), so we can read its
  // text without first flipping the card.
  return (await page.getByTestId('card-back').locator('.card-word').textContent())?.trim() ?? '';
}

test.describe('Type Mode (desktop)', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('toggle is visible on desktop and starts off', async ({ page }) => {
    const toggle = page.getByTestId('type-mode-toggle');
    await expect(toggle).toBeVisible();
    await expect(page.getByTestId('type-input')).toHaveCount(0);
    // The default mark buttons should still be visible.
    await expect(page.getByTestId('btn-right')).toBeVisible();
    await expect(page.getByTestId('btn-wrong')).toBeVisible();
  });

  test('turning type mode on hides ✗/✓ buttons and shows the input + Check', async ({ page }) => {
    await page.getByTestId('type-mode-toggle').click();
    await expect(page.getByTestId('type-input')).toBeVisible();
    await expect(page.getByTestId('type-check')).toBeVisible();
    await expect(page.getByTestId('btn-right')).toHaveCount(0);
    await expect(page.getByTestId('btn-wrong')).toHaveCount(0);
  });

  test('correct answer marks "got it" and advances', async ({ page }) => {
    await page.getByTestId('type-mode-toggle').click();
    const expected = await readBack(page);
    await page.getByTestId('type-input').fill(expected);
    await page.getByTestId('type-check').click();
    await expect(page.getByTestId('counter-correct')).toContainText('1');
    await expect(page.getByTestId('counter-wrong')).toContainText('0');
    // New card now shown — back text differs from previous expected.
    await expect.poll(async () => await readBack(page)).not.toBe(expected);
    // Input cleared for next card.
    await expect(page.getByTestId('type-input')).toHaveValue('');
  });

  test('wrong answer marks "again" and advances', async ({ page }) => {
    await page.getByTestId('type-mode-toggle').click();
    const expected = await readBack(page);
    await page.getByTestId('type-input').fill(expected + ' xyzzy');
    await page.getByTestId('type-check').click();
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
    await expect(page.getByTestId('counter-correct')).toContainText('0');
    await expect.poll(async () => await readBack(page)).not.toBe(expected);
  });

  test('equality is case- and diacritic-insensitive with whitespace trimmed', async ({ page }) => {
    await page.getByTestId('type-mode-toggle').click();
    const expected = await readBack(page);
    const normalized = '  ' + expected
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') + '  ';
    await page.getByTestId('type-input').fill(normalized);
    await page.getByTestId('type-check').click();
    await expect(page.getByTestId('counter-correct')).toContainText('1');
  });

  test('Enter key in the input submits the answer', async ({ page }) => {
    await page.getByTestId('type-mode-toggle').click();
    const expected = await readBack(page);
    await page.getByTestId('type-input').fill(expected);
    await page.getByTestId('type-input').press('Enter');
    await expect(page.getByTestId('counter-correct')).toContainText('1');
  });
});
