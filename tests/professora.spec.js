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

  test('filter chips render with Studying selected, Complete deselected by default', async ({ page }) => {
    await page.goto(`${BASE}/professora`);
    await expect(page.getByTestId('filter-status-studying')).toBeVisible();
    await expect(page.getByTestId('filter-status-complete')).toBeVisible();
    await expect(page.getByTestId('filter-status-studying')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('filter-status-complete')).toHaveAttribute('aria-pressed', 'false');
  });

  test('clicking the back link navigates to /', async ({ page }) => {
    await page.goto(`${BASE}/professora`);
    await page.getByTestId('professora-back').click();
    await expect(page).toHaveURL(`${BASE}/`);
  });

  test('manage panel: marking a category Studying persists across reload', async ({ page, request }) => {
    await page.goto(`${BASE}/professora`);
    // Open the panel.
    await page.getByTestId('manage-panel-toggle').click();
    await expect(page.getByTestId('manage-panel-body')).toBeVisible();

    // Pick the first category row and click Studying.
    const firstRow = page.getByTestId('manage-row').first();
    const catId = await firstRow.getAttribute('data-cat-id');
    expect(catId).toBeTruthy();
    await firstRow.getByTestId('pill-studying').click();

    // Verify aria-pressed flipped.
    await expect(firstRow.getByTestId('pill-studying')).toHaveAttribute('aria-pressed', 'true');
    await expect(firstRow.getByTestId('pill-unmarked')).toHaveAttribute('aria-pressed', 'false');

    // Verify server-side via API.
    const res = await request.get(`${BASE}/api/cards`);
    const cats = (await res.json()).categories;
    expect(cats[catId].status).toBe('studying');

    // Reload and verify the panel still shows Studying for that row.
    await page.reload();
    await page.getByTestId('manage-panel-toggle').click();
    const sameRow = page.locator(`[data-testid="manage-row"][data-cat-id="${catId}"]`);
    await expect(sameRow.getByTestId('pill-studying')).toHaveAttribute('aria-pressed', 'true');
  });

  test('grid shows cards from Studying categories only by default', async ({ page, request }) => {
    // Seed: mark exactly two categories — one studying, one complete.
    const res0 = await request.get(`${BASE}/api/cards`);
    const { categories, cards } = await res0.json();
    const ids = Object.keys(categories);
    const studyingId = ids[0];
    const completeId = ids[1];
    await request.put(`${BASE}/api/categories/${encodeURIComponent(studyingId)}/status`, { data: { status: 'studying' } });
    await request.put(`${BASE}/api/categories/${encodeURIComponent(completeId)}/status`, { data: { status: 'complete' } });

    const studyingPt = cards.find((c) => c.cat === studyingId).pt;
    const completePt = cards.find((c) => c.cat === completeId).pt;

    await page.goto(`${BASE}/professora`);
    // Default filter: Studying only.
    await expect(page.getByTestId('card-grid')).toBeVisible();
    await expect(page.getByTestId('card-tile').filter({ hasText: studyingPt })).toBeVisible();
    await expect(page.getByTestId('card-tile').filter({ hasText: completePt })).toHaveCount(0);

    // Click the Complete chip on; both should now be visible.
    await page.getByTestId('filter-status-complete').click();
    await expect(page.getByTestId('card-tile').filter({ hasText: completePt })).toBeVisible();
    await expect(page.getByTestId('card-tile').filter({ hasText: studyingPt })).toBeVisible();
  });
});
