// src/stores/generated.ts
import { writable, get } from 'svelte/store';
import type { Card, DeckSnapshot } from '../types';
import { GENERATED_CAT } from '../types';

export type GenerateKind = 'sentences' | 'conjugations';

export const generatedMode = writable<boolean>(false);
export const generatingKind = writable<GenerateKind | null>(null);
export const generatedCards = writable<Card[]>([]);

// Snapshot of real deck state before entering gen mode.
// Not a Svelte store — plain module-level variable since components don't need
// to react to snapshot changes.
let savedSnapshot: DeckSnapshot | null = null;

export async function generate(
  kind: GenerateKind,
  activeCats: string[],
  takeSnapshot: () => DeckSnapshot,
  applyGenerated: (cards: Card[]) => void,
): Promise<string | null> {
  if (get(generatingKind) !== null || get(generatedMode)) return null;
  if (activeCats.length === 0) {
    return 'Select at least one category first.';
  }

  const url = kind === 'sentences' ? '/api/generate-sentences' : '/api/generate-conjugations';

  generatingKind.set(kind);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeCats }),
    });
    const data = await res.json() as { cards?: Array<{ pt: string; en: string }>; error?: string };
    if (!res.ok) return data.error || 'Generation failed';
    if (!data.cards || data.cards.length === 0) return 'No sentences were generated. Try again.';

    savedSnapshot = takeSnapshot();
    const cards: Card[] = data.cards.map((c) => ({ pt: c.pt, en: c.en, cat: GENERATED_CAT }));
    generatedCards.set(cards);
    applyGenerated(cards);
    generatedMode.set(true);
    document.body.classList.add('gen-mode');
    return null;
  } catch (err) {
    return 'Generation failed: ' + (err instanceof Error ? err.message : String(err));
  } finally {
    generatingKind.set(null);
  }
}

/**
 * Exit generated mode and restore the saved deck snapshot.
 * Caller must apply the snapshot to whatever state the real deck lives in.
 */
export function exitGenerated(applySnapshot: (snap: DeckSnapshot) => void): void {
  if (!get(generatedMode) || !savedSnapshot) return;
  applySnapshot(savedSnapshot);
  savedSnapshot = null;
  generatedMode.set(false);
  generatedCards.set([]);
  document.body.classList.remove('gen-mode');
}
