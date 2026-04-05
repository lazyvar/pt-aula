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

module.exports = { resetAll, BASE };
