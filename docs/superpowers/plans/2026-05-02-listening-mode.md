# Listening Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Listening Mode" to pt-aula where the user hears a Brazilian Portuguese phrase via ElevenLabs TTS (no text shown) and types the Portuguese they heard. Grading uses a forgiving normalization (case/diacritic/punctuation insensitive).

**Architecture:** Listening Mode is a third value of `Session.mode` (`'listen-to-pt'`). Existing deck/session/stats/category/wrong-review machinery is reused unchanged. A new `<ListeningCard>` component replaces the flip card when this mode is active. A new `GET/POST /api/tts` endpoint proxies ElevenLabs and streams MP3; no caching.

**Tech Stack:** Node 18+ (server), Express, Svelte 4, TypeScript, Playwright. ElevenLabs HTTP API (`eleven_multilingual_v2` model) called via Node global `fetch` (no SDK).

**Source spec:** `docs/superpowers/specs/2026-05-02-listening-mode-design.md` — read once before starting if you're missing context.

---

## File Structure

**Created:**
- `src/lib/ListeningCard.svelte` — UI for listen-mode cards. Plays audio via `<audio>`, accepts typed input, grades via `normalizeForListening`, shows reveal panel.
- `tests/listening.spec.js` — Playwright suite covering mode entry persistence, typing flow, normalization, empty-submit no-op, audio-error UI, and mode interplay.
- `tests/fixtures/silent.mp3` — ~100ms silent MP3 used by route stubs.

**Modified:**
- `src/types.ts` — extend `Session.mode` union with `'listen-to-pt'`.
- `src/lib/cardId.ts` — add exported `normalizeForListening(s)`.
- `src/stores/session.ts` — add `setMode(mode)` action; leave `toggleMode` unchanged.
- `server.js` — add `GET /api/tts?text=…` and `POST /api/tts` handler near the other AI endpoints.
- `src/lib/CardDeck.svelte` — branch on `$session.mode === 'listen-to-pt'` to render `<ListeningCard>` instead of the flip card / type-mode UI.
- `src/lib/ControlButtons.svelte` — add a "🎧 Listen" button (and "← Flashcards" when active); hide the pt↔en toggle while in listen mode.

