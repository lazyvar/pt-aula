const { test, expect } = require('@playwright/test');
const { resetAll, BASE } = require('./fixtures/reset');

test.describe('Professora', () => {
  test.beforeEach(async () => {
    await resetAll();
  });

  test('GET /api/cards returns status on each category, defaulting to "unmarked"', async ({ request }) => {
    const res = await request.get(`${BASE}/api/cards`);
    expect(res.ok()).toBe(true);
    const body = await res.json();
    expect(body.categories).toBeTruthy();
    const ids = Object.keys(body.categories);
    expect(ids.length).toBeGreaterThan(0);
    for (const id of ids) {
      expect(body.categories[id]).toMatchObject({
        cls: expect.any(String),
        label: expect.any(String),
        group: expect.any(String),
        status: 'unmarked',
      });
    }
  });
});
