const { test, expect } = require('@playwright/test');
const { resetAll, setActiveCategories } = require('./fixtures/reset');
const { loadTruth, cardId, BASE } = require('./fixtures/truth');
const { waitForSessionWrite } = require('./fixtures/waits');

// Runs in the "mobile" Playwright project (Pixel 7 viewport).
// At <=768px the sidebar is hidden; mode toggle + category filters live
// in the bottom sheet opened via the mobile-cat-dropdown button.

test.describe('Mobile UI — core flows', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('mobile top bar shows counters and card area is visible', async ({ page }) => {
    await expect(page.getByTestId('mobile-counter-correct')).toContainText('0');
    await expect(page.getByTestId('mobile-counter-wrong')).toContainText('0');
    await expect(page.getByTestId('mobile-counter-remaining')).toContainText('left');
    await expect(page.getByTestId('card-front')).toBeVisible();
  });

  test('tapping the card flips it and reveals the correct translation', async ({ page }) => {
    const truth = await loadTruth();
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const pair = truth.getCardByPt(front);
    expect(pair).toBeTruthy();

    await page.getByTestId('card-container').click();
    await expect(page.locator('#theCard')).toHaveClass(/flipped/);
    const back = (await page.getByTestId('card-back').locator('.card-word').textContent())?.trim();
    expect(back).toBe(pair.en);
  });

  test('marking right updates mobile counter and records server stat', async ({ page }) => {
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const expectedId = cardId(front);

    await page.getByTestId('btn-right').click();

    await expect(page.getByTestId('mobile-counter-correct')).toContainText('1');
    await waitForSessionWrite(page);

    const stats = await fetch(`${BASE}/api/stats`).then(r => r.json());
    expect(stats[expectedId]?.right).toBe(1);
  });

  test('mode toggle inside bottom sheet swaps front/back direction', async ({ page }) => {
    const truth = await loadTruth();

    // Open the bottom sheet.
    await page.getByTestId('mobile-cat-dropdown').click();
    const sheet = page.locator('#bottomSheet');
    await expect(sheet).toHaveClass(/open/);

    // The mode toggle button in the sheet shows current mode label.
    const modeBtn = sheet.locator('button.ctrl-btn', { hasText: 'PT → EN' });
    await expect(modeBtn).toBeVisible();
    await modeBtn.click();

    // Close sheet by tapping the backdrop's uncovered top area. The sheet
    // has max-height: 70vh and sits at the bottom, so the top ~30% of the
    // backdrop is clickable.
    await page.locator('#sheetBackdrop').click({ position: { x: 50, y: 40 } });
    await expect(sheet).not.toHaveClass(/open/);

    // Front should now be an English word from truth.
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    const pair = truth.getCardByEn(front);
    expect(pair, `front "${front}" should be an english value in truth`).toBeTruthy();
  });

  test('toggling a category in bottom sheet removes its cards from the deck', async ({ page }) => {
    // Scope to two small non-Topics categories so the toggle-off has a
    // meaningful signal (otherwise a 1-in-1265 chance of catching the bug).
    await resetAll();
    const truth = await loadTruth();
    const smallCats = Object.keys(truth.categories)
      .filter(id => truth.categories[id].group !== 'Topics')
      .map(id => ({ id, count: truth.getCardsInCategories([id]).length }))
      .filter(x => x.count > 0)
      .sort((a, b) => a.count - b.count)
      .slice(0, 2)
      .map(x => x.id);
    await setActiveCategories(smallCats);
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();

    const catToRemove = smallCats[0];
    const removedCardPts = new Set(truth.getCardsInCategories([catToRemove]).map(c => c.pt));

    // Open the bottom sheet.
    await page.getByTestId('mobile-cat-dropdown').click();
    const sheet = page.locator('#bottomSheet');
    await expect(sheet).toHaveClass(/open/);

    // Expand all groups inside the sheet.
    const headers = sheet.locator('.cat-group-header');
    const headerCount = await headers.count();
    for (let i = 0; i < headerCount; i++) await headers.nth(i).click();

    const filter = sheet.locator(`[data-testid="category-filter"][data-category-key="${catToRemove}"]`);
    await expect(filter).toHaveClass(/active/);
    await filter.click();
    await expect(filter).not.toHaveClass(/active/);
    await waitForSessionWrite(page);

    // Close sheet and walk remaining cards; none should be from the removed cat.
    await page.evaluate(() => closeBottomSheet());
    await expect(sheet).not.toHaveClass(/open/);

    for (let i = 0; i < 20; i++) {
      if (await page.getByTestId('card-front').count() === 0) break;
      const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
      expect(
        removedCardPts.has(front),
        `card "${front}" should not appear after its category was toggled off`
      ).toBe(false);
      await page.getByTestId('btn-right').click();
      await expect(async () => {
        const count = await page.getByTestId('card-front').count();
        if (count === 0) return;
        const next = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
        expect(next).not.toBe(front);
      }).toPass({ timeout: 2000 });
    }
  });
});
