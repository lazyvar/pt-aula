# Listening Mode — Design

**Status:** Approved
**Date:** 2026-05-02

## Goal

Add a third practice mode to pt-aula: the user hears a Portuguese phrase via ElevenLabs TTS (no text shown) and types the Portuguese they heard. Grading compares the typed text to `card.pt` after a forgiving normalization that ignores case, diacritics, and punctuation.

## Non-goals

- Audio caching. Every play hits ElevenLabs.
- Multiple voices. One hardcoded pt-BR voice (env-overridable).
- Strict orthography drilling. Diacritics and punctuation are not graded.
- An English-listening variant. Listening always means PT audio → typed PT.
- A separate Generated-Mode-style surface. Listening is a third value of `Session.mode`, not a parallel app.

## Architecture

Listening Mode is a third value of `Session.mode`:

```ts
mode: 'pt-to-en' | 'en-to-pt' | 'listen-to-pt';
```

The deck, session row, stats, category filtering, generated mode, and `wrongCards` review all reuse existing machinery unchanged. Only the prompt UI differs: `CardDeck.svelte` branches on mode and renders a new `<ListeningCard>` component when `mode === 'listen-to-pt'` (and the AI grader is not active).

A new `POST /api/tts` endpoint proxies ElevenLabs and streams MP3. The endpoint is also exposed as `GET /api/tts?text=...` so an `<audio>` element can use it directly as `src`.

### Why a mode value, not a flag

A boolean like `listenMode` would create an awkward matrix with `pt-to-en` / `en-to-pt`. Listening replaces the prompt direction; it doesn't compose with one. Modeling it as a third mode value keeps the union exhaustive and makes the UI state easy to reason about.

## Backend

### `GET /api/tts?text=<encoded>` and `POST /api/tts` (body `{ text }`)

Both shapes route to the same handler. `<audio>` elements need a GET URL; the POST shape exists for symmetry with other API endpoints and as a future-proof affordance.

- Validates `text` is a non-empty string ≤ 500 chars; rejects with 400 otherwise. Bounds per-call cost.
- 500 if `ELEVENLABS_API_KEY` is missing, mirroring `server.js:200` for `ANTHROPIC_API_KEY`.
- Calls `https://api.elevenlabs.io/v1/text-to-speech/<voice_id>` with header `xi-api-key`, body `{ text, model_id: 'eleven_multilingual_v2' }`. Uses Node's global `fetch` (no SDK dependency).
- Pipes the upstream response body to the Express response with `Content-Type: audio/mpeg`. No buffering, no on-disk caching.
- 502 on upstream non-2xx, matching the existing pattern in `/api/generate-sentences`.

### Configuration

- `ELEVENLABS_API_KEY` — required.
- `ELEVENLABS_VOICE_ID` — optional override. Default is the voice ID for **"Camila"** (a multilingual voice with strong pt-BR pronunciation). Hardcoded as a constant in `server.js`. Implementer should verify the current ID at build time from the ElevenLabs voice library and substitute another pt-BR-capable voice if Camila is unavailable.
- Model is hardcoded to `eleven_multilingual_v2`.
- Add `ELEVENLABS_API_KEY` to fly secrets when deploying. No new volumes.

### No DB migration

`Session.mode` is stored as an opaque string by `GET /api/session` / `PUT /api/session`. Extending the union does not require a column change.

## Frontend

### State

`src/types.ts` extends the `Session.mode` union to include `'listen-to-pt'`. No new fields on `Session`.

`src/stores/session.ts`:
- `toggleMode()` keeps its current behavior (cycles `pt-to-en` ↔ `en-to-pt` only). It does not include `listen-to-pt`.
- New `setMode(mode: Session['mode'])` action for direct selection. Used by the Listen entry button and the "back to flashcards" exit.

### `<ListeningCard>` component (`src/lib/ListeningCard.svelte`)

`CardDeck.svelte` renders `<ListeningCard>` when `$session.mode === 'listen-to-pt'` and `useAIGrader` is false. The flip card and `typeMode` paths are unchanged.

Layout, top to bottom:
1. Category tag (same `cc.cls` / `cc.label` as the flip card).
2. Large 🔊 Play button, ~80px tall.
3. Text input. `lang="pt-BR"`, `autocomplete="off"`, `autocapitalize="off"`, `spellcheck="false"`. Autofocus on card show.
4. Buttons row: **Check** (primary, disabled when input empty/whitespace) and **Skip / Reveal** (secondary; marks wrong, opens reveal panel).
5. Reveal panel (post-submit): the original `card.pt` (diacritics and punctuation intact), the EN translation, and ✓/✗ verdict. Enter or Space advances.
6. Per-card stats line `{right}✓ {wrong}✗` when either count > 0. Same as the flip card.
7. Keyboard hint: `Enter = check · Esc = skip`.

### Audio mechanics

- `<audio>` element bound via `bind:this`. On card change, set `src` to `/api/tts?text=<encodeURIComponent(card.pt)>`.
- Auto-play on card show via `audio.play()`. The promise rejection is caught silently; if the browser blocks autoplay before any user gesture in the session, the visible Play button is the fallback.
- Replay is via the on-screen Play button. No keyboard shortcut for replay in v1 — `R` would conflict with typing the letter `r` in PT words. Tab/Esc combos were considered but add complexity for v1.

### Mode entry / exit UI

- **Sidebar (desktop):** existing pt↔en toggle stays. New "🎧 Listen" button below it calls `setMode('listen-to-pt')`. When listening mode is active, the pt↔en toggle hides and a "← Back to flashcards" button appears that calls `setMode('pt-to-en')`.
- **MobileTopBar / BottomSheet:** same pattern. A 🎧 entry that switches the bar's controls into listening-mode state with an exit button.

