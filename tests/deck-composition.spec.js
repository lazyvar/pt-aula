const { test, expect } = require('@playwright/test');
const { resetAll, setActiveCategories } = require('./fixtures/reset');
const { loadTruth } = require('./fixtures/truth');
const { waitForSessionWrite } = require('./fixtures/waits');

// Pick the two smallest non-Topics categories so walking the deck is fast.
// Returns [catId, ...] sorted smallest-first.
function pickSmallCategories(truth, n) {
  const counts = Object.keys(truth.categories)
    .filter(id => truth.categories[id].group !== 'Topics')
    .map(id => ({ id, count: truth.getCardsInCategories([id]).length }))
    .filter(x => x.count > 0)
    .sort((a, b) => a.count - b.count);
  return counts.slice(0, n).map(x => x.id);
}

// Walk the deck by marking each card right until the done-screen appears.
// Returns the ordered list of pt strings that were shown.
async function walkDeck(page) {
  const seen = [];
  for (let guard = 0; guard < 500; guard++) {
    if (await page.getByTestId('card-front').count() === 0) break;
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    seen.push(front);
    await page.getByTestId('btn-right').click();
    await expect(async () => {
      const count = await page.getByTestId('card-front').count();
      if (count === 0) return;
      const nextFront = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
      expect(nextFront).not.toBe(front);
    }).toPass({ timeout: 2000 });
  }
  return seen;
}

test.describe('Deck composition', () => {
  let truth;
  let activeCats;

  test.beforeEach(async ({ page }) => {
    await resetAll();
    truth = await loadTruth();
    activeCats = pickSmallCategories(truth, 2);
    await setActiveCategories(activeCats);
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('deck size equals the number of cards in active categories', async ({ page }) => {
    const expectedCount = truth.getCardsInCategories(activeCats).length;
    const initialRemaining = parseInt(
      (await page.getByTestId('counter-remaining').textContent())?.trim() ?? '0',
      10
    );
    expect(initialRemaining).toBe(expectedCount);
  });

  test('no duplicates within a single deck pass', async ({ page }) => {
    const seen = await walkDeck(page);
    const unique = new Set(seen);
    expect(unique.size).toBe(seen.length);
  });

  test('every card shown belongs to an active category', async ({ page }) => {
    const activeSet = new Set(activeCats);
    const seen = await walkDeck(page);
    for (const pt of seen) {
      const card = truth.getCardByPt(pt);
      expect(card, `card "${pt}" should exist in truth`).toBeTruthy();
      expect(activeSet.has(card.cat), `card "${pt}" cat "${card.cat}" should be in active cats`).toBe(true);
    }
  });

  test('toggling a category off removes its cards from the remaining deck', async ({ page }) => {
    // Toggle off the first of the two active cats via the UI.
    const catToRemove = activeCats[0];
    const removedCardPts = new Set(truth.getCardsInCategories([catToRemove]).map(c => c.pt));
    expect(removedCardPts.size).toBeGreaterThan(0);

    // Expand sidebar groups so the filter button is clickable.
    const headers = page.locator('.sidebar .cat-group-header');
    const headerCount = await headers.count();
    for (let i = 0; i < headerCount; i++) await headers.nth(i).click();

    const filter = page.locator(
      `.sidebar [data-testid="category-filter"][data-category-key="${catToRemove}"]`
    );
    await expect(filter).toHaveClass(/active/);
    await filter.click();
    await expect(filter).not.toHaveClass(/active/);
    await waitForSessionWrite(page);

    const seen = await walkDeck(page);
    for (const pt of seen) {
      expect(
        removedCardPts.has(pt),
        `card "${pt}" should not appear after its category was toggled off`
      ).toBe(false);
    }
  });
});
