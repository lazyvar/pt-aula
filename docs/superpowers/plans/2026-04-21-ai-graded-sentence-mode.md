# AI-Graded Sentence Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a new `POST /api/grade-sentence` endpoint and `SentenceGrader` UI so that generated sentences in en→pt mode are graded by Claude Haiku on a 1–3 rubric (with concrete mistake list + teaching rule) instead of exact-match comparison.

**Architecture:** Server endpoint mirrors existing `/api/generate-sentences` pattern (Haiku call + markdown-fence stripping + strict JSON). Frontend adds a dedicated `src/stores/grader.ts` plus a `SentenceGrader.svelte` component that `CardDeck.svelte` conditionally mounts when `generatedMode && mode==='en-to-pt' && card.cat===GENERATED_CAT`. All other paths (pt→en in gen mode, seed cards in type mode, flip-and-mark) stay unchanged.

**Tech Stack:** Express, pg, Anthropic SDK (Node), Svelte 4 + TypeScript, Playwright.

**Spec:** `docs/superpowers/specs/2026-04-21-ai-graded-sentence-mode-design.md`

---

## File Structure

| File | Role | Action |
| --- | --- | --- |
| `server.js` | Add `POST /api/grade-sentence` endpoint | Modify |
| `src/types.ts` | Add `GradeResponse` type | Modify |
| `src/stores/grader.ts` | State machine + submit/giveUp/reset helpers | Create |
| `src/lib/SentenceGrader.svelte` | Grader UI (idle / grading / graded) | Create |
| `src/lib/CardDeck.svelte` | Mount `SentenceGrader` conditionally | Modify |
| `tests/sentence-grader.spec.js` | Playwright coverage | Create |

---

## Task 1: Backend endpoint — validation paths

**Files:**
- Modify: `server.js` (add new endpoint after `/api/generate-conjugations` block, around line 434)
- Test: `tests/sentence-grader.spec.js`

- [ ] **Step 1.1: Write failing test for 400 on missing fields**

Create `tests/sentence-grader.spec.js`:

