// src/stores/cards.ts
import { writable, get } from 'svelte/store';
import type { Card, CatConfigMap } from '../types';

export const allCards = writable<Card[]>([]);
export const catConfig = writable<CatConfigMap>({});

/**
 * Fetch /api/cards once and populate the stores.
 */
export async function hydrateCards(): Promise<void> {
  const res = await fetch('/api/cards');
  if (!res.ok) throw new Error(`GET /api/cards failed: ${res.status}`);
  const data = await res.json() as { cards: Card[]; categories: CatConfigMap };
  allCards.set(data.cards);
  catConfig.set(data.categories);
}

/**
 * Returns all category ids whose group_name is not "Topics".
 * Used as the default activeCats on first boot.
 * Matches public/index.html:1348.
 */
export function getDefaultActiveCats(): string[] {
  const cfg = get(catConfig);
  return Object.keys(cfg).filter((id) => cfg[id].group !== 'Topics');
}
