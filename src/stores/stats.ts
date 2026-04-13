// src/stores/stats.ts
import { writable, get } from 'svelte/store';
import type { Card, StatsMap, CardStat } from '../types';
import { getCardId } from '../lib/cardId';

export const statsCache = writable<StatsMap>({});

/**
 * Fetch all card stats once and populate the store.
 */
export async function hydrateStats(): Promise<void> {
  const res = await fetch('/api/stats');
  if (!res.ok) throw new Error(`GET /api/stats failed: ${res.status}`);
  const data = await res.json() as StatsMap;
  statsCache.set(data);
}

/**
 * Look up a card's current stats. Returns zeros if unseen.
 */
export function getCardStats(card: Card): CardStat {
  const id = getCardId(card);
  return get(statsCache)[id] || { right: 0, wrong: 0, recent_history: 0 };
}

/**
 * Mark a card right or wrong. POSTs to /api/stats/:id/mark and updates
 * the local store with the server's response.
 */
export async function markCard(card: Card, correct: boolean): Promise<void> {
  const id = getCardId(card);
  try {
    const res = await fetch(`/api/stats/${encodeURIComponent(id)}/mark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correct }),
    });
    if (!res.ok) throw new Error(`mark failed: ${res.status}`);
    const updated = await res.json() as CardStat;
    statsCache.update((s) => ({ ...s, [id]: updated }));
  } catch (err) {
    console.error('markCard failed', err);
  }
}

/**
 * DELETE /api/stats — clears all stats on server and locally.
 */
export async function resetStats(): Promise<void> {
  await fetch('/api/stats', { method: 'DELETE' });
  statsCache.set({});
}
