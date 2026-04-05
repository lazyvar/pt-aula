// tests/default-active-cats.spec.js
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');
const { loadTruth, BASE } = require('./fixtures/truth');
const { waitForSessionWrite } = require('./fixtures/waits');

test.describe('Default activeCats on first boot', () => {
  test.beforeEach(async () => {
    await resetAll();
  });

  test('first boot (no session) activates all non-Topics categories', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    await waitForSessionWrite(page);

    const truth = await loadTruth();
    const expected = new Set(truth.getDefaultActiveCats());

    const session = await fetch(`${BASE}/api/session`).then(r => r.json());
    expect(session).not.toBeNull();
    const actual = new Set(session.activeCats);

    expect(actual.size).toBe(expected.size);
    for (const id of expected) {
      expect(actual.has(id), `cat "${id}" should be active by default`).toBe(true);
    }
  });

  test('first-boot deck contains only cards from non-Topics categories', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();

    const truth = await loadTruth();
    const nonTopicsCats = new Set(truth.getDefaultActiveCats());

    // Walk first 20 cards, verify each is in a non-Topics category
    for (let i = 0; i < 20; i++) {
      if (await page.getByTestId('card-front').count() === 0) break;
      const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
      const card = truth.getCardByPt(front);
      expect(card, `card "${front}" should exist`).toBeTruthy();
      expect(nonTopicsCats.has(card.cat), `card "${front}" cat "${card.cat}" should be non-Topics`).toBe(true);
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
