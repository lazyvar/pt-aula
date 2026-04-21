# AI-Graded Sentence Mode — Design

## Problem

Generated Sentence Mode currently has two grading paths:

1. **Flip + self-mark** — user flips the card and presses ✓ or ✗.
2. **Type mode** — user types the answer; an exact (diacritic-insensitive) match marks it right.

The user practices en→pt almost exclusively and rarely produces a character-perfect Portuguese translation. Exact-match grading rejects translations that are semantically correct but differ on articles, contractions, or connectors. Self-marking is too lenient — there's no external check on whether the Portuguese is actually right.

The user wants an AI grader that accepts reasonable translations, flags the specific mistakes (gender `o/a`, contractions `do/da`/`no/na`, connectors `para`/`que`), and teaches the rule to remember.

## Scope

**In scope:** Generated sentences mode (`/api/generate-sentences`) only.

**Out of scope:**
- `/api/generate-conjugations` — answers are a precise form (e.g. `eu andei`); exact match + self-mark stays.
- Non-generated (regular seed) cards — continue to use flip-and-self-mark or the existing type mode.
- Stats tracking — generated cards don't write to `card_stats` today, and that stays true here.

## Behavior

While in generated-sentence mode:

| Direction | Card cat | UI |
| --- | --- | --- |
| `en-to-pt` | `__generated__` | AI-grading UI (new) |
| `pt-to-en` | `__generated__` | Flip + self-mark (existing, unchanged) |

Direction toggle keeps working mid-deck. Flipping to `pt-to-en` swaps to the flip UI; flipping back swaps to the grader.

### AI-grading UI state machine

- **idle** — prompt shown (English side of the card), textarea for Portuguese, Submit button, "Give up" link.
- **grading** — textarea disabled, Submit shows spinner.
- **graded** — shows:
  - Grade badge: `1` / `2` / `3`.
  - One-line summary verdict.
  - Bulleted list of mistakes (empty when grade = 3).
  - Teaching rule (null/hidden when grade = 3).
  - The reference Portuguese (so the user always sees the model answer).
  - **Next** button; pressing Enter also advances.

**Give up** — skips the network call, jumps straight to the `graded` state with grade = 1 and the reference revealed. Counts as wrong.

### Grade rubric

Supplied to the AI in the prompt:

- **3** — near-perfect: at most 1 minor mistake.
- **2** — understandable but flawed: 2–3 mistakes.
- **1** — failing: 4+ mistakes or meaning lost.

### Counter mapping

- Grade **3** or **2** → `sessionMark(card, true)` (correct counter ++).
- Grade **1** or give-up → `sessionMark(card, false)` (wrong counter ++).

No writes to `/api/stats/:cardId/mark` (generated cards are ephemeral — the existing `if (!$generatedMode)` guard in `CardDeck.svelte` stays).

## API

### `POST /api/grade-sentence`

**Request:**
```json
{
  "en": "Yesterday I went to the store.",
  "userPt": "Ontem eu fui no loja.",
  "referencePt": "Ontem eu fui à loja."
}
```

**Response:**
```json
{
  "grade": 2,
  "summary": "Understandable, but two connector/gender issues.",
  "mistakes": [
    "`no loja` — `loja` is feminine (a loja), so use `na` not `no`.",
    "Missing the `a` crase: `ir a + a loja` → `à loja`."
  ],
  "rule": "`em + a/o` contracts to `na/no`. Before a feminine noun with a definite article, `a + a` contracts to `à` (crase)."
}
```

**Validation:**
- 400 if any of `en`, `userPt`, `referencePt` is missing or non-string.
- 500 if `ANTHROPIC_API_KEY` is not configured.
- 502 if the model returns malformed JSON or a response missing the expected fields.

**Implementation:** Mirrors the existing `/api/generate-sentences` and `/api/generate-conjugations` patterns in `server.js`:
- Uses `claude-haiku-4-5`.
- Strips optional markdown fence from the response.
- `JSON.parse`s; on failure returns 502 with a generic error (logs the raw text).

