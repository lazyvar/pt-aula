import type { Card, CardStat, StatsMap } from '../types';
import { getCardId } from './cardId';

const MIN_ATTEMPTS = 3;
const MIN_RECENT_WRONGS = 2;
const WINDOW_MASK = 0b11111;

export function popcount5(n: number): number {
  const x = n & WINDOW_MASK;
  return (x & 1) + ((x >> 1) & 1) + ((x >> 2) & 1) + ((x >> 3) & 1) + ((x >> 4) & 1);
}

export function isDifficult(stat: CardStat | undefined): boolean {
  if (!stat) return false;
  const attempts = stat.right + stat.wrong;
  if (attempts < MIN_ATTEMPTS) return false;
  return popcount5(stat.recent_history) >= MIN_RECENT_WRONGS;
}

export function difficultCards(
  cards: Card[],
  stats: StatsMap,
  catFilter?: Set<string>,
): Card[] {
  return cards.filter((c) => {
    if (catFilter && !catFilter.has(c.cat)) return false;
    return isDifficult(stats[getCardId(c)]);
  });
}
