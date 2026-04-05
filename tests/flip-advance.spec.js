// Bug: advancing to the next card while the current card is flipped triggers
// the flip-back CSS animation (rotateY(180deg) → 0). Because card-back's
// content is reactively bound to the *new* current card, the user briefly sees
// the next card's answer as the back face rotates away.
//
// Fix: when currentCard changes while flipped, snap isFlipped to false with
// transition disabled so no rotation animation plays.

const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');

test.describe('Flip + advance', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('advancing while flipped does not play a back-flip animation', async ({ page }) => {
    // Flip the card so the back face (answer) is showing.
    await page.keyboard.press('Space');
    await expect(page.locator('#theCard')).toHaveClass(/flipped/);

    // Install a transitionstart listener on the card BEFORE advancing, then
    // click Got it. If the back-flip animation plays, transitionstart fires
    // for the transform property.
    const transformTransitionFired = await page.evaluate(async () => {
      const card = document.getElementById('theCard');
      let fired = false;
      const listener = (e) => {
        if (e.propertyName === 'transform') fired = true;
      };
      card.addEventListener('transitionstart', listener);

      document.querySelector('[data-testid="btn-right"]').click();

      // Give the browser a few frames to start any transition.
      await new Promise((r) => setTimeout(r, 100));
      card.removeEventListener('transitionstart', listener);
      return fired;
    });

    expect(transformTransitionFired).toBe(false);

    // And the new card should already be showing its front (unflipped).
    await expect(page.locator('#theCard')).not.toHaveClass(/flipped/);
  });
});
