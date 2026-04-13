// src/stores/session.ts
import { writable, get } from 'svelte/store';
import type { Card, Session } from '../types';
import { generatedMode } from './generated';

const INITIAL: Session = {
  deckOrder: [],
  currentIndex: 0,
  correct: 0,
  wrong: 0,
  mode: 'pt-to-en',
  activeCats: [],
  wrongCards: [],
  typeMode: false,
};

export const session = writable<Session>(INITIAL);

// deck and wrongCards are derived from session (which holds pt strings)
// against allCards. Components compute them via derived stores. We also
// hold them as mutable stores here for actions that need to mutate directly.
export const deck = writable<Card[]>([]);
export const wrongCardsList = writable<Card[]>([]);

let hydrated = false;
let timer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 150;

// Subscribe once at module load to auto-PUT on every session mutation.
session.subscribe((s) => {
  if (!hydrated) return;
  if (get(generatedMode)) return;  // gen mode never writes session
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    fetch('/api/session', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(s),
    }).catch((err) => console.error('session PUT failed', err));
  }, DEBOUNCE_MS);
});

/**
 * Fetch /api/session.
 * - Returns true  if a session was found and deck has at least one known card.
 * - Returns false if a session was found but the deck is empty (e.g. all cats
 *   toggled off). Session stores are still populated so activeCats is preserved.
 * - Returns null  if no session row exists (first boot). Caller should apply
 *   defaults.
 *
 * Sets hydrated=true regardless (so subsequent writes trigger auto-PUT).
 */
export async function hydrateSession(allCards: Card[]): Promise<boolean | null> {
  const res = await fetch('/api/session');
  if (!res.ok) {
    hydrated = true;
    return null;
  }
  const s = await res.json() as Session | null;
  if (!s) {
    hydrated = true;
    return null;
  }

  const cardMap = new Map(allCards.map((c) => [c.pt, c]));
  const resolvedDeck = s.deckOrder.map((pt) => cardMap.get(pt)).filter(Boolean) as Card[];
  const resolvedWrong = (s.wrongCards || []).map((pt) => cardMap.get(pt)).filter(Boolean) as Card[];

  // Restore session state even if deck is empty — activeCats may be populated
  // and we want startDeck() to use them.
  session.set({
    ...s,
    typeMode: !!s.typeMode,
    // Keep the deckOrder from server so hydrated=true write-back is a no-op.
  });
  deck.set(resolvedDeck);
  wrongCardsList.set(resolvedWrong);
  hydrated = true;
  return resolvedDeck.length > 0;
}

/**
 * Flush any pending auto-PUT using sendBeacon. Called from beforeunload.
 */
export function flushSession(): void {
  if (timer) {
    clearTimeout(timer);
    timer = null;
    const body = JSON.stringify(get(session));
    navigator.sendBeacon('/api/session', body);
  }
}

/**
 * DELETE /api/session on the server.
 */
export async function deleteSession(): Promise<void> {
  await fetch('/api/session', { method: 'DELETE' });
}

// --- Fisher-Yates shuffle (ported from public/index.html:977-984) ---
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// --- Actions ---

/**
 * Reset the deck: shuffle all cards matching activeCats, reset counters.
 * Ported from public/index.html:1006-1015.
 */
export function startDeck(allCardsIn: Card[]): void {
  const active = new Set(get(session).activeCats);
  const shuffled = shuffle(allCardsIn.filter((c) => active.has(c.cat)));
  deck.set(shuffled);
  wrongCardsList.set([]);
  session.update((s) => ({
    ...s,
    deckOrder: shuffled.map((c) => c.pt),
    currentIndex: 0,
    correct: 0,
    wrong: 0,
    wrongCards: [],
  }));
}

/**
 * Shuffle remaining cards (from currentIndex onward). Ported from :1017-1025.
 */
export function shuffleRemaining(allCardsIn: Card[]): void {
  const currentDeck = get(deck);
  const s = get(session);
  const remaining = currentDeck.slice(s.currentIndex);
  if (remaining.length === 0) {
    startDeck(allCardsIn);
    return;
  }
  const shuffled = shuffle(remaining);
  const newDeck = [...currentDeck.slice(0, s.currentIndex), ...shuffled];
  deck.set(newDeck);
  session.update((ss) => ({ ...ss, deckOrder: newDeck.map((c) => c.pt) }));
}

/**
 * Review only the missed cards. Ported from :1027-1036.
 */
