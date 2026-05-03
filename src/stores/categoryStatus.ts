import { get, writable } from 'svelte/store';
import type { CategoryStatus } from '../types';
import { catConfig, hydrateCards } from './cards';

// Last error message, surfaced by ManagePanel as a small inline toast.
// Cleared after a short delay.
export const statusError = writable<string | null>(null);

let clearTimer: ReturnType<typeof setTimeout> | null = null;
function flashError(msg: string) {
  statusError.set(msg);
  if (clearTimer) clearTimeout(clearTimer);
  clearTimer = setTimeout(() => statusError.set(null), 4000);
}

export async function setCategoryStatus(id: string, status: CategoryStatus): Promise<void> {
  const before = get(catConfig);
  const entry = before[id];
  if (!entry) {
    flashError("Couldn't save — category not found.");
    return;
  }
  if (entry.status === status) return;
  // Optimistic update.
  catConfig.set({ ...before, [id]: { ...entry, status } });

  let res: Response;
  try {
    res = await fetch(`/api/categories/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch (e) {
    catConfig.set(before);
    flashError("Couldn't save — try again.");
    return;
  }

  if (!res.ok) {
    catConfig.set(before);
    if (res.status === 404) {
      flashError("That category no longer exists — refreshing.");
      // Re-hydrate so the pruned row disappears from the panel.
      try { await hydrateCards(); } catch { /* network gone — leave the snapshot */ }
    } else {
      flashError("Couldn't save — try again.");
    }
  }
}
