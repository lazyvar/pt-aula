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

    // Expand the first group so rows are visible.
    await page.getByTestId('manage-group-toggle').first().click();

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
    // Expand the first group so the row is visible again.
    await page.getByTestId('manage-group-toggle').first().click();
    const sameRow = page.locator(`[data-testid="manage-row"][data-cat-id="${catId}"]`);
    await expect(sameRow.getByTestId('pill-studying')).toHaveAttribute('aria-pressed', 'true');
  });

  test('category chips reflect the active status filter; cards appear only after a chip is picked', async ({ page, request }) => {
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
    // Default filter is Studying only — only the studying category chip is offered;
    // the complete one is hidden until its status filter is on.
    await expect(page.locator(`[data-testid="filter-cat"][data-cat-id="${studyingId}"]`)).toBeVisible();
    await expect(page.locator(`[data-testid="filter-cat"][data-cat-id="${completeId}"]`)).toHaveCount(0);

    // Nothing is selected yet, so the grid is empty.
    await expect(page.getByTestId('grid-empty-no-cat')).toBeVisible();
    await expect(page.getByTestId('card-tile')).toHaveCount(0);

    // Pick the studying chip — its cards appear; the complete card is still hidden.
    await page.locator(`[data-testid="filter-cat"][data-cat-id="${studyingId}"]`).click();
    await expect(page.getByTestId('card-tile').filter({ hasText: studyingPt })).toBeVisible();
    await expect(page.getByTestId('card-tile').filter({ hasText: completePt })).toHaveCount(0);

    // Turn Complete on — its chip becomes available; pick it; both cards visible.
    await page.getByTestId('filter-status-complete').click();
    await page.locator(`[data-testid="filter-cat"][data-cat-id="${completeId}"]`).click();
    await expect(page.getByTestId('card-tile').filter({ hasText: studyingPt })).toBeVisible();
    await expect(page.getByTestId('card-tile').filter({ hasText: completePt })).toBeVisible();
  });

  test('category multiselect: empty selection shows nothing; toggling chips narrows the grid', async ({ page, request }) => {
    const res0 = await request.get(`${BASE}/api/cards`);
    const { categories, cards } = await res0.json();
    const ids = Object.keys(categories);
    const a = ids[0], b = ids[1];
    await request.put(`${BASE}/api/categories/${encodeURIComponent(a)}/status`, { data: { status: 'studying' } });
    await request.put(`${BASE}/api/categories/${encodeURIComponent(b)}/status`, { data: { status: 'studying' } });
    const aPt = cards.find((c) => c.cat === a).pt;
    const bPt = cards.find((c) => c.cat === b).pt;

    await page.goto(`${BASE}/professora`);
    // Nothing selected → empty grid.
    await expect(page.getByTestId('grid-empty-no-cat')).toBeVisible();

    // Click chip A — only A's card visible.
    await page.locator(`[data-testid="filter-cat"][data-cat-id="${a}"]`).click();
    await expect(page.getByTestId('card-tile').filter({ hasText: aPt })).toBeVisible();
    await expect(page.getByTestId('card-tile').filter({ hasText: bPt })).toHaveCount(0);

    // Add chip B — both visible.
    await page.locator(`[data-testid="filter-cat"][data-cat-id="${b}"]`).click();
    await expect(page.getByTestId('card-tile').filter({ hasText: aPt })).toBeVisible();
    await expect(page.getByTestId('card-tile').filter({ hasText: bPt })).toBeVisible();

    // Deselect A — only B visible.
    await page.locator(`[data-testid="filter-cat"][data-cat-id="${a}"]`).click();
    await expect(page.getByTestId('card-tile').filter({ hasText: aPt })).toHaveCount(0);
    await expect(page.getByTestId('card-tile').filter({ hasText: bPt })).toBeVisible();

    // Deselect B — back to empty.
    await page.locator(`[data-testid="filter-cat"][data-cat-id="${b}"]`).click();
    await expect(page.getByTestId('grid-empty-no-cat')).toBeVisible();
  });

  test('empty state when no categories are marked', async ({ page }) => {
    await page.goto(`${BASE}/professora`);
    await expect(page.getByTestId('grid-empty-no-marked')).toBeVisible();
    await expect(page.getByTestId('card-tile')).toHaveCount(0);
  });

  test('empty state when both status filters are off', async ({ page, request }) => {
    const res0 = await request.get(`${BASE}/api/cards`);
    const id = Object.keys((await res0.json()).categories)[0];
    await request.put(`${BASE}/api/categories/${encodeURIComponent(id)}/status`, { data: { status: 'studying' } });

    await page.goto(`${BASE}/professora`);
    await page.getByTestId('filter-status-studying').click(); // turn it OFF
    await expect(page.getByTestId('grid-empty-no-filter')).toBeVisible();
  });

  test('PUT failure reverts optimistic update and shows error toast', async ({ page }) => {
    // Force every PUT /api/categories/:id/status to fail.
    await page.route('**/api/categories/*/status', (route) => {
      if (route.request().method() === 'PUT') {
        return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'boom' }) });
      }
      return route.continue();
    });

    await page.goto(`${BASE}/professora`);
    await page.getByTestId('manage-panel-toggle').click();
    // Expand the first group so rows are visible.
    await page.getByTestId('manage-group-toggle').first().click();
    const firstRow = page.getByTestId('manage-row').first();
    await firstRow.getByTestId('pill-studying').click();

    // Toast appears.
    await expect(page.getByTestId('manage-error')).toBeVisible();
    // Pill reverts to Unmarked.
    await expect(firstRow.getByTestId('pill-unmarked')).toHaveAttribute('aria-pressed', 'true');
    await expect(firstRow.getByTestId('pill-studying')).toHaveAttribute('aria-pressed', 'false');
  });

  test('card grid is reachable by scrolling when content exceeds viewport', async ({ page, request }) => {
    // Mark the category with the most cards as Studying so the grid is long.
    const res = await request.get(`${BASE}/api/cards`);
    const { cards } = await res.json();
    const counts = {};
    for (const c of cards) counts[c.cat] = (counts[c.cat] || 0) + 1;
    const fatCatId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    await request.put(`${BASE}/api/categories/${encodeURIComponent(fatCatId)}/status`, {
      data: { status: 'studying' },
    });

    await page.goto(`${BASE}/professora`);
    // Pick the fat category so the grid populates (no chip = empty grid).
    await page.locator(`[data-testid="filter-cat"][data-cat-id="${fatCatId}"]`).click();
    await expect(page.getByTestId('card-grid')).toBeVisible();

    const tiles = page.getByTestId('card-tile');
    const count = await tiles.count();
    expect(count).toBeGreaterThan(15);

    // The last tile should be scrollable into view. Without a scroll container,
    // scrollIntoViewIfNeeded is a no-op and the tile stays off-screen.
    const lastTile = tiles.nth(count - 1);
    await lastTile.scrollIntoViewIfNeeded();
    await expect(lastTile).toBeInViewport();
  });

  test('desktop entry icon navigates from / to /professora', async ({ page }) => {
    await page.goto(`${BASE}/`);
    await page.getByTestId('professora-entry-desktop').click();
    await expect(page).toHaveURL(`${BASE}/professora`);
    await expect(page.getByTestId('professora-page')).toBeVisible();
  });

  test('desktop entry icon is anchored to the viewport top-right', async ({ page }) => {
    await page.goto(`${BASE}/`);
    const icon = page.getByTestId('professora-entry-desktop');
    await expect(icon).toBeVisible();
    const viewport = page.viewportSize();
    if (!viewport) throw new Error('no viewport size');
    const box = await icon.boundingBox();
    if (!box) throw new Error('no bounding box');
    // The icon's right edge should sit within ~30px of the viewport's right edge.
    const rightEdge = box.x + box.width;
    expect(viewport.width - rightEdge).toBeLessThan(30);
    // And its top should be near the top of the viewport (within ~30px).
    expect(box.y).toBeLessThan(30);
  });

  test('manage panel body has bounded height and is internally scrollable', async ({ page }) => {
    await page.goto(`${BASE}/professora`);
    await page.getByTestId('manage-panel-toggle').click();
    const body = page.getByTestId('manage-panel-body');
    await expect(body).toBeVisible();

    // Expand ALL groups so the body is tall enough to test bounded height.
    const groupCount = await page.getByTestId('manage-group-toggle').count();
    for (let i = 0; i < groupCount; i++) {
      await page.getByTestId('manage-group-toggle').nth(i).click();
    }

    const viewport = page.viewportSize();
    if (!viewport) throw new Error('no viewport');
    const box = await body.boundingBox();
    if (!box) throw new Error('no bounding box');
    // The body must not fill more than 80% of the viewport height —
    // i.e. it has a max-height so the grid below stays reachable.
    expect(box.height).toBeLessThan(viewport.height * 0.8);

    // And the body must have overflow available to scroll into.
    const overflow = await body.evaluate((el) => ({
      scrollHeight: el.scrollHeight,
      clientHeight: el.clientHeight,
      overflowY: getComputedStyle(el).overflowY,
    }));
    expect(overflow.scrollHeight).toBeGreaterThan(overflow.clientHeight);
    expect(['auto', 'scroll']).toContain(overflow.overflowY);
  });

  test('manage panel renders groups as a card grid with counts', async ({ page }) => {
    await page.goto(`${BASE}/professora`);
    await page.getByTestId('manage-panel-toggle').click();

    const toggles = page.getByTestId('manage-group-toggle');
    const count = await toggles.count();
    expect(count).toBeGreaterThan(0);

    // Each toggle has a label and a numeric count.
    for (let i = 0; i < count; i++) {
      const text = await toggles.nth(i).textContent();
      expect(text).toMatch(/^\s*\S+.*\s+\d+\s*$/); // label + at least one digit
    }
  });

  test('manage panel groups are collapsible and default collapsed', async ({ page }) => {
    await page.goto(`${BASE}/professora`);
    await page.getByTestId('manage-panel-toggle').click();
    await expect(page.getByTestId('manage-panel-body')).toBeVisible();

    // Group headers visible; no rows visible (all collapsed).
    await expect(page.getByTestId('manage-group-toggle').first()).toBeVisible();
    await expect(page.getByTestId('manage-row')).toHaveCount(0);

    // Click first group → its rows appear.
    await page.getByTestId('manage-group-toggle').first().click();
    await expect(page.getByTestId('manage-row').first()).toBeVisible();

    // Click again → rows hide.
    await page.getByTestId('manage-group-toggle').first().click();
    await expect(page.getByTestId('manage-row')).toHaveCount(0);
  });
});
