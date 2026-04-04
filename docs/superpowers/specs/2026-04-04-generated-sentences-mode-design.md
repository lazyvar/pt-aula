# Generated Sentences Mode — Design

**Date:** 2026-04-04
**Status:** Approved, ready for implementation plan

## Goal

Add a new "Generated Mode" to the pt-aula flashcard app that uses the Claude API
to generate 20 Brazilian Portuguese sentences for the user to translate, using
vocabulary and verbs from the user's currently active sidebar categories. The
flashcard UX is reused — generated sentences become a temporary deck.

## User Story

> As the single user of pt-aula, I want to click a "Generate Sentences" button
> and have Claude produce 20 fresh translation flashcards built from the verbs
> and topics I currently have selected, so I can practice using that vocabulary
> in real sentences without manually writing more seed data.

## Decisions (from brainstorming)

- **Flashcard format:** Full-sentence translation (PT ↔ EN), honoring the
  current pt↔en mode toggle. Not fill-in-the-blank.
- **Persistence:** Ephemeral. Generated cards live in browser memory only.
  Refresh, Exit, or re-Generate discards them. No new DB tables.
- **Selection source:** Whatever categories are currently active in the sidebar
  (across all groups). Server splits them by `group_name` into verbs vs. topics
  for prompt construction.
- **API key:** `ANTHROPIC_API_KEY` as a Fly secret / server env var. All Claude
  calls go through the server. Frontend never sees the key.
- **Integration:** Replaces the current deck in-place; banner indicates
  Generated Mode with an Exit button.
- **Difficulty:** Varied — mix of short (5-8 words) and longer (10-15 words,
  with clauses or multiple verbs) sentences in a single batch.
- **Stats:** Generated cards do NOT write to `card_stats` (no stable IDs). The
  in-session correct/wrong header counters still update for feedback.
- **Session table:** Not touched while in Generated Mode. The `session` row
  always reflects the real deck state.

## Architecture

### Server (`server.js`)

Add one new endpoint:

**`POST /api/generate-sentences`**

Request body:
```json
{ "activeCats": ["verbs_ser", "daily", "fitness"] }
```

Handler logic:
1. Validate `activeCats` is a non-empty array.
2. Query cards + categories for those IDs:
   ```sql
   SELECT c.pt, c.en, cat.group_name
   FROM cards c JOIN categories cat ON c.category_id = cat.id
   WHERE c.category_id = ANY($1)
   ```
3. Split rows by `group_name`: `Verbs` group → verb list; `Topics` group →
   topic vocab list. Rows from other groups (Phrases, Aulas, etc.) are
   ignored for prompt construction.
4. If both verbs and topics lists are empty → return 400 with message
   "Select at least one Verb or Topic category."
5. Build prompt (see below), call Claude via `@anthropic-ai/sdk`:
   - Model: `claude-haiku-4-5`
   - `max_tokens: 2000`
   - `temperature: 0.8`
6. Parse the response text: strip optional ```json fence, `JSON.parse`, validate
   shape `{sentences: [{pt, en}, ...]}`.
7. Return `{ cards: [{ pt, en }, ...] }` (same card shape as `/api/cards`, but
   without `cat`).
8. On parse / API errors: return 502 with `{error}` message.

**Prompt template:**

```
Generate 20 Brazilian Portuguese sentences for a language learner to
translate.

Constraints:
- Prefer using these verbs (conjugated naturally in the sentences):
  {verbs list, comma-separated}
- Use vocabulary from these topics when it fits naturally:
  {topics list, comma-separated}
- Vary difficulty: mix short sentences (5-8 words) and longer ones (10-15
  words with clauses or multiple verbs).
- Natural, conversational Brazilian Portuguese.
- Provide an accurate English translation for each.

Return STRICT JSON only, no prose, no markdown fence:
{"sentences":[{"pt":"...","en":"..."}]}
```

Add `@anthropic-ai/sdk` to `package.json` dependencies.

### Frontend (`public/index.html`)

**New UI elements:**
- `Generate` button in the controls row (near Shuffle / Reset Stats). Disabled
  when `activeCats` is empty.
- Generated Mode banner: a thin strip above the flashcard area showing
  `Generated Mode · 20 sentences` with an `Exit` button. Hidden by default.
- Loading state: while generation is in-flight, the Generate button shows a
  spinner and "Generating…"; other top-bar controls are disabled.

**New state (module-level JS vars):**
- `generatedMode: boolean` — are we currently showing generated cards?
- `generatedCards: Card[]` — the 20 generated cards (PT/EN only).
- `savedDeckSnapshot: { deckOrder, currentIndex, correct, wrong } | null` —
  snapshot of the real deck state, restored on Exit.

**Flow on Generate click:**
1. POST to `/api/generate-sentences` with `{ activeCats }`.
2. Show loading state.
3. On success: snapshot current deck state into `savedDeckSnapshot`, store
   response cards in `generatedCards`, set `generatedMode = true`, build a new
   deck from the generated cards (fresh `deckOrder` = `[0..19]`,
   `currentIndex = 0`, counters reset to 0), show banner, render first card.
4. On error: alert/toast the message, remain on normal deck.

**Flow on Exit click:**
1. Restore `deckOrder / currentIndex / correct / wrong` from `savedDeckSnapshot`.
2. Clear `generatedMode`, `generatedCards`, `savedDeckSnapshot`.
3. Hide banner.
4. Re-render the restored card.

**Behavior while in Generated Mode:**
- Flip, Next, pt↔en mode toggle, Shuffle all work against `generatedCards`.
- Mark-correct/Mark-wrong updates the in-memory counters only. SKIP the
  `POST /api/stats/:cardId/mark` call.
- The "save session to server" helper (whichever function PUTs `/api/session`)
  becomes a no-op whenever `generatedMode === true`. This keeps the server
  session row pointing at the real deck.
- Sidebar category toggles are disabled while in Generated Mode (category
  checkboxes are non-interactive, visually dimmed). Active categories only
  make sense for the real deck; the generated deck isn't tied to category
  IDs. User must Exit first to change category filters.

**Page refresh:** Since generated cards are in-memory only and the session row
isn't updated during Generated Mode, a refresh naturally drops back to the real
deck. No additional code needed.

## Deployment

- Add `ANTHROPIC_API_KEY` as a Fly secret:
  `fly secrets set ANTHROPIC_API_KEY=sk-ant-...`
- `fly deploy` to pick up new dependency + endpoint.

## Manual Verification

No automated tests in this repo. Verify manually:

1. `npm install` picks up the new `@anthropic-ai/sdk` dep; `npm start` boots
   without error.
2. With some Verbs + Topics categories active, click Generate → 20 cards appear,
   banner shows, flip/next/pt↔en mode all work.
3. Click Exit → original deck + position + counters restored.
4. Deactivate all categories → Generate button disabled (or clean error).
5. While in Generated Mode, the `session` DB row is unchanged — query it, or
   refresh the page and confirm the pre-Generate state comes back.
6. Unset `ANTHROPIC_API_KEY` locally → Generate returns a clean 5xx with a
   useful message (not a stack trace).
7. After `fly deploy` + setting the secret, smoke test in production.

## Out of Scope (YAGNI)

- Configurable sentence count (always 20).
- Difficulty picker UI (always "varied").
- Persisting generated cards to a DB table.
- Per-card stats tracking for generated cards.
- "Regenerate in place" button (user can Exit + Generate again).
- Retry/streaming logic for Claude API.
- Rate limiting (single-user app).
