// Helpers for synchronizing tests with unawaited server writes.
// The frontend calls saveSession() fire-and-forget after UI actions
// (see public/index.html:1262, 1269). Tests that read server state
// after a UI action must wait for the PUT to settle.

async function waitForSessionWrite(page) {
  await page.waitForLoadState('networkidle');
}

module.exports = { waitForSessionWrite };