```javascript
// tests/sentence-grader.spec.js
const { test, expect } = require('@playwright/test');
const { BASE } = require('./fixtures/truth');

test.describe('POST /api/grade-sentence — server validation', () => {
  test('400 when body is missing fields', async () => {
    const res = await fetch(`${BASE}/api/grade-sentence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ en: 'hi' }),  // missing userPt, referencePt
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/en|userPt|referencePt/);
  });

  test('400 when any field is not a string', async () => {
    const res = await fetch(`${BASE}/api/grade-sentence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ en: 'hi', userPt: 123, referencePt: 'ola' }),
    });
    expect(res.status).toBe(400);
  });

  test('500 when ANTHROPIC_API_KEY is not configured', async () => {
    // The test harness runs server.js without ANTHROPIC_API_KEY set, so a
    // well-formed request falls through to the env check.
    const res = await fetch(`${BASE}/api/grade-sentence`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ en: 'hi', userPt: 'oi', referencePt: 'oi' }),
    });
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toMatch(/ANTHROPIC_API_KEY/);
  });
});
```

Also verify `BASE` is exported from `tests/fixtures/truth.js`:

- [ ] **Step 1.2: Check `BASE` export**

Run: `grep -n "BASE" tests/fixtures/truth.js`
Expected: line showing `const BASE` and `module.exports` containing `BASE`. If `BASE` is not exported from `truth.js`, import from `tests/fixtures/reset.js` instead:
```javascript
const { BASE } = require('./fixtures/reset');
```
Update the test file accordingly.

- [ ] **Step 1.3: Run the test to verify it fails**

Run: `npx playwright test tests/sentence-grader.spec.js --project=chromium`
Expected: FAIL — endpoint returns 404 (route not defined).

- [ ] **Step 1.4: Implement the endpoint (validation only)**

In `server.js`, add this block after the `/api/generate-conjugations` handler (before `/api/cards`):

```javascript
// POST /api/grade-sentence — body: { en, userPt, referencePt }
// Returns { grade: 1|2|3, summary, mistakes: string[], rule: string|null }
app.post("/api/grade-sentence", async (req, res) => {
  const { en, userPt, referencePt } = req.body || {};
  if (typeof en !== "string" || typeof userPt !== "string" || typeof referencePt !== "string") {
    return res.status(400).json({ error: "en, userPt, referencePt are required strings" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured on server" });
  }

  // AI call added in the next task.
  return res.status(501).json({ error: "not implemented" });
});
```

- [ ] **Step 1.5: Run the validation tests to verify they pass**

Run: `npx playwright test tests/sentence-grader.spec.js --project=chromium`
Expected: PASS for the three validation tests.

- [ ] **Step 1.6: Commit**

```bash
git add server.js tests/sentence-grader.spec.js
git commit -m "feat(server): /api/grade-sentence validation paths"
```

---

## Task 2: Backend endpoint — AI grading

**Files:**
- Modify: `server.js` (replace the `501 not implemented` placeholder with the Haiku call)

- [ ] **Step 2.1: Replace placeholder with Haiku call**

In `server.js`, replace the final `return res.status(501).json(...)` line in `/api/grade-sentence` with:

```javascript
  try {
    const prompt = `You are grading a Brazilian Portuguese translation produced by an intermediate learner.

English prompt:
${en}

Reference translation (known-good):
${referencePt}

Learner's translation:
${userPt}

Grade on a 1–3 scale:
- 3 = near-perfect: at most 1 minor mistake.
- 2 = understandable but flawed: 2–3 mistakes.
- 1 = failing: 4+ mistakes, or meaning lost.

Pay special attention to these common mistake classes:
- Article gender (o/a/os/as)
- Contractions: de + o/a → do/da; em + o/a → no/na; a + a → à (crase)
- Missing or incorrect connectors (para, que, de)
- Verb tense and conjugation
- Word order and agreement

For each concrete mistake, name the error and show the fix in a short bullet.

When grade is 1 or 2, include a "rule" field: a short, memorable rule the learner can apply next time (e.g. "de + o = do, de + a = da — always contract when 'de' meets a definite article"). When grade is 3, set "rule" to null.

The "mistakes" array should be empty when grade is 3.

Return STRICT JSON only, no prose, no markdown fence:
{"grade":1|2|3,"summary":"one short sentence","mistakes":["..."],"rule":"..."|null}`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 800,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });

    let text = response.content[0].text.trim();
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("Grade: failed to parse Claude response:", text);
      return res.status(502).json({ error: "Claude returned malformed JSON" });
    }

    const grade = parsed && parsed.grade;
    if (grade !== 1 && grade !== 2 && grade !== 3) {
      return res.status(502).json({ error: "Claude response missing or invalid grade" });
    }

    const mistakes = Array.isArray(parsed.mistakes)
      ? parsed.mistakes.filter((m) => typeof m === "string")
      : [];
    const summary = typeof parsed.summary === "string" ? parsed.summary : "";
    const rule = typeof parsed.rule === "string" ? parsed.rule : null;

    res.json({ grade, summary, mistakes, rule });
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    console.error("Grade failed:", msg);
    res.status(502).json({ error: msg });
  }
```

- [ ] **Step 2.2: Run validation tests — still pass**

Run: `npx playwright test tests/sentence-grader.spec.js --project=chromium`
Expected: PASS for the three validation tests (they don't hit the AI path since no API key in the test env).

- [ ] **Step 2.3: Commit**

```bash
git add server.js
git commit -m "feat(server): /api/grade-sentence Haiku grading"
```

---

## Task 3: Types + grader store

**Files:**
- Modify: `src/types.ts`
- Create: `src/stores/grader.ts`

- [ ] **Step 3.1: Add `GradeResponse` type**

In `src/types.ts`, append before the final `export const GENERATED_CAT`:

```typescript
export type Grade = 1 | 2 | 3;

export interface GradeResponse {
  grade: Grade;
  summary: string;
  mistakes: string[];
  rule: string | null;
}

export type GraderState = 'idle' | 'grading' | 'graded';
```

- [ ] **Step 3.2: Run typecheck to confirm no regressions**

Run: `npm run check`
Expected: 0 errors, 0 warnings (or unchanged from baseline).

- [ ] **Step 3.3: Create the grader store**

Create `src/stores/grader.ts`:

```typescript
// src/stores/grader.ts
import { writable, get } from 'svelte/store';
import type { Card, GradeResponse, GraderState } from '../types';

export const graderState = writable<GraderState>('idle');
export const graderResult = writable<GradeResponse | null>(null);
export const graderInput = writable<string>('');
export const graderError = writable<string | null>(null);

/**
 * Submit the user's translation to the server for AI grading.
 * Resolves with the grade (1-3) once state transitions to 'graded'.
 * On network/parse error, state returns to 'idle' and graderError is set.
 */
export async function submit(card: Card): Promise<void> {
  if (get(graderState) !== 'idle') return;
  const userPt = get(graderInput).trim();
  if (!userPt) return;

  graderState.set('grading');
  graderError.set(null);
  try {
    const res = await fetch('/api/grade-sentence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ en: card.en, userPt, referencePt: card.pt }),
    });
    const data = await res.json() as GradeResponse | { error?: string };
    if (!res.ok || !('grade' in data)) {
      graderError.set((data as { error?: string }).error || 'Grading failed');
      graderState.set('idle');
      return;
    }
    graderResult.set(data);
    graderState.set('graded');
  } catch (err) {
    graderError.set(err instanceof Error ? err.message : String(err));
    graderState.set('idle');
  }
}

/**
 * Skip the network call: treat as a grade-1 with the reference shown.
 */
export function giveUp(): void {
  if (get(graderState) !== 'idle') return;
  graderResult.set({
    grade: 1,
    summary: 'Skipped — see the reference translation.',
    mistakes: [],
    rule: null,
  });
  graderState.set('graded');
}

/**
 * Reset to idle for the next card.
 */
export function reset(): void {
  graderState.set('idle');
  graderResult.set(null);
  graderInput.set('');
  graderError.set(null);
}
```

- [ ] **Step 3.4: Run typecheck again**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 3.5: Commit**

```bash
git add src/types.ts src/stores/grader.ts
git commit -m "feat(stores): grader state + submit/giveUp/reset"
```

---

## Task 4: `SentenceGrader.svelte` component

**Files:**
- Create: `src/lib/SentenceGrader.svelte`

- [ ] **Step 4.1: Scaffold the component**

Create `src/lib/SentenceGrader.svelte`:

```svelte
<script lang="ts">
  import { graderState, graderResult, graderInput, graderError, submit, giveUp, reset } from '../stores/grader';
  import { catConfig } from '../stores/cards';
  import type { Card } from '../types';

  export let card: Card;
  export let onAdvance: (gotIt: boolean) => void;

  // Reset when card identity changes (new card shown).
  let lastPt: string | undefined;
  $: if (card && card.pt !== lastPt) {
    lastPt = card.pt;
    reset();
  }

  $: cc = $catConfig[card.cat] || { cls: 'cat-generated', label: '✨ Generated', group: '' };

  async function onSubmit() {
    await submit(card);
  }

  function onGiveUp() {
    giveUp();
  }

  function onNext() {
    if (!$graderResult) return;
    const gotIt = $graderResult.grade >= 2;
    onAdvance(gotIt);
  }

  function onInputKeydown(e: KeyboardEvent) {
    // Cmd/Ctrl+Enter submits from a textarea. Plain Enter inserts a newline
    // so longer sentences aren't accidentally submitted mid-thought.
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      onSubmit();
    }
  }

  function onPageKeydown(e: KeyboardEvent) {
    if ($graderState === 'graded' && e.key === 'Enter') {
      e.preventDefault();
      onNext();
    }
  }
</script>

<svelte:window on:keydown={onPageKeydown} />

<div class="grader" data-testid="sentence-grader">
  <div class="card grader-card">
    <span class="category-tag {cc.cls}">{cc.label}</span>
    <div class="card-label">English</div>
    <div class="card-word" data-testid="grader-prompt">{card.en}</div>
  </div>

  {#if $graderState === 'idle'}
    <textarea
      class="grader-input"
      data-testid="grader-input"
      placeholder="Type the Portuguese translation…"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      rows="3"
      bind:value={$graderInput}
      on:keydown={onInputKeydown}
    ></textarea>
    {#if $graderError}
      <div class="grader-error" data-testid="grader-error">{$graderError}</div>
    {/if}
    <div class="grader-actions">
      <button
        class="btn btn-right"
        data-testid="grader-submit"
        on:click={onSubmit}
        disabled={!$graderInput.trim()}
      >Submit</button>
      <button
        class="btn btn-wrong"
        data-testid="grader-giveup"
        on:click={onGiveUp}
      >Give up</button>
    </div>
    <div class="keyboard-hint">Cmd/Ctrl+Enter to submit</div>
  {:else if $graderState === 'grading'}
    <div class="grader-loading" data-testid="grader-loading">Grading…</div>
  {:else if $graderResult}
    <div class="grader-verdict" data-testid="grader-verdict">
      <div class="grader-grade grade-{$graderResult.grade}" data-testid="grader-grade">
        {$graderResult.grade}/3
      </div>
      <div class="grader-summary">{$graderResult.summary}</div>
    </div>

    <div class="grader-reference" data-testid="grader-reference">
      <div class="card-label">Reference</div>
      <div class="card-word">{card.pt}</div>
    </div>

    {#if $graderResult.mistakes.length > 0}
      <ul class="grader-mistakes" data-testid="grader-mistakes">
        {#each $graderResult.mistakes as m}
          <li>{m}</li>
        {/each}
      </ul>
    {/if}

    {#if $graderResult.rule}
      <div class="grader-rule" data-testid="grader-rule">
        <strong>Rule:</strong> {$graderResult.rule}
      </div>
    {/if}

    <button class="btn btn-right" data-testid="grader-next" on:click={onNext}>Next →</button>
    <div class="keyboard-hint">Enter = next card</div>
  {/if}
</div>

<style>
  .grader {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
  }
  .grader-card {
    padding: 16px;
    border-radius: 12px;
    background: var(--card-bg, #1f2937);
  }
  .grader-input {
    width: 100%;
    padding: 10px 12px;
    font-size: 1rem;
    border-radius: 8px;
    border: 1px solid var(--border, #374151);
    background: var(--input-bg, #111827);
    color: inherit;
    resize: vertical;
    font-family: inherit;
  }
  .grader-actions {
    display: flex;
    gap: 8px;
  }
  .grader-verdict {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .grader-grade {
    font-size: 2rem;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 8px;
  }
  .grade-3 { background: #10b981; color: white; }
  .grade-2 { background: #f59e0b; color: white; }
  .grade-1 { background: #ef4444; color: white; }
  .grader-summary { flex: 1; font-size: 0.95rem; }
  .grader-reference {
    padding: 12px;
    border-radius: 8px;
    background: var(--card-bg, #1f2937);
  }
  .grader-mistakes {
    margin: 0;
    padding-left: 20px;
    font-size: 0.9rem;
  }
  .grader-mistakes li { margin: 4px 0; }
  .grader-rule {
    padding: 10px 12px;
    border-radius: 8px;
    background: var(--accent-bg, #1e3a8a);
    font-size: 0.9rem;
    line-height: 1.4;
  }
  .grader-loading {
    padding: 20px;
    text-align: center;
    color: var(--text-dim, #9ca3af);
  }
  .grader-error {
    color: #ef4444;
    font-size: 0.85rem;
  }
</style>
```

- [ ] **Step 4.2: Run typecheck**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 4.3: Commit**

```bash
git add src/lib/SentenceGrader.svelte
git commit -m "feat(ui): SentenceGrader component"
```

---

## Task 5: Wire `SentenceGrader` into `CardDeck`

**Files:**
- Modify: `src/lib/CardDeck.svelte`

- [ ] **Step 5.1: Import `SentenceGrader` and `GENERATED_CAT`**

In `src/lib/CardDeck.svelte`, after the existing imports (around line 7), add:

```typescript
  import SentenceGrader from './SentenceGrader.svelte';
  import { GENERATED_CAT } from '../types';
```

- [ ] **Step 5.2: Add the gating reactive declaration**

In the `<script>` block, after `$: typingActive = $session.typeMode && !isMobile;` (around line 28), add:

```typescript
  $: useAIGrader =
    $generatedMode &&
    $session.mode === 'en-to-pt' &&
    currentCard?.cat === GENERATED_CAT;
```

- [ ] **Step 5.3: Render grader branch in template**

In `src/lib/CardDeck.svelte` template, replace the entire `<div class="card-area">…</div>` block (roughly lines 210–268) with:

```svelte
<div class="card-area">
  {#if useAIGrader && currentCard}
    <SentenceGrader
      card={currentCard}
      onAdvance={(gotIt) => mark(gotIt)}
    />
  {:else}
    <div
      class="card-container"
      id="cardContainer"
      data-testid="card-container"
      bind:this={containerEl}
      on:click={flipCard}
      on:keydown={(e) => e.key === 'Enter' && flipCard()}
      role="button"
      tabindex="0"
    >
      <div class="card {isFlipped ? 'flipped' : ''}" id="theCard" bind:this={cardEl}>
        <div class="card-face card-front" data-testid="card-front">
          {#if cc}<span class="category-tag {cc.cls}">{cc.label}</span>{/if}
          <div class="card-label">{frontLabel}</div>
          <div class="card-word">{front}</div>
          {#if showCardStats}
            <div style="font-size:0.7rem;color:var(--text-dim);margin-top:8px">
              {cardStats.right}&#10003; {cardStats.wrong}&#10007;
            </div>
          {/if}
        </div>
        <div class="card-face card-back" data-testid="card-back">
          {#if cc}<span class="category-tag {cc.cls}">{cc.label}</span>{/if}
          <div class="card-label">{backLabel}</div>
          <div class="card-word">{back}</div>
          {#if showCardStats}
            <div style="font-size:0.7rem;color:var(--text-dim);margin-top:8px">
              {cardStats.right}&#10003; {cardStats.wrong}&#10007;
            </div>
          {/if}
        </div>
      </div>
    </div>

    {#if typingActive}
      <div class="type-row">
        <input
          class="type-input"
          data-testid="type-input"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="Type the {backLabel.toLowerCase()} answer…"
          bind:value={typedAnswer}
          on:keydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); checkTypedAnswer(); } }}
        />
        <button class="btn btn-right" data-testid="type-check" on:click={checkTypedAnswer}>Check</button>
      </div>
      <div class="keyboard-hint">Type the answer · Enter to check</div>
    {:else}
      <div class="buttons">
        <button class="btn btn-wrong" data-testid="btn-wrong" on:click={() => mark(false)}>✗ Again</button>
        <button class="btn btn-right" data-testid="btn-right" on:click={() => mark(true)}>✓ Got it</button>
      </div>
      <div class="keyboard-hint">Space/←/→ = flip · Enter = got it · Delete = again</div>
    {/if}
  {/if}
</div>
```

- [ ] **Step 5.4: Suppress keyboard hijack when grader is active**

In `handleKeydown`, add a guard after the existing `typingActive` guard (around line 178):

```typescript
  export function handleKeydown(e: KeyboardEvent) {
    if (!currentCard) return;
    if (typingActive) return;
    if (useAIGrader) return;  // grader owns keyboard via its own svelte:window
    // ...existing space/enter/backspace handling
  }
```

- [ ] **Step 5.5: Run typecheck**

Run: `npm run check`
Expected: PASS.

- [ ] **Step 5.6: Smoke-test manually (optional but useful)**

Run: `npm run dev` in one shell, `npm start` with a local `DATABASE_URL` + `ANTHROPIC_API_KEY` in another. Open the app, click ✨ Sentences, toggle to en→pt, confirm the grader UI appears. Type + Submit should hit the real endpoint.

- [ ] **Step 5.7: Commit**

```bash
git add src/lib/CardDeck.svelte
git commit -m "feat(ui): mount SentenceGrader in generated en-to-pt mode"
```

---

## Task 6: End-to-end Playwright coverage

**Files:**
- Modify: `tests/sentence-grader.spec.js` (append new describe block)

- [ ] **Step 6.1: Add the end-to-end describe block**

Append to `tests/sentence-grader.spec.js` (after the existing server-validation describe):

```javascript
const { resetAll } = require('./fixtures/reset');

const MOCK_SENTENCES = Array.from({ length: 20 }, (_, i) => ({
  pt: `Eu fui à loja ${i + 1}.`,
  en: `I went to the store ${i + 1}.`,
}));

function gradeStub(grade, overrides = {}) {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      grade,
      summary: overrides.summary ?? `Grade ${grade} summary`,
      mistakes: overrides.mistakes ?? (grade === 3 ? [] : ['Mistake A', 'Mistake B']),
      rule: overrides.rule ?? (grade === 3 ? null : 'Remember: de + a = da.'),
    }),
  };
}

async function enterGeneratedEnToPt(page) {
  // Intercept sentence generation with deterministic cards.
  await page.route('**/api/generate-sentences', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ cards: MOCK_SENTENCES }),
    });
  });
  await page.goto('/');
  await expect(page.getByTestId('card-container')).toBeVisible();

  // Flip to en→pt. The mode toggle is in the sidebar on desktop.
  const modeToggle = page.getByTestId('mode-toggle').first();
  if ((await modeToggle.getAttribute('data-mode')) !== 'en-to-pt') {
    await modeToggle.click();
  }

  await page.getByRole('button', { name: '✨ Sentences', exact: true }).first().click();
  await expect(page.getByText(/Generated Mode/)).toBeVisible();
}

test.describe('Sentence Grader (en→pt)', () => {
  test.beforeEach(async () => {
    await resetAll();
  });

  test('grader UI renders in generated en→pt mode', async ({ page }) => {
    await enterGeneratedEnToPt(page);
    await expect(page.getByTestId('sentence-grader')).toBeVisible();
    await expect(page.getByTestId('grader-input')).toBeVisible();
    await expect(page.getByTestId('grader-submit')).toBeVisible();
    await expect(page.getByTestId('grader-giveup')).toBeVisible();
    // The legacy flip card should NOT be rendered in this branch.
    await expect(page.getByTestId('card-container')).toHaveCount(0);
  });

  test('submitting shows grading state, then verdict', async ({ page }) => {
    let release;
    const gate = new Promise((r) => { release = r; });
    await page.route('**/api/grade-sentence', async (route) => {
      await gate;
      await route.fulfill(gradeStub(2));
    });

    await enterGeneratedEnToPt(page);
    await page.getByTestId('grader-input').fill('Eu fui no loja 1.');
    await page.getByTestId('grader-submit').click();
    await expect(page.getByTestId('grader-loading')).toBeVisible();

    release();
    await expect(page.getByTestId('grader-verdict')).toBeVisible();
    await expect(page.getByTestId('grader-grade')).toContainText('2/3');
    await expect(page.getByTestId('grader-mistakes')).toBeVisible();
    await expect(page.getByTestId('grader-rule')).toContainText('de + a');
    await expect(page.getByTestId('grader-reference')).toContainText('Eu fui à loja');
  });

  test('grade 3 and grade 2 increment correct; grade 1 increments wrong', async ({ page }) => {
    let nextGrade = 3;
    await page.route('**/api/grade-sentence', async (route) => {
      await route.fulfill(gradeStub(nextGrade));
    });

    await enterGeneratedEnToPt(page);

    // Card 1 — grade 3
    nextGrade = 3;
    await page.getByTestId('grader-input').fill('x');
    await page.getByTestId('grader-submit').click();
    await expect(page.getByTestId('grader-grade')).toContainText('3/3');
    await page.getByTestId('grader-next').click();
    await expect(page.getByTestId('counter-correct')).toContainText('1');
    await expect(page.getByTestId('counter-wrong')).toContainText('0');

    // Card 2 — grade 2
    nextGrade = 2;
    await page.getByTestId('grader-input').fill('x');
    await page.getByTestId('grader-submit').click();
    await expect(page.getByTestId('grader-grade')).toContainText('2/3');
    await page.getByTestId('grader-next').click();
    await expect(page.getByTestId('counter-correct')).toContainText('2');
    await expect(page.getByTestId('counter-wrong')).toContainText('0');

    // Card 3 — grade 1
    nextGrade = 1;
    await page.getByTestId('grader-input').fill('x');
    await page.getByTestId('grader-submit').click();
    await expect(page.getByTestId('grader-grade')).toContainText('1/3');
    await page.getByTestId('grader-next').click();
    await expect(page.getByTestId('counter-correct')).toContainText('2');
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
  });

  test('Enter key in graded state advances', async ({ page }) => {
    await page.route('**/api/grade-sentence', async (route) => {
      await route.fulfill(gradeStub(3));
    });
    await enterGeneratedEnToPt(page);
    await page.getByTestId('grader-input').fill('x');
    await page.getByTestId('grader-submit').click();
    await expect(page.getByTestId('grader-grade')).toContainText('3/3');
    await page.keyboard.press('Enter');
    await expect(page.getByTestId('counter-correct')).toContainText('1');
    // Grader resets for next card.
    await expect(page.getByTestId('grader-input')).toHaveValue('');
  });

  test('give up reveals reference, marks wrong, does not call /api/grade-sentence', async ({ page }) => {
    let graderCalled = false;
    await page.route('**/api/grade-sentence', async (route) => {
      graderCalled = true;
      await route.fulfill(gradeStub(3));
    });
    await enterGeneratedEnToPt(page);
    await page.getByTestId('grader-giveup').click();
    await expect(page.getByTestId('grader-grade')).toContainText('1/3');
    await expect(page.getByTestId('grader-reference')).toContainText('Eu fui à loja');
    expect(graderCalled).toBe(false);
    await page.getByTestId('grader-next').click();
    await expect(page.getByTestId('counter-wrong')).toContainText('1');
  });

  test('toggling to pt→en mid-deck swaps back to flip UI; toggling back restores grader', async ({ page }) => {
    await enterGeneratedEnToPt(page);
    await expect(page.getByTestId('sentence-grader')).toBeVisible();

    // Flip to pt→en — flip card returns.
    await page.getByTestId('mode-toggle').first().click();
    await expect(page.getByTestId('card-container')).toBeVisible();
    await expect(page.getByTestId('sentence-grader')).toHaveCount(0);

    // Flip back.
    await page.getByTestId('mode-toggle').first().click();
    await expect(page.getByTestId('sentence-grader')).toBeVisible();
  });
});
```

- [ ] **Step 6.2: Verify `data-testid="mode-toggle"` exists**

Run: `grep -rn "data-testid=\"mode-toggle\"" src/`
Expected: at least one match in `src/lib/Sidebar.svelte` or similar. If the existing toggle has no such testid, find the actual selector by inspecting `src/lib/Sidebar.svelte` and `src/lib/ControlButtons.svelte`:

Run: `grep -rn "pt-to-en\|en-to-pt" src/lib/`

Then update the `enterGeneratedEnToPt` helper to click whatever selector is actually used (e.g. `getByRole('button', { name: /Direction|Mode/ })`). If you need to add a testid, do it in a tiny separate commit: add `data-testid="mode-toggle"` and `data-mode={mode}` to the existing button, commit, then continue.

- [ ] **Step 6.3: Run the new spec**

Run: `npx playwright test tests/sentence-grader.spec.js --project=chromium`
Expected: all tests PASS.

- [ ] **Step 6.4: Run the full suite to catch regressions**

Run: `npm test`
Expected: all existing specs still pass (`generated-mode`, `type-mode`, `session`, etc.).

- [ ] **Step 6.5: Commit**

```bash
git add tests/sentence-grader.spec.js
git commit -m "test(playwright): sentence grader end-to-end coverage"
```

---

## Task 7: Final verification

- [ ] **Step 7.1: Re-run full test suite**

Run: `npm test`
Expected: 0 failures across chromium + mobile projects.

- [ ] **Step 7.2: Typecheck**

Run: `npm run check`
Expected: 0 errors.

- [ ] **Step 7.3: Production build**

Run: `npm run build`
Expected: clean Vite build with no errors.

- [ ] **Step 7.4: Summarize to user**

Report: endpoint added, grader UI live in generated en→pt mode, Playwright coverage green, full suite passing.

---

## Self-Review

**Spec coverage:**
- Scope (sentences only, conjugations untouched) — Tasks 1–2 only add `/api/grade-sentence`; no changes to `/api/generate-conjugations`. ✅
- Direction toggle behavior — Task 5 Step 5.2 gates grader on `mode === 'en-to-pt'`; Task 6 covers the toggle swap. ✅
- State machine (idle/grading/graded) — Task 3 store + Task 4 component template. ✅
- Grade 3/2 = correct, 1 = wrong — Task 4 `onNext` computes `gotIt = grade >= 2`; Task 6 asserts counters. ✅
- Give up → grade 1 + no fetch — Task 3 `giveUp`; Task 6 asserts `graderCalled === false`. ✅
- Stats not touched — Task 4 calls `mark` via `onAdvance`, which in `CardDeck` only runs `sessionMark` + the existing `if (!$generatedMode)` stats guard. No new code path writes stats. ✅
- API shape (en/userPt/referencePt → grade/summary/mistakes/rule) — Task 1 validation + Task 2 AI call match exactly. ✅
- Server validation (400/500/502) — Task 1 tests + implementation. ✅
- Mobile works — Task 4 component has visible Submit/Next buttons; no isMobile guard added. ✅

**Placeholder scan:** No TBDs, every step has code or exact commands. Step 6.2 acknowledges possible selector mismatch with a concrete investigation command; not a placeholder.

**Type consistency:** `GradeResponse`, `Grade`, `GraderState` defined in Task 3 and used consistently in Task 3 store and Task 4 component. `onAdvance: (gotIt: boolean) => void` signature matches between Task 4 prop declaration and Task 5 usage.
