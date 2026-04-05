const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');
const { loadTruth, cardId, BASE } = require('./fixtures/truth');
const { waitForSessionWrite } = require('./fixtures/waits');

test.describe('Stats accuracy', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('cardId helper matches slug format used by frontend (pt only)', async () => {
    // These sample transformations mirror the frontend getCardId regex.
    expect(cardId('Olá mundo')).toBe('ola-mundo');
    expect(cardId('Você está bem?')).toBe('voce-esta-bem');
    expect(cardId('   spaced   ')).toBe('spaced');
    expect(cardId('Eu não sei')).toBe('eu-nao-sei');
  });

  test('marking the current card right records under its slug id in /api/stats', async ({ page }) => {
    // Capture the visible front pt word.
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const expectedId = cardId(front);

    await page.getByTestId('btn-right').click();
    await waitForSessionWrite(page);

    const stats = await fetch(`${BASE}/api/stats`).then(r => r.json());
    expect(stats[expectedId], `stats should have entry for id "${expectedId}"`).toBeTruthy();
    expect(stats[expectedId].right).toBe(1);
    expect(stats[expectedId].wrong ?? 0).toBe(0);
  });

  test('marking the current card wrong records under its slug id in /api/stats', async ({ page }) => {
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const expectedId = cardId(front);

    await page.getByTestId('btn-wrong').click();
    await waitForSessionWrite(page);

    const stats = await fetch(`${BASE}/api/stats`).then(r => r.json());
    expect(stats[expectedId]).toBeTruthy();
    expect(stats[expectedId].wrong).toBe(1);
    expect(stats[expectedId].right ?? 0).toBe(0);
  });

  test('UI counter matches server state after several marks', async ({ page }) => {
    await page.getByTestId('btn-right').click();
    await page.getByTestId('btn-right').click();
    await page.getByTestId('btn-wrong').click();

    await expect(page.getByTestId('counter-correct')).toContainText('2');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
    await waitForSessionWrite(page);

    const stats = await fetch(`${BASE}/api/stats`).then(r => r.json());
    const totalRight = Object.values(stats).reduce((s, v) => s + (v.right || 0), 0);
    const totalWrong = Object.values(stats).reduce((s, v) => s + (v.wrong || 0), 0);
    expect(totalRight).toBe(2);
    expect(totalWrong).toBe(1);
  });

  test('stats survive a page reload', async ({ page }) => {
    await page.getByTestId('btn-right').click();
    await page.getByTestId('btn-wrong').click();
    await expect(page.getByTestId('counter-correct')).toContainText('1');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
    await waitForSessionWrite(page);

    await page.reload();
    await expect(page.getByTestId('card-container')).toBeVisible();
    await expect(page.getByTestId('counter-correct')).toContainText('1');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
  });
});
