// src/lib/cardId.ts

/**
 * Slugifies a card's pt text to produce the stable ID used in card_stats.
 * This algorithm is load-bearing: if it changes, stats silently orphan.
 * Matches tests/fixtures/truth.js:cardId() exactly.
 */
export function getCardId(card: { pt: string }): string {
  return card.pt
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
