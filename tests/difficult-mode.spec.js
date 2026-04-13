const { test, expect } = require('@playwright/test');
const { resetAll, setActiveCategories, BASE } = require('./fixtures/reset');
const { cardId } = require('./fixtures/truth');
const { waitForSessionWrite } = require('./fixtures/waits');

async function mark(id, correct) {
  const res = await fetch(`${BASE}/api/stats/${id}/mark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correct }),
  });
  if (!res.ok) throw new Error(`mark failed: ${res.status}`);
  return res.json();
}

test.describe('Difficult cards mode', () => {
  test.beforeEach(async () => { await resetAll(); });

  test('cards with <3 attempts are never difficult', async ({ page }) => {
    const { cards } = await fetch(`${BASE}/api/cards`).then(r => r.json());
    const id = cardId(cards[0].pt);

    // 2 wrong marks → still not difficult (attempts=2 < 3)
    await mark(id, false);
    await mark(id, false);

    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    const btn = page.locator('.sidebar [data-testid="difficult-btn"]');
    await expect(btn).toBeDisabled();
    await expect(btn).toContainText('Difficult (0)');
  });

  test('card with 2 wrong in last 5 and >=3 attempts is difficult', async ({ page }) => {
    const { cards } = await fetch(`${BASE}/api/cards`).then(r => r.json());
    const id = cardId(cards[0].pt);

    // R W W → attempts=3, history=0b011, popcount=2 → difficult
    await mark(id, true);
    await mark(id, false);
    await mark(id, false);

    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    const btn = page.locator('.sidebar [data-testid="difficult-btn"]');
    await expect(btn).toContainText('Difficult (1)');
    await expect(btn).toBeEnabled();
  });

  test('enough correct answers shift wrongs out of the window', async ({ page }) => {
    const { cards } = await fetch(`${BASE}/api/cards`).then(r => r.json());
    const id = cardId(cards[0].pt);

    // W W then 5 R's:
    // after W W: history=0b00011
    // R: 0b00110, R: 0b01100, R: 0b11000, R: 0b10000 (masked), R: 0b00000 → popcount=0 → not difficult
    await mark(id, false);
    await mark(id, false);
    for (let i = 0; i < 5; i++) await mark(id, true);

    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    const btn = page.locator('.sidebar [data-testid="difficult-btn"]');
    await expect(btn).toContainText('Difficult (0)');
    await expect(btn).toBeDisabled();
  });

  test('clicking Difficult rebuilds deck with only difficult cards', async ({ page }) => {
    const { cards } = await fetch(`${BASE}/api/cards`).then(r => r.json());
    const target = cards[0];
    const id = cardId(target.pt);

    // Make exactly one card difficult
    await mark(id, true);
    await mark(id, false);
    await mark(id, false);

    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    await page.locator('.sidebar [data-testid="difficult-btn"]').click();
    await waitForSessionWrite(page);

    const session = await fetch(`${BASE}/api/session`).then(r => r.json());
    expect(session.deckOrder).toHaveLength(1);
    expect(session.deckOrder[0]).toBe(target.pt);
  });

  test('hybrid fallback: if active cats have no difficult cards, pulls from all cats', async ({ page }) => {
    const { cards, categories } = await fetch(`${BASE}/api/cards`).then(r => r.json());

    const target = cards[0];
    const targetCat = target.cat;
    const id = cardId(target.pt);
    await mark(id, true);
    await mark(id, false);
    await mark(id, false);

    const otherCat = Object.keys(categories).find((c) => c !== targetCat);
    expect(otherCat).toBeTruthy();
    await setActiveCategories([otherCat]);

    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    const btn = page.locator('.sidebar [data-testid="difficult-btn"]');
    await expect(btn).toContainText('Difficult (1)');
    await btn.click();
    await waitForSessionWrite(page);

    const session = await fetch(`${BASE}/api/session`).then(r => r.json());
    expect(session.deckOrder).toEqual([target.pt]);
  });
});
