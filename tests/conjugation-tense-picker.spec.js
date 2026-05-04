// tests/conjugation-tense-picker.spec.js
//
// Popover-based tense multi-select on the ✨ Conjugations button.
// Covers: open/close interaction, default selection, disabled-when-empty,
// request body shape (tenses field), localStorage round-trip, and that
// the existing Generated Mode flow still works after the popover step.
const { test, expect } = require('@playwright/test');
const { resetAll, blockFonts, BASE } = require('./fixtures/reset');

const MOCK_CONJUGATIONS = Array.from({ length: 20 }, (_, i) => ({
  pt: `eu andei ${i + 1}`,
  en: `I walked ${i + 1} (past)`,
}));

const ALL_TENSES = [
  'presente',
  'pretérito perfeito',
  'pretérito imperfeito',
  'futuro do pretérito',
  'presente do subjuntivo',
  'pretérito imperfeito do subjuntivo',
];

async function wireRoutes(page) {
  await blockFonts(page);
  await page.route('**/api/generate-conjugations', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ cards: MOCK_CONJUGATIONS }),
    });
  });
}

// Playwright's default `page` fixture creates a fresh browser context per
// test, so localStorage starts empty in every test without explicit
// clearing. Reloads within a single test preserve localStorage as
// expected, which the persistence test below relies on.

test.describe('Conjugation Tense Picker — popover', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
    await wireRoutes(page);
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
  });

  test('clicking ✨ Conjugations opens the popover; outside click closes it', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '✨ Conjugations', exact: true }).first();
    const popover = page.getByTestId('conjugation-tense-popover').first();

    await expect(popover).toBeHidden();
    await trigger.click();
    await expect(popover).toBeVisible();

    // Click outside (on the card area) → close.
    await page.getByTestId('card-container').click();
    await expect(popover).toBeHidden();
  });

  test('Escape closes the popover', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '✨ Conjugations', exact: true }).first();
    const popover = page.getByTestId('conjugation-tense-popover').first();

    await trigger.click();
    await expect(popover).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(popover).toBeHidden();
  });

  test('all six checkboxes are checked by default on first load', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '✨ Conjugations', exact: true }).first();
    await trigger.click();

    const popover = page.getByTestId('conjugation-tense-popover').first();
    const checkboxes = popover.getByRole('checkbox');
    await expect(checkboxes).toHaveCount(6);

    for (let i = 0; i < 6; i++) {
      await expect(checkboxes.nth(i)).toBeChecked();
    }
  });

  test('Generate button is disabled when zero tenses are selected', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '✨ Conjugations', exact: true }).first();
    await trigger.click();

    const popover = page.getByTestId('conjugation-tense-popover').first();
    const generate = popover.getByTestId('conjugation-generate');
    const checkboxes = popover.getByRole('checkbox');

    await expect(generate).toBeEnabled();

    for (let i = 0; i < 6; i++) {
      await checkboxes.nth(i).uncheck();
    }
    await expect(generate).toBeDisabled();
  });

  test('selecting a subset and clicking Generate POSTs the chosen tenses', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '✨ Conjugations', exact: true }).first();
    await trigger.click();

    const popover = page.getByTestId('conjugation-tense-popover').first();
    const checkboxes = popover.getByRole('checkbox');

    // Uncheck everything, then check just "Present" and "Imperfect subjunctive".
    for (let i = 0; i < 6; i++) await checkboxes.nth(i).uncheck();
    await checkboxes.nth(0).check(); // presente
    await checkboxes.nth(5).check(); // pretérito imperfeito do subjuntivo

    const reqPromise = page.waitForRequest('**/api/generate-conjugations');
    await popover.getByTestId('conjugation-generate').click();
    const req = await reqPromise;

    const body = JSON.parse(req.postData() || '{}');
    expect(Array.isArray(body.tenses)).toBe(true);
    expect(new Set(body.tenses)).toEqual(new Set(['presente', 'pretérito imperfeito do subjuntivo']));

    // Generated Mode kicks in normally.
    await expect(page.getByText(/Generated Mode/)).toBeVisible();
  });

  test('clicking Generate closes the popover', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '✨ Conjugations', exact: true }).first();
    await trigger.click();

    const popover = page.getByTestId('conjugation-tense-popover').first();
    await popover.getByTestId('conjugation-generate').click();

    await expect(popover).toBeHidden();
    await expect(page.getByText(/Generated Mode/)).toBeVisible();
  });

  test('localStorage persists the last selection across reloads', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '✨ Conjugations', exact: true }).first();
    await trigger.click();

    const popover = page.getByTestId('conjugation-tense-popover').first();
    const checkboxes = popover.getByRole('checkbox');
    for (let i = 0; i < 6; i++) await checkboxes.nth(i).uncheck();
    await checkboxes.nth(2).check(); // pretérito imperfeito

    // Close the popover (Escape) so we don't depend on Generate-then-network.
    await page.keyboard.press('Escape');

    // Verify localStorage was written.
    const stored = await page.evaluate(() =>
      window.localStorage.getItem('pt-aula:conjugation-tenses'),
    );
    expect(JSON.parse(stored)).toEqual(['pretérito imperfeito']);

    // Reload, reopen popover, expect the same single checkbox checked.
    await page.reload();
    await expect(page.getByTestId('card-container')).toBeVisible();
    await page.getByRole('button', { name: '✨ Conjugations', exact: true }).first().click();

    const popover2 = page.getByTestId('conjugation-tense-popover').first();
    const cbs2 = popover2.getByRole('checkbox');
    await expect(cbs2.nth(0)).not.toBeChecked();
    await expect(cbs2.nth(1)).not.toBeChecked();
    await expect(cbs2.nth(2)).toBeChecked();
    await expect(cbs2.nth(3)).not.toBeChecked();
    await expect(cbs2.nth(4)).not.toBeChecked();
    await expect(cbs2.nth(5)).not.toBeChecked();
  });

  test('Generate without tenses key (default state) sends all six', async ({ page }) => {
    const trigger = page.getByRole('button', { name: '✨ Conjugations', exact: true }).first();
    await trigger.click();

    const reqPromise = page.waitForRequest('**/api/generate-conjugations');
    await page.getByTestId('conjugation-generate').first().click();
    const req = await reqPromise;

    const body = JSON.parse(req.postData() || '{}');
    expect(new Set(body.tenses)).toEqual(new Set(ALL_TENSES));
  });
});
