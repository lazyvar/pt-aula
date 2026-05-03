const { test, expect } = require('@playwright/test');
const { resetAll, setActiveCategories, BASE } = require('./fixtures/reset');
const { waitForSessionWrite } = require('./fixtures/waits');

async function setStatus(catId, status) {
  const r = await fetch(`${BASE}/api/categories/${encodeURIComponent(catId)}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!r.ok) throw new Error(`set status ${status} for ${catId} failed: ${r.status}`);
}

test.describe('Studying button', () => {
  test.beforeEach(async () => { await resetAll(); });

  test('disabled with count 0 when no categories are marked studying', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    const btn = page.locator('.sidebar [data-testid="studying-btn"]');
    await expect(btn).toContainText('Studying (0)');
    await expect(btn).toBeDisabled();
  });

  test('count reflects only categories with status=studying (ignores complete/unmarked)', async ({ page }) => {
    const { categories } = await fetch(`${BASE}/api/cards`).then(r => r.json());
    const ids = Object.keys(categories);
    await setStatus(ids[0], 'studying');
    await setStatus(ids[1], 'studying');
    await setStatus(ids[2], 'complete');
    // ids[3+] left unmarked

    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    const btn = page.locator('.sidebar [data-testid="studying-btn"]');
    await expect(btn).toContainText('Studying (2)');
    await expect(btn).toBeEnabled();
  });

  test('clicking replaces activeCats with exactly the studying set and resets counters', async ({ page }) => {
    const { categories, cards } = await fetch(`${BASE}/api/cards`).then(r => r.json());
    const ids = Object.keys(categories);
    const studyingId = ids[0];
    const otherId = ids[1];
    await setStatus(studyingId, 'studying');

    // Pre-state: a non-studying category is active alongside the studying one.
    // Clicking should drop the non-studying cat entirely.
    await setActiveCategories([otherId, studyingId]);

    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    await page.locator('.sidebar [data-testid="studying-btn"]').click();
    await waitForSessionWrite(page);

    const session = await fetch(`${BASE}/api/session`).then(r => r.json());
    expect(session.activeCats).toEqual([studyingId]);
    expect(session.correct).toBe(0);
    expect(session.wrong).toBe(0);
    expect(session.currentIndex).toBe(0);

    const expectedPts = new Set(cards.filter(c => c.cat === studyingId).map(c => c.pt));
    expect(new Set(session.deckOrder)).toEqual(expectedPts);
  });

  test('with multiple studying categories, deck contains cards from all of them', async ({ page }) => {
    const { categories, cards } = await fetch(`${BASE}/api/cards`).then(r => r.json());
    const ids = Object.keys(categories);
    const a = ids[0], b = ids[1];
    await setStatus(a, 'studying');
    await setStatus(b, 'studying');

    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    await page.locator('.sidebar [data-testid="studying-btn"]').click();
    await waitForSessionWrite(page);

    const session = await fetch(`${BASE}/api/session`).then(r => r.json());
    expect(new Set(session.activeCats)).toEqual(new Set([a, b]));
    const expectedPts = new Set(cards.filter(c => c.cat === a || c.cat === b).map(c => c.pt));
    expect(new Set(session.deckOrder)).toEqual(expectedPts);
  });
});
