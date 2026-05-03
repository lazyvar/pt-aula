import { writable } from 'svelte/store';

export interface ProfessoraFilters {
  studying: boolean;
  complete: boolean;
  // category ids the user has restricted to. Empty = no restriction (show all
  // non-unmarked categories matching the status filters).
  categoryIds: string[];
}

export const professoraFilters = writable<ProfessoraFilters>({
  studying: true,
  complete: false,
  categoryIds: [],
});
