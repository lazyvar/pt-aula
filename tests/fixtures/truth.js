// Server-sourced ground truth for tests.
// Fetches /api/cards fresh on each call to reflect what the server actually serves.

const BASE = 'http://localhost:3006';

function cardId(pt) {
  return pt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function loadTruth() {
  const res = await fetch(`${BASE}/api/cards`);
  if (!res.ok) throw new Error(`GET /api/cards failed: ${res.status}`);
  const { cards, categories } = await res.json();

  const byPt = new Map();
  const byEn = new Map();
  const byCategory = new Map();
  for (const c of cards) {
    byPt.set(c.pt, c);
    byEn.set(c.en, c);
    if (!byCategory.has(c.cat)) byCategory.set(c.cat, []);
    byCategory.get(c.cat).push(c);
  }

  return {
    allCards: cards,
    categories,
    getCardByPt(pt) { return byPt.get(pt); },
    getCardByEn(en) { return byEn.get(en); },
    getCardsInCategories(catIds) {
      const set = new Set(catIds);
      return cards.filter(c => set.has(c.cat));
    },
    // Default active cats on first load (see public/index.html:1348):
    //   all non-Topics categories.
    getDefaultActiveCats() {
      return Object.keys(categories).filter(id => categories[id].group !== 'Topics');
    },
    cardId,
  };
}

module.exports = { loadTruth, cardId, BASE };
