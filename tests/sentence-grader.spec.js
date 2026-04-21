// tests/sentence-grader.spec.js
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');
const { BASE } = require('./fixtures/truth');

test.describe('POST /api/grade-sentence — server validation', () => {
  // Assumes the test server runs without ANTHROPIC_API_KEY set.
  // The playwright webServer config (playwright.config.js) does not set it,
  // so POSTs with valid bodies deterministically hit the env-check branch.

  test('400 when body is missing fields', async () => {
    const res = await fetch(`${BASE}/api/grade-sentence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ en: 'hi' }),  // missing userPt, referencePt
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/en|userPt|referencePt/);
  });

  test('400 when any field is not a string', async () => {
    const res = await fetch(`${BASE}/api/grade-sentence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ en: 'hi', userPt: 123, referencePt: 'ola' }),
    });
    expect(res.status).toBe(400);
  });

  test('500 when ANTHROPIC_API_KEY is not configured', async () => {
    const res = await fetch(`${BASE}/api/grade-sentence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ en: 'hi', userPt: 'oi', referencePt: 'oi' }),
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/ANTHROPIC_API_KEY/);
  });
});

// ---------------------------------------------------------------------------
// End-to-end: Sentence Grader UI
// ---------------------------------------------------------------------------

const MOCK_SENTENCES = Array.from({ length: 20 }, (_, i) => ({
  pt: `Eu fui à loja ${i + 1}.`,
  en: `I went to the store ${i + 1}.`,
}));

function gradeStub(grade, overrides = {}) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      grade,
      summary: overrides.summary ?? `Grade ${grade} summary`,
      mistakes: overrides.mistakes ?? (grade === 3 ? [] : ['Mistake A', 'Mistake B']),
      rule: overrides.rule ?? (grade === 3 ? null : 'Remember: de + a = da.'),
    }),
  };
}

async function enterGeneratedEnToPt(page) {
  await page.route('**/api/generate-sentences', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ cards: MOCK_SENTENCES }),
    });
  });
  await page.goto('/');
  await expect(page.getByTestId('card-container')).toBeVisible();

  // Flip to en→pt if not already.
  const modeToggle = page.getByTestId('mode-toggle').first();
  if ((await modeToggle.getAttribute('data-mode')) !== 'en-to-pt') {
    await modeToggle.click();
  }

  await page.getByRole('button', { name: '✨ Sentences', exact: true }).first().click();
  await expect(page.getByText(/Generated Mode/)).toBeVisible();
}

test.describe('Sentence Grader (en→pt)', () => {
  test.beforeEach(async () => {
    await resetAll();
  });

  test('grader UI renders in generated en→pt mode', async ({ page }) => {
    await enterGeneratedEnToPt(page);
    await expect(page.getByTestId('sentence-grader')).toBeVisible();
    await expect(page.getByTestId('grader-input')).toBeVisible();
    await expect(page.getByTestId('grader-submit')).toBeVisible();
    await expect(page.getByTestId('grader-giveup')).toBeVisible();
    await expect(page.getByTestId('card-container')).toHaveCount(0);
  });

  test('submitting shows grading state, then verdict', async ({ page }) => {
    let release;
    const gate = new Promise((r) => { release = r; });
    await page.route('**/api/grade-sentence', async (route) => {
      await gate;
      await route.fulfill(gradeStub(2));
    });

    await enterGeneratedEnToPt(page);
    await page.getByTestId('grader-input').fill('Eu fui no loja 1.');
    await page.getByTestId('grader-submit').click();
    await expect(page.getByTestId('grader-loading')).toBeVisible();

    release();
    await expect(page.getByTestId('grader-verdict')).toBeVisible();
    await expect(page.getByTestId('grader-grade')).toContainText('2/3');
    await expect(page.getByTestId('grader-mistakes')).toBeVisible();
    await expect(page.getByTestId('grader-rule')).toContainText('de + a');
    await expect(page.getByTestId('grader-reference')).toContainText('Eu fui à loja');
  });

  test('grade 3 and grade 2 increment correct; grade 1 increments wrong', async ({ page }) => {
    let nextGrade = 3;
    await page.route('**/api/grade-sentence', async (route) => {
      await route.fulfill(gradeStub(nextGrade));
    });

    await enterGeneratedEnToPt(page);

    nextGrade = 3;
    await page.getByTestId('grader-input').fill('x');
    await page.getByTestId('grader-submit').click();
    await expect(page.getByTestId('grader-grade')).toContainText('3/3');
    await page.getByTestId('grader-next').click();
    await expect(page.getByTestId('counter-correct')).toContainText('1');
    await expect(page.getByTestId('counter-wrong')).toContainText('0');

    nextGrade = 2;
    await page.getByTestId('grader-input').fill('x');
    await page.getByTestId('grader-submit').click();
    await expect(page.getByTestId('grader-grade')).toContainText('2/3');
    await page.getByTestId('grader-next').click();
    await expect(page.getByTestId('counter-correct')).toContainText('2');
    await expect(page.getByTestId('counter-wrong')).toContainText('0');

    nextGrade = 1;
    await page.getByTestId('grader-input').fill('x');
    await page.getByTestId('grader-submit').click();
    await expect(page.getByTestId('grader-grade')).toContainText('1/3');
    await page.getByTestId('grader-next').click();
    await expect(page.getByTestId('counter-correct')).toContainText('2');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
  });

  test('Enter key in graded state advances', async ({ page }) => {
    await page.route('**/api/grade-sentence', async (route) => {
      await route.fulfill(gradeStub(3));
    });
    await enterGeneratedEnToPt(page);
    await page.getByTestId('grader-input').fill('x');
    await page.getByTestId('grader-submit').click();
    await expect(page.getByTestId('grader-grade')).toContainText('3/3');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('counter-correct')).toContainText('1');
    await expect(page.getByTestId('grader-input')).toHaveValue('');
  });

  test('give up reveals reference, marks wrong, does not call /api/grade-sentence', async ({ page }) => {
    let graderCalled = false;
    await page.route('**/api/grade-sentence', async (route) => {
      graderCalled = true;
      await route.fulfill(gradeStub(3));
    });
    await enterGeneratedEnToPt(page);
    await page.getByTestId('grader-giveup').click();
    await expect(page.getByTestId('grader-grade')).toContainText('1/3');
    await expect(page.getByTestId('grader-reference')).toContainText('Eu fui à loja');
    expect(graderCalled).toBe(false);
    await page.getByTestId('grader-next').click();
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
  });

  test('toggling to pt→en mid-deck swaps back to flip UI; toggling back restores grader', async ({ page }) => {
    await enterGeneratedEnToPt(page);
    await expect(page.getByTestId('sentence-grader')).toBeVisible();

    await page.getByTestId('mode-toggle').first().click();
    await expect(page.getByTestId('card-container')).toBeVisible();
    await expect(page.getByTestId('sentence-grader')).toHaveCount(0);

    await page.getByTestId('mode-toggle').first().click();
    await expect(page.getByTestId('sentence-grader')).toBeVisible();
  });
});
