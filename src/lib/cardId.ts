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

/**
 * Normalize a typed answer for listen-mode grading: case-insensitive,
 * diacritic-insensitive, punctuation-insensitive, whitespace-collapsed.
 * Strictly looser than the typeMode comparator, since punctuation isn't
 * audible in the prompt.
 */
export function normalizeForListening(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}
