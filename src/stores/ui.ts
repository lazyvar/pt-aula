// src/stores/ui.ts
import { writable } from 'svelte/store';

// Keyed by "side-<GroupName>" or "mob-<GroupName>". Maps to collapsed bool.
// Matches public/index.html:792 groupCollapseState.
// Default behavior: groups start collapsed (collapsed !== false).
export const groupCollapseState = writable<Record<string, boolean>>({});

// bottom sheet open state (only relevant on mobile viewport)
export const sheetOpen = writable<boolean>(false);
