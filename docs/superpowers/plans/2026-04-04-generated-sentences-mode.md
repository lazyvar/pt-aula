# Generated Sentences Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Generated Mode" to pt-aula that calls the Claude API to produce 20 ephemeral Brazilian Portuguese translation flashcards built from the user's currently active Verb and Topic categories.

**Architecture:** New server endpoint `POST /api/generate-sentences` reads active categories from the body, queries the DB for verbs + topic vocab, asks `claude-haiku-4-5` for 20 sentences, returns them as `{cards:[{pt,en}]}`. Frontend adds a Generate button, swaps the in-memory `deck` to generated cards, shows an exit banner, and suppresses stats/session writes while active.

**Tech Stack:** Node.js + Express, Postgres (`pg`), `@anthropic-ai/sdk`, vanilla HTML/JS frontend. No build step, no test framework (consistent with existing project — see CLAUDE.md).

**Testing approach:** This repo has no test framework configured. Per project convention, each task is verified manually via `curl` and browser smoke testing. Do NOT add a test framework.

**Spec:** `docs/superpowers/specs/2026-04-04-generated-sentences-mode-design.md`

---

## File Structure

- **Modify** `package.json` — add `@anthropic-ai/sdk` dependency (Task 1)
- **Modify** `server.js` — add `POST /api/generate-sentences` handler (Task 2)
- **Modify** `public/index.html` — add Generate button, CSS, state vars, fetch logic, banner, stats/session suppression, sidebar disable (Tasks 3-7)

No new files. The server handler fits alongside existing handlers; frontend state and handlers fit alongside existing ones.

---

## Task 1: Add @anthropic-ai/sdk dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install the SDK**

Run:
```bash
npm install @anthropic-ai/sdk
```

Expected: `package.json` and `package-lock.json` updated with the new dependency. No errors.

- [ ] **Step 2: Verify package.json**

Read `package.json` and confirm `@anthropic-ai/sdk` appears under `dependencies` with a version like `^0.x.y`.

- [ ] **Step 3: Verify server still boots**

Run:
```bash
npm start
```

Expected: server logs `Server running on http://localhost:3005` (or equivalent). No module errors. Press Ctrl+C to stop.

