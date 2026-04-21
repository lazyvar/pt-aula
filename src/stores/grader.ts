// src/stores/grader.ts
import { writable, get } from 'svelte/store';
import type { Card, GradeResponse, GraderState } from '../types';

export const graderState = writable<GraderState>('idle');
export const graderResult = writable<GradeResponse | null>(null);
export const graderInput = writable<string>('');
export const graderError = writable<string | null>(null);

/**
 * Submit the user's translation to the server for AI grading.
 * Resolves with the grade (1-3) once state transitions to 'graded'.
 * On network/parse error, state returns to 'idle' and graderError is set.
 */
export async function submit(card: Card): Promise<void> {
  if (get(graderState) !== 'idle') return;
  const userPt = get(graderInput).trim();
  if (!userPt) return;

  graderState.set('grading');
  graderError.set(null);
  try {
    const res = await fetch('/api/grade-sentence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ en: card.en, userPt, referencePt: card.pt }),
    });
    const data = await res.json() as GradeResponse | { error?: string };
    if (!res.ok || !('grade' in data)) {
      graderError.set((data as { error?: string }).error || 'Grading failed');
      graderState.set('idle');
      return;
    }
    graderResult.set(data);
    graderState.set('graded');
  } catch (err) {
    graderError.set(err instanceof Error ? err.message : String(err));
    graderState.set('idle');
  }
}

/**
 * Skip the network call: treat as a grade-1 with the reference shown.
 */
export function giveUp(): void {
  if (get(graderState) !== 'idle') return;
  graderResult.set({
    grade: 1,
    summary: 'Skipped — see the reference translation.',
    mistakes: [],
    rule: null,
  });
  graderState.set('graded');
}

/**
 * Reset to idle for the next card.
 */
export function reset(): void {
  graderState.set('idle');
  graderResult.set(null);
  graderInput.set('');
  graderError.set(null);
}
