// tests/done-screens.spec.js
const { test, expect } = require('@playwright/test');
const { resetAll, setActiveCategories } = require('./fixtures/reset');
const { loadTruth } = require('./fixtures/truth');

// Pick the smallest non-Topics category for fast walks.
function pickSmallestCategory(truth) {
  const counts = Object.keys(truth.categories)
    .filter(id => truth.categories[id].group !== 'Topics')
    .map(id => ({ id, count: truth.getCardsInCategories([id]).length }))
    .filter(x => x.count > 0)
    .sort((a, b) => a.count - b.count);
  return counts[0].id;
}

test.describe('Done screens', () => {
  test.beforeEach(async () => {
    await resetAll();
  });

  test('empty deck shows "Cadê as cartas?" state with no active categories', async ({ page }) => {
    // Set a session with an empty activeCats. The frontend's loadSession will
    // then find deck.length === 0 and fall into the empty-state branch.
    // NOTE: setActiveCategories with [] will make the frontend startDeck() from
    // empty cats, producing an empty deck.
    await setActiveCategories([]);
    await page.goto('/');
    await expect(page.getByText('Cadê as cartas?')).toBeVisible();
    await expect(page.getByText(/Pick some topics/)).toBeVisible();
    // Card container should not exist
    await expect(page.getByTestId('card-container')).toHaveCount(0);
  });

  test('finishing a deck with 100% correct shows "Parabéns!"', async ({ page }) => {
    const truth = await loadTruth();
    const cat = pickSmallestCategory(truth);
    await setActiveCategories([cat]);
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();

    const deckSize = truth.getCardsInCategories([cat]).length;
    for (let i = 0; i < deckSize; i++) {
      await page.getByTestId('btn-right').click();
    }

    await expect(page.getByText('Parabéns!')).toBeVisible();
    await expect(page.getByText(/100% accuracy/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Study Again' })).toBeVisible();
  });

  test('finishing a deck with wrong answers shows "Round done!" with review button', async ({ page }) => {
    const truth = await loadTruth();
    const cat = pickSmallestCategory(truth);
    await setActiveCategories([cat]);
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();

    const deckSize = truth.getCardsInCategories([cat]).length;
    // Mark first card wrong, rest correct
    await page.getByTestId('btn-wrong').click();
    for (let i = 1; i < deckSize; i++) {
      await page.getByTestId('btn-right').click();
    }

    await expect(page.getByText('Round done!')).toBeVisible();
    await expect(page.getByText(/You finished/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Review Wrong Cards' })).toBeVisible();
  });

  test('clicking "Review Wrong Cards" starts a new round with only the missed cards', async ({ page }) => {
    const truth = await loadTruth();
    const cat = pickSmallestCategory(truth);
    await setActiveCategories([cat]);
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();

    const deckSize = truth.getCardsInCategories([cat]).length;
    // Mark first 2 cards wrong, rest correct
    const wrongFronts = [];
    for (let i = 0; i < 2 && i < deckSize; i++) {
      const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
      wrongFronts.push(front);
      await page.getByTestId('btn-wrong').click();
    }
    for (let i = 2; i < deckSize; i++) {
      await page.getByTestId('btn-right').click();
    }

    await expect(page.getByRole('button', { name: 'Review Wrong Cards' })).toBeVisible();
    await page.getByRole('button', { name: 'Review Wrong Cards' }).click();

    // Now on review round — counter should show 2 remaining
    await expect(page.getByTestId('card-container')).toBeVisible();
    await expect(page.getByTestId('counter-remaining')).toContainText('2');
    await expect(page.getByTestId('counter-correct')).toContainText('0');
    await expect(page.getByTestId('counter-wrong')).toContainText('0');
  });
});