**Prompt outline (for implementation reference, not binding):**

```
You are grading a Brazilian Portuguese translation.

English prompt: {en}
Reference translation: {referencePt}
User's translation: {userPt}

Score on a 1–3 scale:
- 3 = near-perfect, at most 1 minor mistake
- 2 = 2–3 mistakes, still understandable
- 1 = 4+ mistakes or meaning lost

Focus on these common mistake classes:
- Article gender (o/a)
- Contractions (de → do/da, em → no/na)
- Missing/incorrect `para` or `que`
- Verb tense and conjugation
- Word order

For each mistake, name the specific error and show the fix.
When the grade is 1 or 2, include a short `rule` field teaching the underlying rule the user can remember. Omit or null the `rule` for grade 3.

Return STRICT JSON only, no prose, no markdown fence:
{"grade":1|2|3,"summary":"...","mistakes":["..."],"rule":"..."|null}
```

## Frontend Structure

**New file:** `src/lib/SentenceGrader.svelte`
- Receives `card: Card` and `mode: 'pt-to-en' | 'en-to-pt'` as props.
- Owns the three-state machine (idle / grading / graded).
- Calls `POST /api/grade-sentence` and renders the response.
- Calls a `onAdvance(gotIt: boolean)` prop when Next is pressed.

**New file:** `src/stores/grader.ts`
- Writable stores: `graderState: 'idle' | 'grading' | 'graded'`, `graderResult: GradeResponse | null`, `userInput: string`.
- `submit(card, mode)` / `giveUp(card)` / `reset()` helpers.
- Having this separate from `CardDeck.svelte` keeps that file from growing and makes the grader independently testable.

**Edit:** `src/lib/CardDeck.svelte`
- When `$generatedMode && $session.mode === 'en-to-pt' && currentCard?.cat === GENERATED_CAT`, render `<SentenceGrader>` in place of the card face + type row / buttons.
- Pass `onAdvance={(gotIt) => { mark(gotIt); grader.reset(); }}`.
- All other branches render exactly as today.

**Edit:** `src/types.ts`
- Add a `GradeResponse` type mirroring the API response.

**Mobile:** No special handling. The existing `isMobile` guard only disables the legacy exact-match type mode; the AI grader has visible Submit/Next buttons so it works on mobile as-is.

## Testing

### New Playwright spec: `tests/sentence-grader.spec.js`

All tests stub `/api/grade-sentence` via `page.route()` so they're deterministic. One test hits the real server endpoint without `ANTHROPIC_API_KEY` to verify the 500 path.

Covered:
1. Enter generated-sentence mode in en→pt → grader UI renders (textarea, Submit, Give up visible).
2. Type + Submit → loading state → graded state renders grade badge, mistakes list, rule, reference PT.
3. Grade 3 and 2 increment correct counter; grade 1 increments wrong counter.
4. Next button advances to next card and resets grader to idle. Enter key also advances.
5. Give up → grader jumps to graded state with grade 1, reference revealed, no fetch made. Wrong counter increments.
6. Mode toggle mid-deck: en→pt shows grader, pt→en shows flip UI, toggle back shows grader again.
7. Exit generated mode restores the real deck (may already be covered in existing generated-mode tests — extend rather than duplicate).
8. Server validation: POST to `/api/grade-sentence` with missing fields returns 400; without `ANTHROPIC_API_KEY` returns 500.

### Regression

Run `npm test` — must pass unchanged for `session.spec.js`, `mobile.spec.js`, and any other existing specs.

## Risks / Open Questions

- **AI cost/latency on every submit.** Each submit is one Haiku call. Acceptable given single-user app; no throttling or caching needed.
- **Grade consistency.** Haiku may be inconsistent on borderline cases (2 vs 3). Passing the `referencePt` in the prompt anchors it but doesn't eliminate drift. Acceptable — the mistakes list and rule are the real teaching value.
- **Generated cards live only in the client.** The grader endpoint needs `en` and `referencePt` from the client (no DB lookup). That's fine — the client already holds the generated cards.
