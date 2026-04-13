// src/types.ts

export interface Card {
  pt: string;
  en: string;
  cat: string;
}

export interface CatConfig {
  cls: string;
  label: string;
  group: string;
}

export type CatConfigMap = Record<string, CatConfig>;

export interface Session {
  deckOrder: string[];       // array of pt strings
  currentIndex: number;
  correct: number;
  wrong: number;
  mode: 'pt-to-en' | 'en-to-pt';
  activeCats: string[];      // array of category ids
  wrongCards: string[];      // array of pt strings
  typeMode: boolean;
}

export interface CardStat {
  right: number;
  wrong: number;
  recent_history: number; // 5-bit ring buffer, low bit = most recent; 1 = wrong
}

export type StatsMap = Record<string, CardStat>;

export interface DeckSnapshot {
  deck: Card[];
  currentIndex: number;
  correct: number;
  wrong: number;
  wrongCards: Card[];
}

export const GENERATED_CAT = '__generated__';
