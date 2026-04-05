const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');
const { waitForSessionWrite } = require('./fixtures/waits');

// Runs in the "mobile" project (Pixel 7).
test.describe('Mobile UI — swipe gestures', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  // Helper: dispatch a touch swipe on an element from (x1,y1) to (x2,y2).
  async function swipe(page, selector, x1, y1, x2, y2) {
    await page.evaluate(
      ({ selector, x1, y1, x2, y2 }) => {
        const el = document.querySelector(selector);
        if (!el) throw new Error('no element: ' + selector);
        const mkTouch = (x, y) =>
          new Touch({ identifier: 1, target: el, clientX: x, clientY: y });
        const mkEvt = (type, touches, changedTouches) =>
          new TouchEvent(type, {
            bubbles: true,
            cancelable: true,
            touches,
            targetTouches: touches,
            changedTouches,
          });
        el.dispatchEvent(mkEvt('touchstart', [mkTouch(x1, y1)], [mkTouch(x1, y1)]));
        // A few intermediate moves so swiping flag flips.
        const steps = 6;
        for (let i = 1; i <= steps; i++) {
          const x = x1 + ((x2 - x1) * i) / steps;
          const y = y1 + ((y2 - y1) * i) / steps;
          el.dispatchEvent(mkEvt('touchmove', [mkTouch(x, y)], [mkTouch(x, y)]));
        }
        el.dispatchEvent(mkEvt('touchend', [], [mkTouch(x2, y2)]));
      },
      { selector, x1, y1, x2, y2 }
    );
  }

  test('swipe right advances to next card and leaves the card visible (not translated off-screen)', async ({ page }) => {
    const front1 = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    expect(front1).toBeTruthy();

    // Swipe right (got it). Start at x=80, end at x=320.
    await swipe(page, '[data-testid="card-container"]', 80, 400, 320, 400);

    // After swipe, the counter should reflect a correct mark.
    await expect(page.getByTestId('mobile-counter-correct')).toContainText('1');

    // The next card's front must be different from the first.
    await expect(async () => {
      const front2 = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
      expect(front2).not.toBe(front1);
    }).toPass({ timeout: 2000 });

    // Bug: inline transform left over from the swipe animation translates #theCard off-screen.
    // The card element should be back at its resting position (no translateX).
    const theCard = page.locator('#theCard');
    await expect(theCard).toBeVisible();
    const box = await theCard.boundingBox();
    const viewport = page.viewportSize();
    expect(box, 'card bounding box').toBeTruthy();
    expect(viewport, 'viewport').toBeTruthy();
    // Card should be within the viewport horizontally.
    expect(box.x).toBeGreaterThan(-50);
    expect(box.x + box.width).toBeLessThan(viewport.width + 50);

    // And the inline transform should be cleared (no translateX / rotate residue).
    const inlineTransform = await theCard.evaluate((el) => el.style.transform);
    expect(inlineTransform).toBe('');

    await waitForSessionWrite(page);
  });
});
