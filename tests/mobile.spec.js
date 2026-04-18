const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');
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

  test('all control buttons in bottom sheet are fully within viewport', async ({ page }) => {
    await page.getByTestId('mobile-cat-dropdown').click();
    const sheet = page.locator('#bottomSheet');
    await expect(sheet).toHaveClass(/open/);

    const controls = sheet.locator('.bottom-sheet-controls .ctrl-btn');
    const count = await controls.count();
    expect(count).toBeGreaterThan(0);

    const viewport = page.viewportSize();
    for (let i = 0; i < count; i++) {
      const btn = controls.nth(i);
      const label = (await btn.textContent())?.trim();
      await expect(btn, `control button "${label}" should be in viewport`).toBeInViewport({ ratio: 1 });
      const box = await btn.boundingBox();
      expect(box, `control button "${label}" should have a bounding box`).not.toBeNull();
      expect(box.x + box.width, `control button "${label}" should not overflow right edge`).toBeLessThanOrEqual(viewport.width);
    }
  });

  test('toggling a category in bottom sheet removes its cards from the deck', async ({ page }) => {
    const truth = await loadTruth();

    // Open the bottom sheet via UI.
    await page.getByTestId('mobile-cat-dropdown').click();
    const sheet = page.locator('#bottomSheet');
    await expect(sheet).toHaveClass(/open/);

    // Expand all groups inside the sheet.
    const headers = sheet.locator('.cat-group-header');
    const headerCount = await headers.count();
    for (let i = 0; i < headerCount; i++) await headers.nth(i).click();

    // Pick the first currently-active filter, capture its category key.
    const firstActive = sheet.locator('[data-testid="category-filter"].active').first();
    await expect(firstActive).toBeVisible();
    const catToRemove = await firstActive.getAttribute('data-category-key');
    const removedCardPts = new Set(truth.getCardsInCategories([catToRemove]).map(c => c.pt));
    expect(removedCardPts.size).toBeGreaterThan(0);

    // Toggle the category off.
    await firstActive.click();
    const filter = sheet.locator(`[data-testid="category-filter"][data-category-key="${catToRemove}"]`);
    await expect(filter).not.toHaveClass(/active/);
    await waitForSessionWrite(page);

    // Close sheet by tapping the backdrop's uncovered top area.
    await page.locator('#sheetBackdrop').click({ position: { x: 50, y: 40 } });
    await expect(sheet).not.toHaveClass(/open/);

    // Walk the first N cards; none should belong to the toggled-off category.
    for (let i = 0; i < 30; i++) {
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
