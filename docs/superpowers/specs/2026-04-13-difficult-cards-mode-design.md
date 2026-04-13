# Difficult Cards Mode — Design

**Date:** 2026-04-13
**Status:** Approved, awaiting implementation plan

## Problem

Within any given category, the user eventually memorizes most cards, leaving one or two stragglers that keep getting missed. The current app offers no way to drill those stragglers specifically: "Review Wrong Cards" only covers the current session, and category toggles are too coarse. The user wants a deck built from the cards they're historically bad at.

## Definition of "Difficult"

A card is **difficult** if, out of its **last 5 attempts**, **≥2 were wrong**, AND the card has at least **3 total attempts** (so newly-introduced cards aren't flagged on early stumbles).

Rationale:
- Window of 5 reacts quickly — a card you've since mastered drops off within a few correct answers.
- Threshold of 2/5 (40%) matches the intuition of "I keep missing this one" without being so strict it captures nothing.
- The 3-attempt floor prevents the list from filling with cards the user has barely seen.

## Data Model

Add one column to `card_stats`:

```sql
ALTER TABLE card_stats ADD COLUMN IF NOT EXISTS recent_history INTEGER NOT NULL DEFAULT 0;
```

`recent_history` is a **5-bit ring buffer**. On each mark:

```
recent_history = ((recent_history << 1) | (wrong ? 1 : 0)) & 31
```

`1` bits represent wrong answers, `0` bits represent right answers. The number of recent wrongs is `popcount(recent_history)`. Total attempts come from the existing `right + wrong` columns.

Migration is idempotent. Existing cards backfill to `0`, which means they start classified as "not difficult" and become classifiable after their next attempts cycle through the window — acceptable, since fresh signal is what we want anyway.

## Server Changes (`server.js`)

**`POST /api/stats/:cardId/mark`** — when updating a card's stats, also update `recent_history` using the shift/mask formula. Return the full updated row (including `recent_history`) so the client cache stays in sync.

**`GET /api/stats`** — no signature change; the new column is included automatically because the endpoint returns full rows.

No new endpoint. Difficulty is computed client-side from the already-hydrated stats map.

## Client Changes

### `src/lib/difficulty.ts` (new)

Pure helpers, no stores:

```ts
export function popcount5(n: number): number { /* count bits in low 5 */ }

export function isDifficult(stat: CardStat): boolean {
  const attempts = stat.right + stat.wrong;
  if (attempts < 3) return false;
  return popcount5(stat.recent_history & 31) >= 2;
}

export function difficultCards(
  cards: Card[],
  stats: StatsMap,
  catFilter?: Set<string>,
): Card[];
```

### `src/stores/stats.ts`

- Extend `CardStat` type with `recent_history: number` (default 0 for unseen cards in `getCardStats`).
- `markCard` already updates the cache from the server response; no change needed beyond the type.

### `src/stores/session.ts`

New action `reviewDifficultCards(allCards: Card[])`:

1. Compute difficult cards scoped to `session.activeCats`.
2. If empty, fall back to difficult cards across **all** cards (hybrid scope).
3. If still empty, no-op. (Button is disabled in this state, but guard defensively.)
4. Shuffle, set as the new deck, reset `currentIndex`/`correct`/`wrong`/`wrongCards`. Same shape as `reviewWrongCards`.

### `src/lib/ControlButtons.svelte`

New button next to existing controls: **"Difficult (N)"**. `N` comes from a derived store `difficultCount` computed from `statsCache` + the user's active categories. Disabled when `N === 0`.

No new "mode" — this is a deck-builder action, same class as Shuffle and Review Wrong Cards. No snapshot/restore; exiting is automatic via any other deck-builder action.

## Why This Shape

- **No snapshot/restore**: unlike Generated Mode, this is just a deck rebuild using existing cards. Normal session persistence is fine.
- **No new endpoint**: stats are already hydrated on boot; difficulty is derived, not stored.
- **Bitmask over JSON array**: fixed-width, one-shot SQL update, cheap popcount. Widening the window later is a column-width bump.
- **Hybrid scope**: adds two lines to the action (one fallback path) and matches how the user actually works — drill the current focus area, but don't leave them stranded if the current selection has no difficult cards.

## Testing

Add `tests/difficult-mode.spec.js`:

1. **Eligibility gate** — card with `(right=2, wrong=0, recent_history=0)` is not difficult (fewer than 3 attempts).
2. **Threshold hit** — card with `(right=5, wrong=2, recent_history=0b00011)` has 2 wrongs in last 5 → difficult.
3. **Recovery** — card starts at `recent_history=0b11000` (2 wrongs), then 3 correct answers shift the buffer to `0b00000` → no longer difficult.
4. **Button UX** — badge reflects correct count, button is disabled when count is 0, clicking rebuilds the deck with the expected cards.
5. **Hybrid fallback** — deselect all categories containing difficult cards; clicking still pulls difficult cards from the full set.

Fixtures in `tests/fixtures/` may need a helper to seed `card_stats` rows with specific `recent_history` values.

## Open Questions

None at design time. The implementation plan will cover: order of migration vs. client deploy, and whether the count badge should update optimistically on mark or wait for the server response (probably the latter, consistent with the rest of the app).
