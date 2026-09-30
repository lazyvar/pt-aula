// tests/mobile-sentence-grader.spec.js
// Runs in the "mobile" Playwright project. Regression: after grading a
// sentence on a phone, long AI feedback pushed the Next button below the fold
// and the grader area wasn't scrollable, so there was no way to advance.
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');

// iPhone 17 Pro Max-ish CSS viewport.
test.use({ viewport: { width: 440, height: 956 } });

const MOCK_SENTENCES = Array.from({ length: 20 }, (_, i) => ({
  pt: `Eu fui à loja ${i + 1}.`,
  en: `I went to the store ${i + 1}.`,
}));

const LONG = 'This explanation is deliberately long so the feedback overflows the screen. '.repeat(3);

const LONG_GRADE = {
  grade: 1,
  summary: `Several problems. ${LONG}`,
  mistakes: Array.from({ length: 6 }, (_, i) => `Mistake ${i + 1}: ${LONG}`),
  warnings: [`Heads up: ${LONG}`, `Another: ${LONG}`],
  rule: `Rule text. ${LONG}`,
};

async function enterGeneratedEnToPtMobile(page) {
  await page.route('**/api/generate-sentences', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ cards: MOCK_SENTENCES }) }));
  await page.route('**/api/grade-sentence', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(LONG_GRADE) }));

  await page.goto('/');
  await expect(page.getByTestId('card-container')).toBeVisible();

  await page.getByTestId('mobile-cat-dropdown').click();
  const sheet = page.locator('#bottomSheet');
  await expect(sheet).toHaveClass(/open/);
  // The sheet's ControlButtons render without test ids; match on data-mode.
  const modeToggle = sheet.locator('button.ctrl-btn[data-mode]');
  if ((await modeToggle.getAttribute('data-mode')) !== 'en-to-pt') {
    await modeToggle.click();
    await expect(modeToggle).toHaveAttribute('data-mode', 'en-to-pt');
  }
  await sheet.getByRole('button', { name: '✨ Sentences', exact: true }).click();
  await expect(page.getByTestId('sentence-grader')).toBeVisible();
  // Close the sheet if it's still open.
  if (await sheet.evaluate((el) => el.classList.contains('open'))) {
    await page.mouse.click(220, 50);
  }
  await expect(sheet).not.toHaveClass(/open/);
}

test.describe('Mobile Sentence Grader', () => {
  test.beforeEach(async () => {
    await resetAll();
  });

  test('Next button stays on screen and feedback scrolls after a long grade', async ({ page }) => {
    await enterGeneratedEnToPtMobile(page);

    await page.getByTestId('grader-input').fill('Eu foi na loja.');
    await page.getByTestId('grader-submit').click();
    await expect(page.getByTestId('grader-grade')).toContainText('1/3');

    // Next must be visible without any scrolling (pinned to the bottom).
    const next = page.getByTestId('grader-next');
    await expect(next).toBeInViewport({ ratio: 1 });

    // The feedback region must be scrollable so the rule at the end is reachable.
    const scroller = page.getByTestId('grader-scroll');
    const { scrollHeight, clientHeight } = await scroller.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
    }));
    expect(scrollHeight).toBeGreaterThan(clientHeight);
    await scroller.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await expect(page.getByTestId('grader-rule')).toBeInViewport();

    // Next must not be covered by the feedback content — a real tap works.
    const box = await next.boundingBox();
    const hit = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      return el?.closest('[data-testid="grader-next"]') !== null;
    }, { x: box.x + box.width / 2, y: box.y + box.height / 2 });
    expect(hit).toBe(true);

    await next.tap();
    await expect(page.getByTestId('mobile-counter-wrong')).toContainText('1');
    await expect(page.getByTestId('grader-input')).toHaveValue('');
  });
});
