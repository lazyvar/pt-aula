const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');
const { loadTruth } = require('./fixtures/truth');
const { waitForSessionWrite } = require('./fixtures/waits');

test.describe('Mode toggle (pt↔en)', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('default mode is pt-to-en: front is a Portuguese word from truth', async ({ page }) => {
    const truth = await loadTruth();
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    expect(truth.getCardByPt(front)).toBeTruthy();

    // And button label reflects pt-to-en
    const toggle = page.getByTestId('mode-toggle');
    const text = (await toggle.textContent())?.trim() ?? '';
    expect(text.indexOf('PT')).toBeLessThan(text.indexOf('EN'));
  });

  test('in pt-to-en mode, flipping reveals the english translation of the front', async ({ page }) => {
    const truth = await loadTruth();
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const pair = truth.getCardByPt(front);
    expect(pair).toBeTruthy();

    await page.getByTestId('card-container').click();
    const back = (await page.getByTestId('card-back').locator('.card-word').textContent())?.trim();
    expect(back).toBe(pair.en);
  });

  test('toggling to en-to-pt: front is an english word from truth, back is its portuguese', async ({ page }) => {
    const truth = await loadTruth();
    await page.getByTestId('mode-toggle').click();

    // Wait for re-render (button label flips)
    await expect(page.getByTestId('mode-toggle')).toContainText('EN → PT');

    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const pair = truth.getCardByEn(front);
    expect(pair, `front "${front}" in en-to-pt mode should be an en value in truth`).toBeTruthy();

    await page.getByTestId('card-container').click();
    const back = (await page.getByTestId('card-back').locator('.card-word').textContent())?.trim();
    expect(back).toBe(pair.pt);
  });

  test('mode does not revert after marking a card', async ({ page }) => {
    // Toggle to en-to-pt
    await page.getByTestId('mode-toggle').click();
    await expect(page.getByTestId('mode-toggle')).toContainText('EN → PT');

    // Mark the current card correct (Enter)
    await page.keyboard.press('Enter');

    // Mode should still be en-to-pt
    await expect(page.getByTestId('mode-toggle')).toContainText('EN → PT');
  });

  test('mode persists across reload', async ({ page }) => {
    await page.getByTestId('mode-toggle').click();
    await expect(page.getByTestId('mode-toggle')).toContainText('EN → PT');
    await waitForSessionWrite(page);

    await page.reload();
    await expect(page.getByTestId('card-container')).toBeVisible();
    await expect(page.getByTestId('mode-toggle')).toContainText('EN → PT');
  });
});