Note: this requires a running Postgres with `DATABASE_URL` set (or local `postgres://localhost/pt_aula`). If DB isn't available locally, skip this step and rely on Task 2's verification.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "deps: add @anthropic-ai/sdk for sentence generation"
```

---

## Task 2: Add POST /api/generate-sentences endpoint

**Files:**
- Modify: `server.js`

- [ ] **Step 1: Add SDK import and client at top of server.js**

Add immediately after the existing `const { Pool } = require("pg");` line (around line 2):

```javascript
const Anthropic = require("@anthropic-ai/sdk");
```

Then add after the `pool` instantiation (around line 9), before `app.use(express.json())`:

```javascript
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
```

- [ ] **Step 2: Add the endpoint handler**

Insert this handler in `server.js` immediately before the `GET /api/cards` handler (which starts around line 175 with `app.get("/api/cards", ...)`).

```javascript
// POST /api/generate-sentences — body: { activeCats: [categoryId, ...] }
// Returns { cards: [{ pt, en }, ...] }
app.post("/api/generate-sentences", async (req, res) => {
  const { activeCats } = req.body;
  if (!Array.isArray(activeCats) || activeCats.length === 0) {
    return res.status(400).json({ error: "activeCats must be a non-empty array" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured on server" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT c.pt, c.en, cat.group_name
       FROM cards c JOIN categories cat ON c.category_id = cat.id
       WHERE c.category_id = ANY($1)`,
      [activeCats]
    );
    const verbs = rows.filter(r => r.group_name === "Verbs").map(r => r.pt);
    const topics = rows.filter(r => r.group_name === "Topics").map(r => r.pt);

    if (verbs.length === 0 && topics.length === 0) {
      return res.status(400).json({ error: "Select at least one Verb or Topic category" });
    }

    const prompt = `Generate 20 Brazilian Portuguese sentences for a language learner to translate.

Constraints:
- Prefer using these verbs (conjugated naturally in the sentences): ${verbs.join(", ") || "(none specified)"}
- Use vocabulary from these topics when it fits naturally: ${topics.join(", ") || "(none specified)"}
- Vary difficulty: mix short sentences (5-8 words) and longer ones (10-15 words with clauses or multiple verbs).
- Natural, conversational Brazilian Portuguese.
- Provide an accurate English translation for each.

Return STRICT JSON only, no prose, no markdown fence:
{"sentences":[{"pt":"...","en":"..."}]}`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }]
    });

    let text = response.content[0].text.trim();
    // Strip optional markdown fence
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("Generate: failed to parse Claude response:", text);
      return res.status(502).json({ error: "Claude returned malformed JSON" });
    }

    if (!parsed || !Array.isArray(parsed.sentences)) {
      return res.status(502).json({ error: "Claude response missing sentences array" });
    }

    const cards = parsed.sentences
      .filter(s => s && typeof s.pt === "string" && typeof s.en === "string")
      .map(s => ({ pt: s.pt, en: s.en }));

    res.json({ cards });
  } catch (err) {
    console.error("Generate failed:", err.message);
    res.status(502).json({ error: err.message });
  }
});
```

- [ ] **Step 3: Start server with API key**

Set your Anthropic API key and start the server:

```bash
ANTHROPIC_API_KEY=sk-ant-... npm start
```

Expected: server boots without errors.

- [ ] **Step 4: Manually verify the endpoint**

In another terminal, check which Verb and Topic category IDs exist:

```bash
curl -s http://localhost:3005/api/cards | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{const {categories}=JSON.parse(d);for(const [id,c] of Object.entries(categories))console.log(c.group,id,c.label)})"
```

Pick one Verb group id and one Topic group id from the output (e.g. `ser`, `fitness`). Then call the new endpoint:

```bash
curl -s -X POST http://localhost:3005/api/generate-sentences \
  -H "Content-Type: application/json" \
  -d '{"activeCats":["ser","fitness"]}' | head -c 2000
```

Expected: JSON like `{"cards":[{"pt":"...","en":"..."}, ...]}` with ~20 entries. Takes 5-15s.

- [ ] **Step 5: Verify error handling**

Empty `activeCats`:
```bash
curl -s -X POST http://localhost:3005/api/generate-sentences \
  -H "Content-Type: application/json" -d '{"activeCats":[]}'
```
Expected: `{"error":"activeCats must be a non-empty array"}` with HTTP 400.

Only Phrases/Aulas categories (no Verbs or Topics):
```bash
# substitute real non-Verb/non-Topic category ids from Step 4 output
curl -s -X POST http://localhost:3005/api/generate-sentences \
  -H "Content-Type: application/json" -d '{"activeCats":["<phrases-cat-id>"]}'
```
Expected: `{"error":"Select at least one Verb or Topic category"}` with HTTP 400.

Stop server with Ctrl+C.

- [ ] **Step 6: Commit**

```bash
git add server.js
git commit -m "feat: add /api/generate-sentences endpoint using Claude API"
```

---

## Task 3: Add frontend state variables and CSS for banner

**Files:**
- Modify: `public/index.html`

- [ ] **Step 1: Add generated-mode state variables**

Open `public/index.html`. Find the state declarations block (around line 698, starting with `let activeCats = new Set();`). Add these new variables immediately after `let wrongCards = [];` (around line 705):

```javascript
let generatedMode = false;
let generatedCards = [];
let savedDeckSnapshot = null;
let isGenerating = false;
```

- [ ] **Step 2: Add banner CSS**

Find the `<style>` block. Add this CSS near the bottom of the style block, just before the closing `</style>` tag:

```css
.gen-banner {
  background: var(--accent);
  color: #fff;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 500;
  gap: 12px;
}
.gen-banner button {
  background: rgba(255,255,255,0.2);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.4);
  padding: 4px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-family: inherit;
}
.gen-banner button:hover { background: rgba(255,255,255,0.3); }
body.gen-mode .cat-group-items,
body.gen-mode .selected-section { opacity: 0.5; pointer-events: none; }
.ctrl-btn:disabled { opacity: 0.5; cursor: not-allowed; }
```

- [ ] **Step 3: Reload the page and verify no visual regressions**

Restart the server (with `ANTHROPIC_API_KEY` set) and reload http://localhost:3005 in a browser. Expected: app looks identical to before. No console errors.

- [ ] **Step 4: Commit**

```bash
git add public/index.html
git commit -m "feat: add generated-mode state vars and banner CSS"
```

---

## Task 4: Add Generate button to control groups

**Files:**
- Modify: `public/index.html`

- [ ] **Step 1: Add Generate button to each sidebar-controls group and the bottom-sheet-controls group**

There are three `sidebar-controls` blocks (inside `render()` at ~line 1068, ~1091, ~1133) and one `bottom-sheet-controls` block (inside `bottomSheetHTML()` at ~line 1034) containing the existing buttons. Locate each and add a new button immediately after the Reseed button.

Search the file for each line matching `<button class="ctrl-btn" onclick="reseed()">Reseed</button>`. After EACH occurrence (there are 4), add on the next line (preserving indentation):

```html
<button class="ctrl-btn gen-btn" onclick="generateSentences()">✨ Generate</button>
```

There should be 4 total new button elements inserted.

- [ ] **Step 2: Add stub generateSentences function**

Find the `toggleMode` function (around line 1206). Add these stub functions immediately after it:

```javascript
async function generateSentences() {
  alert("generateSentences not yet implemented");
}

async function exitGeneratedMode() {
  alert("exitGeneratedMode not yet implemented");
}
```

- [ ] **Step 3: Reload page and verify buttons render**

Reload http://localhost:3005. Expected: every controls group now shows a "✨ Generate" button after Reseed. Clicking it shows the alert. No console errors.

- [ ] **Step 4: Commit**

```bash
git add public/index.html
git commit -m "feat: add Generate button to control groups (stub handler)"
```

---

## Task 5: Implement generateSentences and exitGeneratedMode

**Files:**
- Modify: `public/index.html`

- [ ] **Step 1: Replace the stub functions with real implementations**

Replace the two stub functions from Task 4 with:

```javascript
async function generateSentences() {
  if (isGenerating || generatedMode) return;
  if (activeCats.size === 0) {
    alert("Select at least one category first.");
    return;
  }
  isGenerating = true;
  render();
  try {
    const res = await fetch("/api/generate-sentences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeCats: [...activeCats] })
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Generation failed");
      return;
    }
    if (!data.cards || data.cards.length === 0) {
      alert("No sentences were generated. Try again.");
      return;
    }
    // Snapshot real deck state
    savedDeckSnapshot = {
      deck: deck.slice(),
      currentIndex,
      correct,
      wrong,
      wrongCards: wrongCards.slice()
    };
    // Swap to generated deck. Use "__generated__" as cat sentinel.
    generatedCards = data.cards.map(c => ({ pt: c.pt, en: c.en, cat: "__generated__" }));
    deck = generatedCards.slice();
    currentIndex = 0;
    correct = 0;
    wrong = 0;
    wrongCards = [];
    isFlipped = false;
    generatedMode = true;
  } catch (err) {
    alert("Generation failed: " + err.message);
  } finally {
    isGenerating = false;
    render();
  }
}

function exitGeneratedMode() {
  if (!generatedMode || !savedDeckSnapshot) return;
  deck = savedDeckSnapshot.deck;
  currentIndex = savedDeckSnapshot.currentIndex;
  correct = savedDeckSnapshot.correct;
  wrong = savedDeckSnapshot.wrong;
  wrongCards = savedDeckSnapshot.wrongCards;
  generatedMode = false;
  generatedCards = [];
  savedDeckSnapshot = null;
  isFlipped = false;
  render();
}
```

- [ ] **Step 2: Add banner rendering to render()**

Add this helper function immediately above `function render()` (around line 1043):

```javascript
function generatedBannerHTML() {
  if (!generatedMode) return '';
  return `<div class="gen-banner">
    <span>✨ Generated Mode · ${generatedCards.length} sentences</span>
    <button onclick="exitGeneratedMode()">Exit</button>
  </div>`;
}
```

`render()` has three `app.innerHTML = \`...\`` assignments (empty-deck state at ~line 1047, round-done states at ~lines 1065 and 1088, active-card state at ~line 1124). In EACH of the three assignments, prepend `${generatedBannerHTML()}` at the very start of the template string (before `<div class="layout">`). Example for the empty-deck case:

```javascript
app.innerHTML = `${generatedBannerHTML()}<div class="layout"><div class="sidebar">
  ...
```

Apply the same prepend to all four innerHTML assignments in `render()` (empty-deck, round-done-with-wrong, round-done-all-correct, active-card).

- [ ] **Step 2b: Guard against undefined cc for generated cards**

In the active-card render path (around line 1120), find:

```javascript
const cc = catConfig[card.cat];
```

Replace with:

```javascript
const cc = catConfig[card.cat] || { cls: 'cat-generated', label: '✨ Generated' };
```

Also add a matching CSS rule near the other `.cat-*` styles in the `<style>` block (search for an existing `.cat-` class to find the right area, or add alongside the `.gen-banner` rule from Task 3):

```css
.cat-generated { background: var(--accent); color: #fff; }
```

- [ ] **Step 2c: Reflect loading state in the Generate button**

Replace every one of the 4 occurrences of:
```html
<button class="ctrl-btn gen-btn" onclick="generateSentences()">✨ Generate</button>
```
with:
```html
<button class="ctrl-btn gen-btn" onclick="generateSentences()" ${isGenerating ? 'disabled' : ''}>${isGenerating ? '⏳ Generating…' : '✨ Generate'}</button>
```

- [ ] **Step 3: Manual verification — happy path**

Reload http://localhost:3005 in the browser. Ensure at least one Verb and one Topic category are active. Click ✨ Generate.

Expected:
- Button changes to "⏳ Generating…" (in the sidebar that's visible).
- After 5-15 seconds, banner appears at top: `✨ Generated Mode · 20 sentences  [Exit]`.
- First generated sentence card is visible. Counter shows 0/0.
- Flip (Space/click) and Next (Enter/arrow keys) work. Sentences are full PT/EN translations.
- pt↔en mode toggle still flips front/back correctly on generated cards.

- [ ] **Step 4: Manual verification — exit path**

Before entering generated mode: note which card was showing in the real deck, and the current correct/wrong counters. Enter generated mode, advance a few cards, then click Exit.

Expected: original card + counters are restored exactly.

- [ ] **Step 5: Commit**

```bash
git add public/index.html
git commit -m "feat: implement generate/exit flow for Generated Mode"
```

---

## Task 6: Suppress stats writes and session saves in Generated Mode

**Files:**
- Modify: `public/index.html`

- [ ] **Step 1: Guard the stats POST in mark()**

Find the `mark` function (around line 1190). Modify it so stats are not written when in generated mode. Replace the existing `mark` function body with:

```javascript
async function mark(gotIt) {
  if (gotIt) correct++; else { wrong++; wrongCards.push(deck[currentIndex]); }
  if (!generatedMode) {
    const card = deck[currentIndex];
    const id = getCardId(card);
    const updated = await fetch(`/api/stats/${encodeURIComponent(id)}/mark`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correct: gotIt })
    }).then(r => r.json());
    statsCache[id] = updated;
  }
  currentIndex++;
  isFlipped = false;
  saveSession();
  render();
}
```

- [ ] **Step 2: Guard saveSession() to no-op in generated mode**

Find the `saveSession` function (around line 907). Add an early return at the top:

```javascript
function saveSession() {
  if (generatedMode) return;
  const deckOrder = deck.map(c => c.pt);
  // ... existing body unchanged
```

- [ ] **Step 3: Manual verification — stats untouched**

In the browser, before generating: note the stats on a specific card (hover/inspect if needed, or check via `curl http://localhost:3005/api/stats`). Enter Generated Mode. Mark several cards correct/wrong. Exit. Re-fetch stats via curl.

Expected: stats for real cards are unchanged. No new keys appear in `/api/stats` for generated-card-derived ids.

```bash
curl -s http://localhost:3005/api/stats | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>console.log(Object.keys(JSON.parse(d)).length,'stats keys'))"
```

Expected key count is the same before and after a Generated Mode session.

- [ ] **Step 4: Manual verification — session table untouched**

Query the session row BEFORE entering generated mode:

```bash
curl -s http://localhost:3005/api/session > /tmp/session-before.json
cat /tmp/session-before.json
```

Enter Generated Mode, flip/advance several cards, then (WITHOUT exiting) fetch session again:

```bash
curl -s http://localhost:3005/api/session > /tmp/session-during.json
diff /tmp/session-before.json /tmp/session-during.json
```

Expected: empty diff. The session row was not modified during generated mode.

- [ ] **Step 5: Manual verification — refresh drops out of generated mode**

While in Generated Mode, refresh the browser (Cmd+R). Expected: the saved session loads, restoring the real deck at the position it was in before entering Generated Mode. Banner is gone.

- [ ] **Step 6: Commit**

```bash
git add public/index.html
git commit -m "feat: suppress stats and session writes during Generated Mode"
```

---

## Task 7: Disable sidebar category toggles in Generated Mode

**Files:**
- Modify: `public/index.html`

- [ ] **Step 1: Guard toggleCat to no-op while in Generated Mode**

Find the `toggleCat` function (around line 993). Add an early return at the very top of the function body:

```javascript
function toggleCat(cat) {
  if (generatedMode) return;
  // ... existing body unchanged
```

This prevents both sidebar filter-btns and chip-x buttons from changing categories while in Generated Mode.

- [ ] **Step 2: Toggle body class in generate/exit**

In `generateSentences`, immediately after setting `generatedMode = true;` (inside the try block, after `isFlipped = false;`), add:

```javascript
document.body.classList.add("gen-mode");
```

In `exitGeneratedMode`, immediately after setting `generatedMode = false;`, add:

```javascript
document.body.classList.remove("gen-mode");
```

- [ ] **Step 3: Disable Generate button while in Generated Mode**

Replace every occurrence of:
```html
<button class="ctrl-btn gen-btn" onclick="generateSentences()" ${isGenerating ? 'disabled' : ''}>${isGenerating ? '⏳ Generating…' : '✨ Generate'}</button>
```
with:
```html
<button class="ctrl-btn gen-btn" onclick="generateSentences()" ${isGenerating || generatedMode ? 'disabled' : ''}>${isGenerating ? '⏳ Generating…' : '✨ Generate'}</button>
```

- [ ] **Step 4: Manual verification**

Reload http://localhost:3005. Enter Generated Mode.

Expected:
- Category filter list is visually dimmed and non-clickable.
- Chips at the top are non-clickable.
- Generate button is disabled (grayed out) in sidebar + bottom sheet.
- Mode toggle, Shuffle, Reset Stats, Reseed are still clickable (they affect in-memory generated deck state, which is fine).
- Banner Exit button works.

Click Exit. Everything re-enables.

- [ ] **Step 5: Commit**

```bash
git add public/index.html
git commit -m "feat: disable category toggles while in Generated Mode"
```

---

## Task 8: Final end-to-end verification

**Files:** none modified

- [ ] **Step 1: Full flow smoke test**

With `ANTHROPIC_API_KEY` set, start server. In browser:

1. Select 1-2 Verb categories + 1-2 Topic categories.
2. Study a few real cards, mark some correct/wrong.
3. Click ✨ Generate. Wait for 20 sentences.
4. Verify banner shows, first card renders.
5. Flip, mark correct, advance through several cards.
6. Toggle pt↔en mode — verify generated cards flip direction correctly.
7. Click Shuffle — verify remaining generated cards reorder.
8. Click Exit — verify real deck restored at prior position with prior counters.
9. Verify the next card mark updates real stats again (check `/api/stats` via curl shows the new increment).

- [ ] **Step 2: Error path — no categories**

Deselect all categories. Click Generate. Expected: alert "Select at least one category first." No request sent.

- [ ] **Step 3: Error path — only non-Verb/non-Topic categories**

Deselect everything, then activate ONLY a Phrases or Aulas category. Click Generate. Expected: alert "Select at least one Verb or Topic category" (from server 400).

- [ ] **Step 4: Error path — missing API key**

Stop server. Restart WITHOUT `ANTHROPIC_API_KEY` set. Click Generate in browser. Expected: alert "ANTHROPIC_API_KEY not configured on server".

- [ ] **Step 5: Deploy to Fly**

```bash
fly secrets set ANTHROPIC_API_KEY=sk-ant-...
fly deploy
```

Smoke test the deployed URL: generate 20 sentences, exit, confirm stats untouched.

- [ ] **Step 6: Final commit (if any fixes needed)**

If no fixes were needed, no commit. Otherwise, commit any fixes discovered during verification.
