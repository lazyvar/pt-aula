// tests/keyboard.spec.js
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');
const { waitForSessionWrite } = require('./fixtures/waits');

test.describe('Keyboard shortcuts', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('Space flips the card', async ({ page }) => {
    await expect(page.locator('#theCard')).not.toHaveClass(/flipped/);
    await page.keyboard.press('Space');
    await expect(page.locator('#theCard')).toHaveClass(/flipped/);
    await page.keyboard.press('Space');
    await expect(page.locator('#theCard')).not.toHaveClass(/flipped/);
  });

  test('ArrowRight flips the card', async ({ page }) => {
    await expect(page.locator('#theCard')).not.toHaveClass(/flipped/);
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#theCard')).toHaveClass(/flipped/);
  });

  test('ArrowLeft flips the card', async ({ page }) => {
    await expect(page.locator('#theCard')).not.toHaveClass(/flipped/);
    await page.keyboard.press('ArrowLeft');
    await expect(page.locator('#theCard')).toHaveClass(/flipped/);
  });

  test('Enter marks the current card correct', async ({ page }) => {
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('counter-correct')).toContainText('1');
    await expect(page.getByTestId('counter-wrong')).toContainText('0');
  });

  test('Backspace marks the current card wrong', async ({ page }) => {
    await page.keyboard.press('Backspace');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
    await expect(page.getByTestId('counter-correct')).toContainText('0');
  });

  test('Delete marks the current card wrong', async ({ page }) => {
    await page.keyboard.press('Delete');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
  });

  test('multiple shortcuts in sequence', async ({ page }) => {
    await page.keyboard.press('Space');           // flip
    await page.keyboard.press('Enter');            // mark correct (advances card)
    await page.keyboard.press('Backspace');        // mark wrong
    await page.keyboard.press('Enter');            // mark correct
    await expect(page.getByTestId('counter-correct')).toContainText('2');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
    await waitForSessionWrite(page);
  });
});