### Interaction with existing modes

- `typeMode` is ignored when `mode === 'listen-to-pt'`. Listening mode always types.
- Generated Mode + Listening Mode compose. Generated cards have a `pt` field, so listening-drilling generated sentences works without special-casing.
- Swipe gestures from `CardDeck.svelte` are not present in `<ListeningCard>` — the input owns the surface.

### Audio fallback when key is missing

Server returns 500 with `{ error: 'ELEVENLABS_API_KEY not configured on server' }`. Frontend detects this on the first `<audio>` error and shows a non-blocking banner: "Audio unavailable — set ELEVENLABS_API_KEY". The input still works for typing from memory; mode entry is not blocked.

## Grading

### `normalizeForListening(s: string)` in `src/lib/cardId.ts`

```ts
export function normalizeForListening(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}
```

Steps: trim, lowercase, strip diacritics, strip non-alphanumeric/non-whitespace, collapse whitespace.

### Why a new helper, not extend `normalizeForCompare`

`normalizeForCompare` lives in `CardDeck.svelte` and is used by the existing typeMode where punctuation may matter. Listening mode never grades punctuation (you can't hear it). Separating the function avoids weakening typeMode behavior.

### Grading call site

```ts
const ok = normalizeForListening(typedAnswer) === normalizeForListening(currentCard.pt);
sessionMark(currentCard, ok);
if (!$generatedMode) await markCard(currentCard, ok);
```

### Edge cases

- Empty or whitespace-only input + Enter is a no-op. Check button disabled. We don't grade nothing as wrong.
- Multi-word phrases with extra spaces: collapsed by the `\s+` replacement.
- Numbers in card text: preserved by the regex (rare in current seeds, but generated sentences may include them).

## Error handling

| Failure mode | Server | Frontend |
|---|---|---|
| `ELEVENLABS_API_KEY` missing | 500 with error message | Non-blocking banner; input still works; mode entry not blocked |
| ElevenLabs 4xx/5xx | 502 | `<audio>` `error` event → "Couldn't load audio — retry?" link |
| `text` missing or > 500 chars | 400 | Should not occur (frontend always sends bounded `card.pt`); shown as audio error if it does |
| Browser autoplay blocked | n/a | `audio.play()` rejection caught silently; Play button is the fallback |
| Network drop mid-stream | n/a | `<audio>` handles partial buffers; user clicks Play to retry |

No automatic retries on TTS failures. Each retry costs an API call; the user decides.

## Testing

New file: `tests/listening.spec.js`. The existing Playwright project layout (single worker, chromium + mobile projects) covers it. Tests must not call the real ElevenLabs API.

`tests/fixtures/silent.mp3` — a tiny silent MP3 used to satisfy `<audio>` requests during tests.

Test cases:

1. **Mode entry persists.** Enter Listen mode; reload the page; assert `<ListeningCard>` is rendered (validates `mode: 'listen-to-pt'` round-trips through `/api/session`).
2. **Correct typed answer advances and increments correct counter.** Mock `/api/tts*` via `page.route` to return the silent MP3. Type the exact `card.pt` for a known seeded card. Assert `data-testid="counter-correct"` increments and the next card is shown.
3. **Wrong typed answer increments wrong counter and adds card to wrongCards.** Type something obviously wrong; assert `data-testid="counter-wrong"` increments and the card appears in the wrong-review pool.
4. **Normalization.** Card with `pt: "Você está bem?"`. Type `"voce esta bem"`. Assert it's graded correct.
5. **Empty submit is a no-op.** Press Enter on empty input. Assert no counter changes and the card does not advance.
6. **Mode interplay.** Switch to listen mode, then back to `pt-to-en`. Assert deck identity and currentIndex are preserved.
7. **Frontend handles 500 from TTS gracefully.** `page.route('/api/tts*', r => r.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'ELEVENLABS_API_KEY not configured on server' }) }))`. Enter listen mode; assert the "Audio unavailable" banner appears and that the input still accepts typing and grades correctly.
8. **Frontend handles 502 from TTS gracefully.** `page.route('/api/tts*', r => r.fulfill({ status: 502 }))`. Enter listen mode; assert the "Couldn't load audio — retry?" link appears next to the play button. Typing and grading still work.

Server-side env-var validation (missing-key 500, upstream-error 502) is not exercised by Playwright — Playwright's webServer reads env once at boot, so toggling env mid-suite is not viable. These paths mirror the existing `/api/generate-sentences` validation pattern at `server.js:200` and are covered by code review.

**Verification gate:** The implementation is not complete until `npm test` passes end-to-end (full Playwright suite, both projects), in addition to the new `listening.spec.js` cases.

**Manual verification:** Once implemented and with a real `ELEVENLABS_API_KEY` set locally, run a full session through 5-10 real cards and one generated-sentences round. Confirm voice quality and latency are acceptable.

## Files touched

New:
- `src/lib/ListeningCard.svelte`
- `tests/listening.spec.js`
- `tests/fixtures/silent.mp3`

Modified:
- `server.js` — add `/api/tts` (GET + POST), env validation, fetch + pipe.
- `src/types.ts` — extend `Session.mode` union.
- `src/lib/cardId.ts` — add `normalizeForListening`.
- `src/stores/session.ts` — add `setMode`; leave `toggleMode` unchanged.
- `src/lib/CardDeck.svelte` — branch on `mode === 'listen-to-pt'` to render `<ListeningCard>`.
- `src/lib/Sidebar.svelte` — Listen entry/exit buttons.
- `src/lib/MobileTopBar.svelte` and `src/lib/BottomSheet.svelte` — Listen entry/exit on mobile.
- `Dockerfile` / `fly.toml` — no changes; secret is set via `fly secrets set ELEVENLABS_API_KEY=...` at deploy time.