export function reviewWrongCards(): void {
  const wrong = get(wrongCardsList);
  const shuffled = shuffle(wrong);
  deck.set(shuffled);
  wrongCardsList.set([]);
  session.update((s) => ({
    ...s,
    deckOrder: shuffled.map((c) => c.pt),
    currentIndex: 0,
    correct: 0,
    wrong: 0,
    wrongCards: [],
  }));
}

/**
 * Toggle a category on/off. No-op if generatedMode is active.
 * Ported from :1038-1052.
 */
export function toggleCat(cat: string, allCardsIn: Card[]): void {
  if (get(generatedMode)) return;
  const s = get(session);
  const active = new Set(s.activeCats);
  const currentDeck = get(deck);
  const currentWrong = get(wrongCardsList);

  // When the active set changes we reshuffle the remaining (unseen) portion
  // of the deck. Seen cards (before currentIndex) stay put so the user's
  // progress doesn't jump around.
  if (active.has(cat)) {
    active.delete(cat);
    const filtered = currentDeck.filter((c) => c.cat !== cat);
    const newIndex = Math.min(s.currentIndex, filtered.length);
    const newDeck = [...filtered.slice(0, newIndex), ...shuffle(filtered.slice(newIndex))];
    deck.set(newDeck);
    wrongCardsList.set(currentWrong.filter((c) => c.cat !== cat));
    session.update((ss) => ({
      ...ss,
      activeCats: [...active],
      deckOrder: newDeck.map((c) => c.pt),
      wrongCards: currentWrong.filter((c) => c.cat !== cat).map((c) => c.pt),
      currentIndex: newIndex,
    }));
  } else {
    active.add(cat);
    const newCards = allCardsIn.filter((c) => c.cat === cat);
    const combined = [...currentDeck.slice(s.currentIndex), ...newCards];
    const newDeck = [...currentDeck.slice(0, s.currentIndex), ...shuffle(combined)];
    deck.set(newDeck);
    session.update((ss) => ({
      ...ss,
      activeCats: [...active],
      deckOrder: newDeck.map((c) => c.pt),
    }));
  }
}

/**
 * Toggle desktop "type to answer" mode.
 */
export function toggleTypeMode(): void {
  session.update((s) => ({ ...s, typeMode: !s.typeMode }));
}

/**
 * Toggle mode. No-op on deck, just flips mode.
 */
export function toggleMode(): void {
  session.update((s) => ({
    ...s,
    mode: s.mode === 'pt-to-en' ? 'en-to-pt' : 'pt-to-en',
  }));
}

/**
 * Mark the current card correct/wrong. Updates counters, currentIndex,
 * and wrongCards (for review). Does NOT POST stats — caller is responsible.
 * Ported from :1248-1264.
 */
export function mark(card: Card, gotIt: boolean): void {
  const currentWrong = get(wrongCardsList);
  const newWrong = gotIt ? currentWrong : [...currentWrong, card];
  wrongCardsList.set(newWrong);
  session.update((s) => ({
    ...s,
    correct: s.correct + (gotIt ? 1 : 0),
    wrong: s.wrong + (gotIt ? 0 : 1),
    wrongCards: newWrong.map((c) => c.pt),
    currentIndex: s.currentIndex + 1,
  }));
}

/**
 * Snapshot for Generated Mode entry.
 */
export function snapshotDeck(): import('../types').DeckSnapshot {
  const s = get(session);
  return {
    deck: get(deck),
    currentIndex: s.currentIndex,
    correct: s.correct,
    wrong: s.wrong,
    wrongCards: get(wrongCardsList),
  };
}

/**
 * Restore a saved snapshot. Used on exiting Generated Mode.
 */
export function restoreSnapshot(snap: import('../types').DeckSnapshot): void {
  deck.set(snap.deck);
  wrongCardsList.set(snap.wrongCards);
  session.update((s) => ({
    ...s,
    deckOrder: snap.deck.map((c) => c.pt),
    currentIndex: snap.currentIndex,
    correct: snap.correct,
    wrong: snap.wrong,
    wrongCards: snap.wrongCards.map((c) => c.pt),
  }));
}

/**
 * Apply generated cards as the current deck (bypasses session since
 * generatedMode makes auto-PUT a no-op).
 */
export function applyGeneratedDeck(cards: Card[]): void {
  deck.set(cards);
  wrongCardsList.set([]);
  // We mutate session for counter display, but auto-PUT is suppressed
  // by generatedMode in the subscribe above.
  session.update((s) => ({
    ...s,
    currentIndex: 0,
    correct: 0,
    wrong: 0,
  }));
}
