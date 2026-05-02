const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');
const { loadTruth } = require('./fixtures/truth');
const { waitForSessionWrite } = require('./fixtures/waits');

const SILENT_MP3 = fs.readFileSync(path.join(__dirname, 'fixtures', 'silent.mp3'));

async function stubTtsOk(page) {
  await page.route('**/api/tts*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'audio/mpeg',
      body: SILENT_MP3,
    })
  );
}

async function stubTtsStatus(page, status, body) {
  await page.route('**/api/tts*', (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body || {}),
    })
  );
}

test.describe('Listening mode', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
  });

  test('mode entry persists across reload', async ({ page }) => {
    await stubTtsOk(page);
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();

    await page.getByTestId('listen-enter').click();
    await expect(page.getByTestId('listening-card')).toBeVisible();
    await waitForSessionWrite(page);

    await page.reload();
    await expect(page.getByTestId('listening-card')).toBeVisible();
    await expect(page.getByTestId('listen-exit')).toBeVisible();
  });

  test('correct typed answer reveals ✓ and advances on Enter', async ({ page }) => {
    await stubTtsOk(page);
    const truth = await loadTruth();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();

    // Read the (still-rendered) flip front to know which card we're on.
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim() ?? '';
    const card = truth.getCardByPt(front);
    expect(card, `front "${front}" should be a known PT card`).toBeTruthy();

    await page.getByTestId('listen-enter').click();
    await expect(page.getByTestId('listening-card')).toBeVisible();

    await page.getByTestId('listen-input').fill(card.pt);
    await page.getByTestId('listen-input').press('Enter');

    await expect(page.getByTestId('listen-reveal')).toBeVisible();
    await expect(page.getByTestId('listen-verdict')).toContainText('✓');

    // Press Enter again to advance.
    await page.getByTestId('listen-input').press('Enter');
    await expect(page.getByTestId('listen-reveal')).toHaveCount(0);
    await expect(page.getByTestId('counter-correct')).toContainText('1');
  });

  test('wrong typed answer reveals ✗ and increments wrong counter', async ({ page }) => {
    await stubTtsOk(page);
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    await page.getByTestId('listen-enter').click();

    await page.getByTestId('listen-input').fill('definitely not a portuguese phrase xyzzy');
    await page.getByTestId('listen-input').press('Enter');
    await expect(page.getByTestId('listen-verdict')).toContainText('✗');

    await page.getByTestId('listen-input').press('Enter');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
  });

  test('grading is case/diacritic/punctuation insensitive', async ({ page }) => {
    await stubTtsOk(page);
    const truth = await loadTruth();

    // Find a card in the default deck (non-Topics categories) whose PT contains
    // diacritics or punctuation, so it will be present in deckOrder after resetAll().
    const defaultCatIds = new Set(truth.getDefaultActiveCats());
    const card = truth.allCards.find(
      c => defaultCatIds.has(c.cat) && /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ?!.,]/.test(c.pt)
    );
    expect(card, 'expected at least one default-deck card with diacritics or punctuation').toBeTruthy();

    // Load the page first so the frontend builds and persists the session.
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    await waitForSessionWrite(page);

    // Read the live session, find where the target card is in deckOrder, and
    // rewrite currentIndex to point at it — then reload so the frontend picks
    // it up fresh. This avoids an unreliable deck-walk loop.
    await page.evaluate(async (targetPt) => {
      const session = await fetch('/api/session').then(r => r.json());
      // Normalize both sides to NFC to handle any Unicode form mismatch between
      // the seeds file and what Postgres stored/returned.
      const normTarget = targetPt.normalize('NFC');
      const idx = session.deckOrder.findIndex((pt) => pt.normalize('NFC') === normTarget);
      if (idx === -1) throw new Error(`card "${targetPt}" not found in deckOrder`);
      await fetch('/api/session', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...session, currentIndex: idx }),
      });
    }, card.pt);

    await page.reload();
    await expect(page.getByTestId('card-container')).toBeVisible();
    await page.getByTestId('listen-enter').click();
    await expect(page.getByTestId('listening-card')).toBeVisible();

    const stripped = card.pt
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[?!.,;:]/g, '')
      .trim();
    await page.getByTestId('listen-input').fill(stripped);
    await page.getByTestId('listen-input').press('Enter');
    await expect(page.getByTestId('listen-verdict')).toContainText('✓');
  });

  test('empty submit is a no-op', async ({ page }) => {
    await stubTtsOk(page);
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    await page.getByTestId('listen-enter').click();

    await expect(page.getByTestId('listen-check')).toBeDisabled();
    await page.getByTestId('listen-input').press('Enter'); // should do nothing
    await expect(page.getByTestId('listen-reveal')).toHaveCount(0);
    await expect(page.getByTestId('counter-correct')).toContainText('0');
    await expect(page.getByTestId('counter-wrong')).toContainText('0');
  });

  test('switching back to flashcards preserves deck position', async ({ page }) => {
    await stubTtsOk(page);
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();

    const beforeFront = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();

    await page.getByTestId('listen-enter').click();
    await expect(page.getByTestId('listening-card')).toBeVisible();
    await page.getByTestId('listen-exit').click();
    await expect(page.getByTestId('card-container')).toBeVisible();

    const afterFront = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    expect(afterFront).toBe(beforeFront);
  });

  test('500 from /api/tts shows missing-key banner; typing still works', async ({ page }) => {
    await stubTtsStatus(page, 500, { error: 'ELEVENLABS_API_KEY not configured on server' });
    const truth = await loadTruth();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim() ?? '';
    const card = truth.getCardByPt(front);
    expect(card).toBeTruthy();

    await page.getByTestId('listen-enter').click();
    await expect(page.getByTestId('listen-audio-banner-missing')).toBeVisible();

    await page.getByTestId('listen-input').fill(card.pt);
    await page.getByTestId('listen-input').press('Enter');
    await expect(page.getByTestId('listen-verdict')).toContainText('✓');
  });

  test('502 from /api/tts shows upstream-error banner', async ({ page }) => {
    await stubTtsStatus(page, 502, { error: 'ElevenLabs returned 401' });
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    await page.getByTestId('listen-enter').click();

    await expect(page.getByTestId('listen-audio-banner-error')).toBeVisible();
  });
});
