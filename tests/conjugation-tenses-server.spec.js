// tests/conjugation-tenses-server.spec.js
//
// Server-level validation for POST /api/generate-conjugations: reject
// requests where `tenses` is provided but resolves to an empty list
// after filtering against the server-side allowlist. These paths return
// 400 BEFORE the Claude call, so they don't need ANTHROPIC_API_KEY.
const { test, expect } = require('@playwright/test');
const { resetAll, BASE } = require('./fixtures/reset');

test.describe('POST /api/generate-conjugations — tenses validation', () => {
  test.beforeAll(async () => {
    // Reseed once. Subsequent tests don't mutate DB state — they hit
    // validation paths early.
    await resetAll();
  });

  // Pick a Verbs category so the upstream "no verb categories" check
  // doesn't short-circuit before tense validation runs.
  async function verbCatId() {
    const { categories } = await fetch(`${BASE}/api/cards`).then((r) => r.json());
    const id = Object.entries(categories).find(([, c]) => c.group === 'Verbs')?.[0];
    if (!id) throw new Error('no Verbs category in seed');
    return id;
  }

  test('empty tenses array → 400 "Pick at least one tense"', async () => {
    const activeCats = [await verbCatId()];
    const res = await fetch(`${BASE}/api/generate-conjugations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeCats, tenses: [] }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Pick at least one tense/i);
  });

  test('tenses array with only invalid values → 400 "Pick at least one tense"', async () => {
    const activeCats = [await verbCatId()];
    const res = await fetch(`${BASE}/api/generate-conjugations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeCats, tenses: ['bogus', 'also-bogus'] }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/Pick at least one tense/i);
  });
});
