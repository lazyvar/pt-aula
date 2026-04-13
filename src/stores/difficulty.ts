import { derived } from 'svelte/store';
import { session } from './session';
import { statsCache } from './stats';
import { allCards } from './cards';
import { difficultCards } from '../lib/difficulty';

export const difficultCount = derived(
  [allCards, statsCache, session],
  ([$allCards, $stats, $session]) => {
    const active = new Set($session.activeCats);
    let n = difficultCards($allCards, $stats, active).length;
    if (n === 0) {
      n = difficultCards($allCards, $stats).length;
    }
    return n;
  },
);
