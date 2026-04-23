// Resets the app to a clean, deterministic state for each test.
// Calls the server's own API endpoints so we don't need direct DB access.

const BASE = 'http://localhost:3006';

async function resetAll() {
  // 1. Reseed cards + categories from ./seeds
  const reseedRes = await fetch(`${BASE}/api/reseed`, { method: 'POST' });
  if (!reseedRes.ok) throw new Error(`reseed failed: ${reseedRes.status}`);

  // 2. Clear card stats
  const statsRes = await fetch(`${BASE}/api/stats`, { method: 'DELETE' });
  if (!statsRes.ok) throw new Error(`delete stats failed: ${statsRes.status}`);

  // 3. Delete the session row. GET /api/session then returns null, which makes
  //    the frontend fall through to startDeck() with its default activeCats
  //    (all non-Topics categories). PUT with activeCats:null would clobber
  //    that default and leave an empty deck, so we DELETE instead.
  const sessionRes = await fetch(`${BASE}/api/session`, { method: 'DELETE' });
  if (!sessionRes.ok) throw new Error(`delete session failed: ${sessionRes.status}`);
}

// Seed a session row with the given activeCats and an empty deckOrder.
// When the frontend loads this session, loadSession() sets activeCats from
// it but returns false (because deck.length === 0), which falls through to
// startDeck() — which rebuilds the deck from the new activeCats. This lets
// tests scope the deck to a small set of categories for fast walks.
async function setActiveCategories(catIds) {
  const res = await fetch(`${BASE}/api/session`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deckOrder: [],
      currentIndex: 0,
      correct: 0,
      wrong: 0,
      mode: 'pt-to-en',
      activeCats: catIds,
      wrongCards: [],
    }),
  });
  if (!res.ok) throw new Error(`setActiveCategories failed: ${res.status}`);
}

// Block the external Google Fonts <link> that index.html loads. The request
// can hang and delay the window 'load' event, which causes page.goto to
// time out. Tests don't care about fonts — abort the request so 'load'
// fires promptly. Call from a beforeEach before page.goto.
async function blockFonts(page) {
  await page.route('**/fonts.googleapis.com/**', (route) => route.abort());
  await page.route('**/fonts.gstatic.com/**', (route) => route.abort());
}

module.exports = { resetAll, setActiveCategories, blockFonts, BASE };
