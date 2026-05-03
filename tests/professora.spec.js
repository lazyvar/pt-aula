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

  test('PUT /api/categories/:id/status updates status and persists', async ({ request }) => {
    const res0 = await request.get(`${BASE}/api/cards`);
    const ids = Object.keys((await res0.json()).categories);
    const id = ids[0];

    const put = await request.put(`${BASE}/api/categories/${encodeURIComponent(id)}/status`, {
      data: { status: 'studying' },
    });
    expect(put.ok()).toBe(true);
    expect(await put.json()).toEqual({ ok: true });

    const res1 = await request.get(`${BASE}/api/cards`);
    const cats = (await res1.json()).categories;
    expect(cats[id].status).toBe('studying');
  });

  test('PUT rejects invalid status with 400', async ({ request }) => {
    const res0 = await request.get(`${BASE}/api/cards`);
    const id = Object.keys((await res0.json()).categories)[0];

    const put = await request.put(`${BASE}/api/categories/${encodeURIComponent(id)}/status`, {
      data: { status: 'bogus' },
    });
    expect(put.status()).toBe(400);
  });

  test('PUT returns 404 for unknown category id', async ({ request }) => {
    const put = await request.put(`${BASE}/api/categories/does-not-exist/status`, {
      data: { status: 'studying' },
    });
    expect(put.status()).toBe(404);
  });

  test('reseed preserves category status', async ({ request }) => {
    const res0 = await request.get(`${BASE}/api/cards`);
    const id = Object.keys((await res0.json()).categories)[0];

    await request.put(`${BASE}/api/categories/${encodeURIComponent(id)}/status`, {
      data: { status: 'complete' },
    });

    const reseed = await request.post(`${BASE}/api/reseed`);
    expect(reseed.ok()).toBe(true);

    const res1 = await request.get(`${BASE}/api/cards`);
    const cats = (await res1.json()).categories;
    expect(cats[id]).toBeTruthy();
    expect(cats[id].status).toBe('complete');
  });

  test('GET /professora serves the SPA shell', async ({ request }) => {
    const res = await request.get(`${BASE}/professora`);
    expect(res.ok()).toBe(true);
    const ct = res.headers()['content-type'] || '';
    expect(ct).toContain('text/html');
    const body = await res.text();
    expect(body).toContain('<div id="app">');
  });

  test('navigating to /professora renders the professora page (not the study app)', async ({ page }) => {
    await page.goto(`${BASE}/professora`);
    await expect(page.getByTestId('professora-page')).toBeVisible();
    await expect(page.getByTestId('card-container')).toHaveCount(0);
  });
});