**Untouched (verify, don't modify):**
- `src/stores/cards.ts`, `src/stores/stats.ts`, `src/stores/generated.ts`, `src/stores/ui.ts` — listen mode reuses these as-is.
- `src/lib/Sidebar.svelte`, `src/lib/MobileTopBar.svelte`, `src/lib/BottomSheet.svelte` — desktop and mobile both render `<ControlButtons>` (Sidebar directly, BottomSheet via mobile sheet), so the entry button only needs to be added there.
- DB schema — `session.mode TEXT` already accepts arbitrary strings.

---

## Task 1: Extend `Session.mode` type and add `setMode` action

**Files:**
- Modify: `src/types.ts:22`
- Modify: `src/stores/session.ts` (add new exported function near `toggleMode` at line 251)

- [ ] **Step 1: Extend the mode union**

In `src/types.ts`, change line 22:

```ts
  mode: 'pt-to-en' | 'en-to-pt' | 'listen-to-pt';
```

- [ ] **Step 2: Add `setMode` action**

In `src/stores/session.ts`, after the existing `toggleMode` function (at line 251-256), add:

```ts
/**
 * Set mode directly (used for entering/exiting listen-to-pt, where a
 * 2-cycle toggle would be confusing).
 */
export function setMode(mode: Session['mode']): void {
  session.update((s) => ({ ...s, mode }));
}
```

- [ ] **Step 3: Type-check passes**

Run: `npm run check`
Expected: 0 errors. (Existing call sites of `toggleMode` are unaffected; the wider union is structurally compatible.)

- [ ] **Step 4: Commit**

```bash
git add src/types.ts src/stores/session.ts
git commit -m "feat: add listen-to-pt mode value and setMode action"
```

---

## Task 2: Add `normalizeForListening` helper

**Files:**
- Modify: `src/lib/cardId.ts`

- [ ] **Step 1: Add the exported helper**

Append to `src/lib/cardId.ts`:

```ts
/**
 * Normalize a typed answer for listen-mode grading: case-insensitive,
 * diacritic-insensitive, punctuation-insensitive, whitespace-collapsed.
 * Strictly looser than the typeMode comparator, since punctuation isn't
 * audible in the prompt.
 */
export function normalizeForListening(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}
```

- [ ] **Step 2: Type-check passes**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 3: Sanity-verify the helper in a Node REPL**

Run:

```bash
node -e "
const fn = (s) => s.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9\s]/g,'').replace(/\s+/g,' ');
console.log(JSON.stringify(fn('Você está bem?')));
console.log(JSON.stringify(fn('  voce ESTA bem  ')));
console.log(fn('Você está bem?') === fn('voce esta bem'));
"
```

Expected output:
```
"voce esta bem"
"voce esta bem"
true
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/cardId.ts
git commit -m "feat: add normalizeForListening for listen-mode grading"
```

---

## Task 3: Add `/api/tts` endpoint to `server.js`

**Files:**
- Modify: `server.js` (insert near the other AI endpoints; after `/api/generate-conjugations` finishes, before the `/api/grade-sentence` block)

- [ ] **Step 1: Add the endpoint**

Find the line in `server.js` between the close of `/api/generate-conjugations` and the start of `/api/grade-sentence` (around line 437 in the current file — locate by searching for `app.post("/api/grade-sentence"`). Immediately above that line, insert:

```js
// POST /api/tts — body: { text }
// GET  /api/tts?text=… — query string variant for <audio src=…> elements
// Returns audio/mpeg streamed from ElevenLabs. No caching.
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "FGY2WhTYpPnrIDTdsKH5"; // "Camila" (multilingual, pt-BR)
const ELEVENLABS_MODEL_ID = "eleven_multilingual_v2";

async function handleTts(text, res) {
  if (typeof text !== "string" || text.length === 0 || text.length > 500) {
    return res.status(400).json({ error: "text must be a non-empty string ≤ 500 chars" });
  }
  if (!process.env.ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: "ELEVENLABS_API_KEY not configured on server" });
  }

  try {
    const upstream = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": process.env.ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({ text, model_id: ELEVENLABS_MODEL_ID }),
      }
    );

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => "");
      console.error("TTS upstream error:", upstream.status, errText);
      return res.status(502).json({ error: `ElevenLabs returned ${upstream.status}` });
    }

    res.setHeader("Content-Type", "audio/mpeg");
    // Pipe the upstream Web ReadableStream to the Express response.
    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(Buffer.from(value));
    }
    res.end();
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    console.error("TTS failed:", msg);
    if (!res.headersSent) res.status(502).json({ error: msg });
    else res.end();
  }
}

app.post("/api/tts", async (req, res) => {
  await handleTts(req.body && req.body.text, res);
});

app.get("/api/tts", async (req, res) => {
  await handleTts(req.query.text, res);
});

```

- [ ] **Step 2: Smoke-check the endpoint structure (no real key needed)**

Start the server pointing at the test DB on a different port (so you don't disturb dev) and confirm the missing-key path:

```bash
docker compose -f docker-compose.test.yml up -d --wait
DATABASE_URL=postgres://postgres:postgres@localhost:5433/pt_aula_test PORT=3007 node server.js &
SERVER_PID=$!
sleep 1
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3007/api/tts?text=hello"
kill $SERVER_PID
```

Expected output: `500` (because `ELEVENLABS_API_KEY` is unset in this shell).

- [ ] **Step 3: Verify no regressions in existing endpoints**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add server.js
git commit -m "feat(server): add /api/tts ElevenLabs proxy endpoint"
```

---

## Task 4: Add `silent.mp3` test fixture

**Files:**
- Create: `tests/fixtures/silent.mp3` (binary, ~1-2 KB)

- [ ] **Step 1: Confirm ffmpeg is available**

Run: `ffmpeg -version | head -1`
Expected: a version string. If not installed: `brew install ffmpeg` on macOS.

- [ ] **Step 2: Generate the silent MP3**

Run:

```bash
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 0.1 -q:a 9 -acodec libmp3lame tests/fixtures/silent.mp3 -y
```

Expected: file `tests/fixtures/silent.mp3` exists, size between 500 bytes and 5 KB.

Verify:

```bash
ls -la tests/fixtures/silent.mp3
file tests/fixtures/silent.mp3
```

Expected: shows `Audio file with ID3 ... MPEG ADTS, layer III` or similar MP3 identification.

- [ ] **Step 3: Commit**

```bash
git add tests/fixtures/silent.mp3
git commit -m "test: add silent.mp3 fixture for /api/tts route stubbing"
```

---

## Task 5: Add Listen mode entry button to `ControlButtons`

**Files:**
- Modify: `src/lib/ControlButtons.svelte`

- [ ] **Step 1: Import `setMode`**

Replace the existing import line at `src/lib/ControlButtons.svelte:2` from:

```ts
  import { session, toggleMode, shuffleRemaining, startDeck, deleteSession } from '../stores/session';
```

to:

```ts
  import { session, toggleMode, setMode, shuffleRemaining, startDeck, deleteSession } from '../stores/session';
```

- [ ] **Step 2: Replace the mode-toggle button block with a conditional**

Replace lines 38-40 (the `<button class="ctrl-btn" data-testid={...} data-mode={...} on:click={toggleMode}>...</button>` block) with:

```svelte
{#if $session.mode === 'listen-to-pt'}
  <button
    class="ctrl-btn"
    data-testid={testIds ? 'listen-exit' : undefined}
    on:click={() => setMode('pt-to-en')}
  >
    ← Flashcards
  </button>
{:else}
  <button class="ctrl-btn" data-testid={testIds ? 'mode-toggle' : undefined} data-mode={$session.mode} on:click={toggleMode}>
    {$session.mode === 'pt-to-en' ? 'PT → EN' : 'EN → PT'}
  </button>
  <button
    class="ctrl-btn"
    data-testid={testIds ? 'listen-enter' : undefined}
    on:click={() => setMode('listen-to-pt')}
  >
    🎧 Listen
  </button>
{/if}
```

- [ ] **Step 3: Type-check passes**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 4: Manual smoke (optional but useful)**

Run `npm run dev` and `npm start` (with the dev DB), open `http://localhost:5173`, click 🎧 Listen and verify the button transforms into "← Flashcards". Click it again to confirm it returns. (No card UI changes yet — that's Task 6.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/ControlButtons.svelte
git commit -m "feat(ui): add Listen mode entry/exit buttons"
```

---

## Task 6: Create `<ListeningCard>` skeleton and branch from `CardDeck`

This task wires up the new component so listen mode renders something distinct, but defers audio and grading to Tasks 7-8. After this task, entering listen mode shows a placeholder card with a 🔊 button and an input that doesn't yet do anything useful. We split the implementation across three tasks so each is testable in isolation.

**Files:**
- Create: `src/lib/ListeningCard.svelte`
- Modify: `src/lib/CardDeck.svelte` (around lines 32-36 where `useAIGrader` is computed, and around line 220 where the branch happens)

- [ ] **Step 1: Create `ListeningCard.svelte` with skeleton structure**

Write `src/lib/ListeningCard.svelte`:

```svelte
<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { session, deck, mark as sessionMark } from '../stores/session';
  import { catConfig } from '../stores/cards';
  import { statsCache, markCard, getCardStats } from '../stores/stats';
  import { generatedMode } from '../stores/generated';
  import { normalizeForListening } from './cardId';
  import { GENERATED_CAT, type Card } from '../types';

  $: currentCard = $deck[$session.currentIndex] as Card | undefined;
  $: cc = currentCard
    ? $catConfig[currentCard.cat] || { cls: 'cat-generated', label: '✨ Generated', group: '' }
    : null;
  $: cardStats = currentCard ? getCardStats(currentCard) : { right: 0, wrong: 0 };
  $: showCardStats = cardStats.right > 0 || cardStats.wrong > 0;
  $: $statsCache, (cardStats = currentCard ? getCardStats(currentCard) : { right: 0, wrong: 0 });

  let audioEl: HTMLAudioElement | undefined;
  let inputEl: HTMLInputElement | undefined;
  let typed = '';
  let revealed = false;
  let lastVerdict: 'right' | 'wrong' | null = null;
  let audioStatus: 'ok' | 'missing-key' | 'upstream-error' = 'ok';
  let lastCardPt: string | undefined;

  $: ttsSrc = currentCard ? `/api/tts?text=${encodeURIComponent(currentCard.pt)}` : '';

  // Reset per-card state whenever the active card changes.
  $: if (currentCard && currentCard.pt !== lastCardPt) {
    lastCardPt = currentCard.pt;
    onCardChange();
  }

  async function onCardChange() {
    typed = '';
    revealed = false;
    lastVerdict = null;
    audioStatus = 'ok';
    await tick();
    if (inputEl) inputEl.focus();
    // Auto-play; ignore rejection (autoplay policy).
    if (audioEl) {
      try {
        audioEl.currentTime = 0;
        await audioEl.play();
      } catch {
        // Ignore — visible play button is the fallback.
      }
    }
  }

  async function play() {
    if (!audioEl) return;
    try {
      audioEl.currentTime = 0;
      await audioEl.play();
    } catch {
      // Ignore.
    }
  }

  // Placeholder — Task 7 wires real grading.
  async function check() {}
  async function skip() {}
  async function advance() {}

  function onAudioError() {
    // Placeholder — Task 8 wires real error detection (status code).
    audioStatus = 'upstream-error';
  }

  onMount(() => {
    // Trigger the first card's onCardChange even if the reactive block
    // hasn't fired yet (e.g. when component mounts with a card already set).
    if (currentCard) {
      lastCardPt = currentCard.pt;
      onCardChange();
    }
  });
</script>

<div class="card-area" data-testid="listening-card">
  {#if currentCard}
    {#if cc}<span class="category-tag {cc.cls}">{cc.label}</span>{/if}

    <button
      class="btn"
      data-testid="listen-play"
      type="button"
      on:click={play}
    >
      🔊 Play
    </button>

    <audio
      bind:this={audioEl}
      src={ttsSrc}
      preload="auto"
      on:error={onAudioError}
    ></audio>

    <input
      bind:this={inputEl}
      class="type-input"
      data-testid="listen-input"
      type="text"
      lang="pt-BR"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      placeholder="Type the Portuguese you heard…"
      bind:value={typed}
      on:keydown={(e) => {
        if (e.key === 'Enter') { e.preventDefault(); revealed ? advance() : check(); }
        else if (e.key === 'Escape') { e.preventDefault(); skip(); }
      }}
    />

    <div class="buttons">
      <button
        class="btn btn-wrong"
        data-testid="listen-skip"
        type="button"
        on:click={skip}
      >Skip</button>
      <button
        class="btn btn-right"
        data-testid="listen-check"
        type="button"
        disabled={typed.trim().length === 0}
        on:click={check}
      >Check</button>
    </div>

    {#if revealed}
      <div class="reveal" data-testid="listen-reveal">
        <div class="card-label">Português</div>
        <div class="card-word">{currentCard.pt}</div>
        <div class="card-label" style="margin-top:8px">English</div>
        <div class="card-word">{currentCard.en}</div>
        <div data-testid="listen-verdict" style="margin-top:12px">
          {lastVerdict === 'right' ? '✓ correct' : '✗ try again'}
        </div>
      </div>
    {/if}

    {#if showCardStats}
      <div style="font-size:0.7rem;color:var(--text-dim);margin-top:8px">
        {cardStats.right}&#10003; {cardStats.wrong}&#10007;
      </div>
    {/if}

    <div class="keyboard-hint">Enter = check · Esc = skip</div>
  {/if}
</div>
```

- [ ] **Step 2: Branch in `CardDeck.svelte`**

In `src/lib/CardDeck.svelte`, add an import at the top of the script block (alongside the existing imports near line 7):

```ts
  import ListeningCard from './ListeningCard.svelte';
```

Then add a reactive declaration alongside `useAIGrader` (after line 36):

```ts
  $: useListening = $session.mode === 'listen-to-pt' && !useAIGrader;
```

Then change the existing rendering branch. Replace the `{#if useAIGrader && currentCard}` ... `{:else}` ... structure starting at line 220 with:

```svelte
  {#if useAIGrader && currentCard}
    <SentenceGrader
      card={currentCard}
      onAdvance={(gotIt) => mark(gotIt)}
    />
  {:else if useListening && currentCard}
    <ListeningCard />
  {:else}
```

(Keep the existing `{:else}` body — flip card + type-mode UI — unchanged.)

Also update `handleKeydown` (around line 188) so listen mode owns its own keyboard like the AI grader does:

```ts
    if (useAIGrader) return;  // grader owns keyboard via its own svelte:window
    if (useListening) return; // listening card's input owns the keyboard
```

(Add the `useListening` line right after the existing `useAIGrader` line.)

- [ ] **Step 3: Type-check passes**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 4: Manual smoke**

Run dev. Click 🎧 Listen. Confirm:
- The flip card disappears; a card with a 🔊 Play button and a text input appears.
- The "Audio unavailable" banner does NOT appear (we haven't wired error detection yet).
- The input is focused.
- Typing then pressing Enter does nothing (placeholder `check()` is a no-op).
- Clicking ← Flashcards returns to the flip card.

- [ ] **Step 5: Commit**

```bash
git add src/lib/ListeningCard.svelte src/lib/CardDeck.svelte
git commit -m "feat(ui): scaffold ListeningCard component and route in CardDeck"
```

---

## Task 7: Wire grading and reveal/advance

**Files:**
- Modify: `src/lib/ListeningCard.svelte` (replace the placeholder `check`, `skip`, `advance` functions)

- [ ] **Step 1: Replace the three placeholder functions**

`sessionMark` (`src/stores/session.ts:263`) increments `currentIndex` immediately, which would re-trigger `onCardChange` and wipe the reveal panel before the user reads it. So we **defer** `sessionMark` until the user explicitly presses Enter on the reveal panel (i.e., until `advance()` runs). `check()` and `skip()` only set local UI state.

In `src/lib/ListeningCard.svelte`, replace:

```ts
  async function check() {}
  async function skip() {}
  async function advance() {}
```

with:

```ts
  async function check() {
    if (!currentCard) return;
    if (typed.trim().length === 0) return; // empty submit is a no-op
    const ok = normalizeForListening(typed) === normalizeForListening(currentCard.pt);
    lastVerdict = ok ? 'right' : 'wrong';
    revealed = true;
    // Defer sessionMark until advance() so the reveal panel persists.
  }

  async function skip() {
    if (!currentCard) return;
    if (revealed) { advance(); return; }
    lastVerdict = 'wrong';
    revealed = true;
  }

  async function advance() {
    if (!currentCard || !revealed) return;
    const ok = lastVerdict === 'right';
    const card = currentCard;
    sessionMark(card, ok);
    if (!$generatedMode) await markCard(card, ok);
    // onCardChange() will reset typed/revealed/lastVerdict when the reactive
    // block fires for the new currentCard.
  }
```

- [ ] **Step 2: Type-check passes**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 3: Manual smoke**

Run dev. Enter listen mode. Type a known PT phrase, press Enter — reveal panel shows ✓ correct. Press Enter again — advances. Type wrong, press Enter — reveal shows ✗ try again. Press Enter — advances. Press Esc on a fresh card — reveal shows ✗.

- [ ] **Step 4: Commit**

```bash
git add src/lib/ListeningCard.svelte
git commit -m "feat(ui): wire listening-card grading, reveal panel, and advance"
```

---

## Task 8: Wire audio error UI (500 / 502 banners)

**Files:**
- Modify: `src/lib/ListeningCard.svelte`

- [ ] **Step 1: Detect error class via fetch HEAD on src change**

The `<audio>` element's `error` event fires on any failure but doesn't expose the HTTP status. To distinguish "missing key" (500) from "upstream error" (502) for the banner copy, do a side-channel HEAD/GET on the same URL when `error` fires.

In `src/lib/ListeningCard.svelte`, replace the existing `onAudioError` placeholder with:

```ts
  async function onAudioError() {
    if (!currentCard) return;
    try {
      const res = await fetch(ttsSrc, { method: 'GET' });
      if (res.status === 500) {
        const body = await res.json().catch(() => ({}));
        if (body && typeof body.error === 'string' && body.error.includes('ELEVENLABS_API_KEY')) {
          audioStatus = 'missing-key';
          return;
        }
      }
      audioStatus = 'upstream-error';
    } catch {
      audioStatus = 'upstream-error';
    }
  }
```

- [ ] **Step 2: Render the banner**

In the same component, immediately above the `<button … data-testid="listen-play">` block, add:

```svelte
    {#if audioStatus === 'missing-key'}
      <div class="audio-banner" data-testid="listen-audio-banner-missing">
        Audio unavailable — set <code>ELEVENLABS_API_KEY</code>
      </div>
    {:else if audioStatus === 'upstream-error'}
      <div class="audio-banner" data-testid="listen-audio-banner-error">
        Couldn't load audio — <button type="button" class="link" on:click={play}>retry</button>
      </div>
    {/if}
```

- [ ] **Step 3: Add minimal styles for the banner**

At the bottom of the `<script>` section's containing `.svelte` file, add a `<style>` block (or place at top of file's style area — Svelte components allow one `<style>` block per file):

```svelte
<style>
  .audio-banner {
    background: #fef3c7;
    color: #92400e;
    padding: 8px 12px;
    border-radius: 6px;
    margin-bottom: 12px;
    font-size: 0.9rem;
  }
  .audio-banner .link {
    background: none;
    border: none;
    color: inherit;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
  }
</style>
```

- [ ] **Step 4: Type-check passes**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 5: Manual smoke (with `ELEVENLABS_API_KEY` unset)**

Run dev with no API key. Enter listen mode. Audio fails; the "Audio unavailable" banner appears. Typing still works.

- [ ] **Step 6: Commit**

```bash
git add src/lib/ListeningCard.svelte
git commit -m "feat(ui): show banner when listening-mode audio is unavailable"
```

---

## Task 9: Playwright tests

**Files:**
- Create: `tests/listening.spec.js`

- [ ] **Step 1: Write the spec**

Write `tests/listening.spec.js`:

```js
const fs = require('fs');
const path = require('path');
const { test, expect } = require('@playwright/test');
const { resetAll } = require('./fixtures/reset');
const { loadTruth } = require('./fixtures/truth');
const { waitForSessionWrite } = require('./fixtures/waits');

const SILENT_MP3 = fs.readFileSync(path.join(__dirname, 'fixtures', 'silent.mp3'));

async function stubTtsOk(page) {
  await page.route('**/api/tts*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'audio/mpeg',
      body: SILENT_MP3,
    })
  );
}

async function stubTtsStatus(page, status, body) {
  await page.route('**/api/tts*', (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body || {}),
    })
  );
}

test.describe('Listening mode', () => {
  test.beforeEach(async ({ page }) => {
    await resetAll();
  });

  test('mode entry persists across reload', async ({ page }) => {
    await stubTtsOk(page);
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();

    await page.getByTestId('listen-enter').click();
    await expect(page.getByTestId('listening-card')).toBeVisible();
    await waitForSessionWrite(page);

    await page.reload();
    await expect(page.getByTestId('listening-card')).toBeVisible();
    await expect(page.getByTestId('listen-exit')).toBeVisible();
  });

  test('correct typed answer reveals ✓ and advances on Enter', async ({ page }) => {
    await stubTtsOk(page);
    const truth = await loadTruth();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();

    // Read the (still-rendered) flip front to know which card we're on.
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim() ?? '';
    const card = truth.getCardByPt(front);
    expect(card, `front "${front}" should be a known PT card`).toBeTruthy();

    await page.getByTestId('listen-enter').click();
    await expect(page.getByTestId('listening-card')).toBeVisible();

    await page.getByTestId('listen-input').fill(card.pt);
    await page.getByTestId('listen-input').press('Enter');

    await expect(page.getByTestId('listen-reveal')).toBeVisible();
    await expect(page.getByTestId('listen-verdict')).toContainText('✓');

    // Press Enter again to advance.
    await page.getByTestId('listen-input').press('Enter');
    await expect(page.getByTestId('listen-reveal')).toHaveCount(0);
    await expect(page.getByTestId('counter-correct')).toContainText('1');
  });

  test('wrong typed answer reveals ✗ and increments wrong counter', async ({ page }) => {
    await stubTtsOk(page);
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    await page.getByTestId('listen-enter').click();

    await page.getByTestId('listen-input').fill('definitely not a portuguese phrase xyzzy');
    await page.getByTestId('listen-input').press('Enter');
    await expect(page.getByTestId('listen-verdict')).toContainText('✗');

    await page.getByTestId('listen-input').press('Enter');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
  });

  test('grading is case/diacritic/punctuation insensitive', async ({ page }) => {
    await stubTtsOk(page);
    const truth = await loadTruth();

    // Find a seeded card whose PT contains diacritics or punctuation, so
    // the de-normalized version is meaningfully different.
    const card = truth.allCards.find(c => /[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ?!.,]/.test(c.pt));
    expect(card, 'expected at least one card with diacritics or punctuation').toBeTruthy();

    // Seed a session pinned to that card's category, then cycle deckOrder
    // until that card is first. Simpler: just walk through cards until we
    // see this one.
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    await page.getByTestId('listen-enter').click();

    // Seek by reading the back-of-flip text via session state — we can't
    // see card text in listen mode, so we walk by skipping. Skip until the
    // hidden currentIndex points at our target.
    // Simpler approach: poll /api/session.deckOrder until front matches.
    let safety = 200;
    while (safety-- > 0) {
      const session = await page.evaluate(async () => (await fetch('/api/session')).json());
      const ptAtIndex = session.deckOrder[session.currentIndex];
      if (ptAtIndex === card.pt) break;
      await page.getByTestId('listen-skip').click();
      await page.getByTestId('listen-input').press('Enter'); // advance past reveal
    }
    expect(safety).toBeGreaterThan(0);

    const stripped = card.pt
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[?!.,;:]/g, '')
      .trim();
    await page.getByTestId('listen-input').fill(stripped);
    await page.getByTestId('listen-input').press('Enter');
    await expect(page.getByTestId('listen-verdict')).toContainText('✓');
  });

  test('empty submit is a no-op', async ({ page }) => {
    await stubTtsOk(page);
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    await page.getByTestId('listen-enter').click();

    await expect(page.getByTestId('listen-check')).toBeDisabled();
    await page.getByTestId('listen-input').press('Enter'); // should do nothing
    await expect(page.getByTestId('listen-reveal')).toHaveCount(0);
    await expect(page.getByTestId('counter-correct')).toContainText('0');
    await expect(page.getByTestId('counter-wrong')).toContainText('0');
  });

  test('switching back to flashcards preserves deck position', async ({ page }) => {
    await stubTtsOk(page);
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();

    const beforeFront = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();

    await page.getByTestId('listen-enter').click();
    await expect(page.getByTestId('listening-card')).toBeVisible();
    await page.getByTestId('listen-exit').click();
    await expect(page.getByTestId('card-container')).toBeVisible();

    const afterFront = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim();
    expect(afterFront).toBe(beforeFront);
  });

  test('500 from /api/tts shows missing-key banner; typing still works', async ({ page }) => {
    await stubTtsStatus(page, 500, { error: 'ELEVENLABS_API_KEY not configured on server' });
    const truth = await loadTruth();
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    const front = (await page.getByTestId('card-front').locator('.card-word').textContent())?.trim() ?? '';
    const card = truth.getCardByPt(front);
    expect(card).toBeTruthy();

    await page.getByTestId('listen-enter').click();
    await expect(page.getByTestId('listen-audio-banner-missing')).toBeVisible();

    await page.getByTestId('listen-input').fill(card.pt);
    await page.getByTestId('listen-input').press('Enter');
    await expect(page.getByTestId('listen-verdict')).toContainText('✓');
  });

  test('502 from /api/tts shows upstream-error banner', async ({ page }) => {
    await stubTtsStatus(page, 502, { error: 'ElevenLabs returned 401' });
    await page.goto('/');
    await expect(page.getByTestId('card-container')).toBeVisible();
    await page.getByTestId('listen-enter').click();

    await expect(page.getByTestId('listen-audio-banner-error')).toBeVisible();
  });
});
```

- [ ] **Step 2: Run only the new spec first**

Bring up the test DB and run:

```bash
docker compose -f docker-compose.test.yml up -d --wait
npm run build
npx playwright test tests/listening.spec.js --project=chromium --reporter=list
```

Expected: all 8 tests pass. Common failure modes and fixes:

- **"audio.play()" rejection still fires on stubbed route:** the `play()` call is inside `try { await audioEl.play(); } catch { }` so this should be fine. If you see it surfacing, double-check the catch is there.
- **"front" reads empty string when listen mode is active:** that's by design — this only happens in tests that switch *into* listen mode after first reading the flip front. Re-order the test to read `front` *before* clicking `listen-enter`.
- **Diacritic test loop times out:** widen the regex in the test to find any card that needs normalization, or just type the un-normalized form and assert it grades correct (don't bother exhaustively walking the deck; pick the first 5 cards and try whichever has diacritics).
- **"missing-key banner" doesn't appear:** confirm the 500 stub has `body.error` containing the literal string `ELEVENLABS_API_KEY`. The `onAudioError` matcher requires that substring.

- [ ] **Step 3: Commit**

```bash
git add tests/listening.spec.js
git commit -m "test: add listening-mode Playwright suite"
```

---

## Task 10: Run the full test suite

This is the verification gate. The user explicitly required all tests pass at the end.

- [ ] **Step 1: Run the full suite**

Run: `npm test`

Expected: every existing spec plus `listening.spec.js` passes across both `chromium` and `mobile` projects. The mobile project ignores `listening.spec.js` (it lives outside `mobile.spec.js` / `mobile-swipe.spec.js`), so mobile coverage is implicit via the Listen button being a no-op no-show on mobile in v1 — that's intentional per the spec's non-goals (no listed mobile-specific tests).

- [ ] **Step 2: If any test fails**

Investigate. Likely culprits:

1. **`type-mode.spec.js`** — Type Mode toggle still expects `data-testid="mode-toggle"` to be visible at startup. The new ControlButtons logic still renders `mode-toggle` when not in listen mode, so this should pass. If it fails, double-check Task 5 step 2's else branch.
2. **`mode.spec.js`** — same as above; relies on `mode-toggle` existing in the default state.
3. **`generated-mode.spec.js` / `sentence-grader.spec.js`** — these don't interact with listen mode and should be unaffected.
4. **`mobile.spec.js`** — currently doesn't reference listen mode. Should be unaffected.

If `mode-toggle` is missing in the default state, the conditional in Task 5 was inverted; verify the `{#if $session.mode === 'listen-to-pt'}` branch matches the spec.

- [ ] **Step 3: Final commit (if any fixes were needed)**

If you modified anything to make the suite pass:

```bash
git add -A
git commit -m "fix: resolve test failures introduced by listening mode"
```

If nothing needed fixing, no commit needed for this task.

- [ ] **Step 4: Update CLAUDE.md to mention the new mode**

Append a line to `CLAUDE.md` under the Architecture section's "Modes" paragraph (last sentence currently ends "...used while in Generated Mode."):

```markdown
- A third mode value `listen-to-pt` activates Listening Mode: `<ListeningCard>` replaces the flip card, audio comes from `/api/tts` (ElevenLabs proxy, no caching), and answers are graded with `normalizeForListening` (case/diacritic/punctuation-insensitive).
```

Commit:

```bash
git add CLAUDE.md
git commit -m "docs: note listen-to-pt mode in CLAUDE.md"
```

- [ ] **Step 5: Report completion**

Report to user: tests passing, key files touched, and the env var they need to set (`ELEVENLABS_API_KEY`) before deploying. Mention `fly secrets set ELEVENLABS_API_KEY=...` for the production deploy.

---

## Notes for the implementer

- **Don't pre-test the real ElevenLabs endpoint.** All tests use `page.route` stubs. Manual verification with a real key is the user's job after the suite passes.
- **The default voice ID `FGY2WhTYpPnrIDTdsKH5`** is "Camila" from ElevenLabs' multilingual library at the time of writing. If at runtime ElevenLabs returns 404 for this voice ID, override with `ELEVENLABS_VOICE_ID=<some-other-pt-BR-voice>` env var. No code change needed.
- **Why we didn't add unit tests** for `normalizeForListening` or `setMode`: this project has no Vitest/Jest/etc. configured. Adding a unit-test runner is scope creep; the Playwright suite covers grading via test #4 (case/diacritic insensitivity).
- **Why the mobile project ignores `listening.spec.js`:** by Playwright config's `testIgnore` rules (`mobile.spec.js` and `mobile-swipe.spec.js` only). Listening mode works on mobile (the same `<ControlButtons>` is rendered through the BottomSheet), but explicit mobile coverage is out of scope per the spec's non-goals.
