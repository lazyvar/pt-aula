# Real-Behavior Test Suite — Design

**Date:** 2026-04-05
**Status:** Approved, pending implementation plan

## Problem

The existing Playwright suite asserts that *something* changed rather than that the *correct thing* changed. Representative examples:

- `tests/deck.spec.js:15` — asserts front text length > 0, never verifies it is a real Portuguese word from seed data.
- `tests/deck.spec.js:37-38` — asserts the next card differs from the first, never verifies deck integrity (no dupes, correct size, correct categories).
- `tests/mode.spec.js:26` — asserts front text changed after mode toggle, never verifies it is now the English translation of the same card.
- `tests/marking.spec.js:14-17` — asserts the UI counter incremented, never verifies that the marked card's stat was recorded server-side under the correct `card_id`.
- `tests/categories.spec.js` — asserts a filter button's `active` class toggles, never verifies the corresponding cards disappear from the deck.

There is also no coverage of the mobile UI, which uses a different layout (same behavior) at smaller viewports.

## Goals

General quality uplift: regression safety, behavior documentation, and bug catching in one pass. Specifically, close these coverage gaps:

1. **Pair integrity** — flipping a card reveals the *correct* translation for the visible front.
2. **Deck composition** — active categories actually determine deck contents (size, membership, no duplicates).
3. **Mode correctness** — `pt-to-en` means front=pt/back=en; `en-to-pt` means the reverse. Asserted against known pairs.
4. **Stats accuracy** — marking a specific card records under the exact `card_id` format the frontend uses, visible via `/api/stats`.
5. **Mobile UI** — core flows work at a mobile viewport.

## Non-goals

- End-of-deck behavior and wrong-pile replay.
- Full session round-trip fidelity (deckOrder byte-for-byte).
- Direct API contract tests (validation, edge cases) beyond what is needed to verify stats accuracy.
- `/api/generate-sentences` (LLM-dependent).

## Design

### Source of truth

Tests assert against what the server actually serves via `GET /api/cards` rather than importing `./seeds` directly. This ensures tests reflect what a real client sees — if the server stopped serving a card, tests would notice.

**New file: `tests/fixtures/truth.js`**

Exposes:

- `getAllCards()` → `[{ pt, en, cat }]`
- `getCardByPt(pt)` / `getCardByEn(en)` → pair lookup
- `getCardsInCategories(catIds)` → expected deck membership
- `getCategories()` → `{ id → { label, cls, group } }`
- `cardId(pt, en)` → the exact client-side `card_id` construction (to be verified by reading `public/index.html` per CLAUDE.md — pt + en text).

Implementation fetches `/api/cards` once per call and returns synchronous lookup helpers over the fetched snapshot. Called from each test's `beforeEach` after `resetAll()`.

### File reorganization

Tests organize by behavior concern rather than UI area. Old files migrate into these:

| New file | Replaces | Covers |
|---|---|---|
| `pair-integrity.spec.js` | parts of `deck.spec.js`, `mode.spec.js` | Front/back of card is a real seed pair. Flipping reveals the correct translation. Holds across advance (5+ cards) and across both modes. |
| `deck-composition.spec.js` | parts of `deck.spec.js`, `categories.spec.js` | Deck size equals sum of cards in active categories. No duplicates in a single pass. Toggling a category off removes its specific cards from the remaining deck. Every card shown belongs to an active category. |
| `mode.spec.js` | existing `mode.spec.js` | `pt-to-en`: front==pt / back==en (asserted against truth). `en-to-pt`: reversed. Toggle persists across reload. |
| `stats.spec.js` | existing `marking.spec.js` | Marking a specific card records under the exact `card_id` in `/api/stats`. Counter UI matches server state. Stats survive reload. |
| `mobile.spec.js` | new | Core flows — flip, mark, advance, mode toggle, one category toggle — at mobile viewport. |
| `session.spec.js` | unchanged | Mid-deck restoration after reload. |

Old files removed after migration: `deck.spec.js`, `marking.spec.js`, `categories.spec.js`.

### Assertion patterns

**Pair integrity** — read visible front word, look it up in truth to get expected translation, flip, assert back === expected. Repeat across ≥5 advances.

**Deck composition** — compute expected size from truth (activeCats → Σ cards). Walk the entire deck recording each card; assert (a) count === expected, (b) no duplicates, (c) each card's `cat` is in activeCats. For toggle-off: capture remaining cards, toggle a category off, assert that category's cards are absent from the remaining sequence.

**Mode correctness** — in pt→en, use front as a `pt` key in truth, assert back === truth's `en`. In en→pt, look up front as `en`, assert back === `pt`.

**Stats accuracy** — find a specific card's pt/en from truth, compute expected `card_id` via `cardId(pt, en)`, mark it right via the UI, wait for the session/stats write to settle, `GET /api/stats`, assert `stats[expectedId].right === 1` and the UI counter === 1.

**Mobile** — a separate Playwright project runs only `mobile.spec.js` at viewport 390×844 and exercises a focused subset of flows. The project relies on the same reset fixture and the same truth fixture.

### Infrastructure changes

1. **`tests/fixtures/truth.js`** — new, described above.
2. **`playwright.config.js`** — add a `mobile` project alongside the desktop project. Desktop project runs everything *except* `mobile.spec.js`; mobile project runs *only* `mobile.spec.js` with mobile viewport.
3. **Read `public/index.html` once during implementation** to extract the exact `card_id` construction rule and replicate it in `truth.js`.
4. **No new `data-testid` attributes** expected. If a gap appears during implementation, flag it rather than scattering ad-hoc ids.
5. **`waitForSessionWrite(page)` helper** in a new `tests/fixtures/waits.js` (or inline in truth.js) — wraps `page.waitForLoadState('networkidle')` with a clear name, used before any assertion against server state following a UI-driven write. This addresses the existing fire-and-forget `saveSession()` race documented in `tests/marking.spec.js:36`.

No changes to: `server.js`, seed files, `tests/fixtures/reset.js`, CI workflow.

### Determinism

Deck order is random. Tests that walk the full deck iterate until `counter-remaining` reaches 0 rather than assuming a fixed order. Tests needing a specific card find it by searching the deck, not by position. No hardcoded pt/en literals in assertions — all comparisons flow through `truth`.

To keep deck-walking tests fast, deck-composition tests toggle off all but a small active-category set so walks stay under a few seconds.

## Risks

- **Network-idle races.** UI actions fire unawaited `saveSession()` PUTs. Tests that read server state after a UI action must wait. Mitigated by the `waitForSessionWrite` helper.
- **Walk-the-deck slowness.** Mitigated by filtering to a small category for those tests.
- **Seed drift.** Not a risk — truth re-reads `/api/cards`. If seeds change, tests adapt automatically.
- **Frontend `card_id` format discovery.** If the construction rule in `public/index.html` is more complex than pt+en concatenation (whitespace handling, normalization), `truth.js` must replicate it exactly. Implementation plan must include a verification step that the computed id matches what the server observes after a real mark.
