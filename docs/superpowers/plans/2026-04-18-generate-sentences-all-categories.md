# Generate Sentences — All Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `POST /api/generate-sentences` generate sentences from any combination of categories (A2, Topics, Phrases, Aulas, IR, Conjugations, Verbs), not just `Verbs` + `Topics`.

**Architecture:** Single-file Express handler change. Replace the hardcoded `Verbs`/`Topics` partition with a `groupRole(group_name)` helper that assigns every card to one of two buckets: `infinitives` (from `group_name = "Verbs"`) or `drills` (from every other group except `Verb Endings`, which is skipped). Rebuild the prompt as two conditionally emitted fragments — the infinitives fragment keeps the current wording byte-for-byte; the drills fragment is new and teaches the model how to use pre-conjugated forms, phrases, and vocabulary.

**Tech Stack:** Node.js / Express (`server.js`), Postgres, Anthropic SDK (`claude-haiku-4-5`).

**Spec:** `docs/superpowers/specs/2026-04-18-generate-sentences-all-categories-design.md`

**Note on testing:** The existing `/api/generate-sentences` endpoint has no automated test coverage because it depends on a live Anthropic API call. The Playwright suite is e2e and doesn't cover this endpoint; the repo has no unit-test harness for `server.js`. Per the spec, verification is manual via `curl` against a running dev server. We are not adding a new test harness in this plan — YAGNI.

---

## File Structure

**Modified:**
- `server.js:193-277` — the `/api/generate-sentences` handler. One atomic commit changes the bucket partition, the validation error, and the prompt assembly. These are tightly coupled (the prompt references the bucket variables) and cannot be split without leaving the endpoint broken at a checkpoint.

No new files. No seed changes. No UI changes.

---

## Task 1: Rewrite the `/api/generate-sentences` bucket partition, validation, and prompt

**Files:**
- Modify: `server.js:193-277`

- [ ] **Step 1: Read the current handler to anchor the edit**

Run:
```bash
sed -n '193,277p' server.js
```
Expected: prints the existing handler exactly as reproduced below. If the line numbers have drifted, locate the handler by searching for `app.post("/api/generate-sentences"`.

- [ ] **Step 2: Replace the handler body with the new partition + prompt**

Use the Edit tool on `server.js`. Replace this block exactly:

```javascript
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

    const shuffle = (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const verbs = shuffle([...new Set(rows.filter(r => r.group_name === "Verbs").map(r => r.pt))]).slice(0, 30);
    const topics = shuffle([...new Set(rows.filter(r => r.group_name === "Topics").map(r => r.pt))]).slice(0, 30);

    if (verbs.length === 0 && topics.length === 0) {
      return res.status(400).json({ error: "Select at least one Verb or Topic category" });
    }

    const prompt = `Generate exactly 20 Brazilian Portuguese sentences for an intermediate learner to translate.

Rules:
- Each sentence must use at least one verb from this list, conjugated naturally. Use each verb at most once, picked randomly: ${verbs.join(", ") || "(none specified)"}
- Weave in vocabulary from this topic list where it fits naturally. Use each at most once: ${topics.join(", ") || "(none specified)"}
- For verbs with multiple meanings, clarify the specific sense in the English translation with a brief parenthetical, e.g. "to know (a place/person)" for conhecer vs "to know (a fact)" for saber, "to play (music)" for tocar vs "to play (a game)" for jogar, "to take (carry)" for levar vs "to take (grab)" for pegar, etc.
- Vary tenses across the set (present, preterite, imperfect, future, subjunctive where natural).
- Vary subjects (eu, você, ele/ela, nós, eles/elas) — don't start every sentence the same way.
- When the subject is "eles" or "elas", the English translation MUST disambiguate gender with a parenthetical: "they (m)" for eles, "they (f)" for elas. Never leave plain "they" for these subjects.
- Vary structure and length: mix short (5-8 words) and longer (10-15 words, with clauses).
- Natural, conversational Brazilian Portuguese.
- English translations should be natural and idiomatic, not literal.

Return STRICT JSON only, no prose, no markdown fence. The "sentences" array must contain exactly 20 items:
{"sentences":[{"pt":"...","en":"..."}]}`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }]
    });
```

with this replacement:

```javascript
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

    const shuffle = (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    // Map each group_name to a role. Verb Endings are literal suffixes
    // ("-amos") and aren't usable as sentence content, so they're skipped.
    const groupRole = (name) => {
      if (name === "Verbs") return "infinitives";
      if (name === "Verb Endings") return "skip";
      return "drills";
    };

    const infinitiveRows = rows.filter(r => groupRole(r.group_name) === "infinitives");
    const drillRows = rows.filter(r => groupRole(r.group_name) === "drills");

    const infinitives = shuffle([...new Set(infinitiveRows.map(r => r.pt))]).slice(0, 30);

    const seenDrill = new Set();
    const drills = shuffle(
      drillRows.filter(r => {
        if (seenDrill.has(r.pt)) return false;
        seenDrill.add(r.pt);
        return true;
      }).map(r => ({ pt: r.pt, en: r.en }))
    ).slice(0, 30);

    if (infinitives.length === 0 && drills.length === 0) {
      return res.status(400).json({
        error: "Select at least one category with usable content (Verb Endings alone cannot generate sentences)"
      });
    }

    const verbRule = infinitives.length > 0
      ? `- Each sentence must use at least one verb from this list, conjugated naturally. Use each verb at most once, picked randomly: ${infinitives.join(", ")}
- For verbs with multiple meanings, clarify the specific sense in the English translation with a brief parenthetical, e.g. "to know (a place/person)" for conhecer vs "to know (a fact)" for saber, "to play (music)" for tocar vs "to play (a game)" for jogar, "to take (carry)" for levar vs "to take (grab)" for pegar, etc.`
      : "";

    const drillRule = drills.length > 0
      ? `- Incorporate items from this drill list where they fit naturally. Use each at most once. For each item:
  - if it's a pre-conjugated verb form (e.g. "Eu fui", "Nós estávamos"), use it as a tense/verb hint — you may conjugate the same verb in the same tense for a different subject
  - if it's a phrase or time marker (e.g. "Ontem", "De repente"), use it verbatim
  - if it's a noun or other vocabulary, weave it into a sentence as-is
  Drill items:
${drills.map(d => `  - ${d.pt} — ${d.en}`).join("\n")}`
      : "";

    const prompt = `Generate exactly 20 Brazilian Portuguese sentences for an intermediate learner to translate.

Rules:
${[verbRule, drillRule].filter(Boolean).join("\n")}
- Vary tenses across the set (present, preterite, imperfect, future, subjunctive where natural).
- Vary subjects (eu, você, ele/ela, nós, eles/elas) — don't start every sentence the same way.
- When the subject is "eles" or "elas", the English translation MUST disambiguate gender with a parenthetical: "they (m)" for eles, "they (f)" for elas. Never leave plain "they" for these subjects.
- Vary structure and length: mix short (5-8 words) and longer (10-15 words, with clauses).
- Natural, conversational Brazilian Portuguese.
- English translations should be natural and idiomatic, not literal.

Return STRICT JSON only, no prose, no markdown fence. The "sentences" array must contain exactly 20 items:
{"sentences":[{"pt":"...","en":"..."}]}`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }]
    });
```

Leave the rest of the handler (response parsing, error handling, the closing `});`) untouched.

- [ ] **Step 3: Syntax-check the file**

Run:
```bash
node --check server.js
```
Expected: no output, exit code 0.

- [ ] **Step 4: Type-check**

Run:
```bash
npm run check
```
Expected: `svelte-check` reports 0 errors (warnings about unrelated Svelte files are fine as long as error count didn't increase vs. the pre-change baseline).

- [ ] **Step 5: Confirm the verbs-only prompt path is byte-identical**

The critical invariant: when `infinitives.length > 0` and `drills.length === 0`, the prompt text the model receives must match today's output for the same set of verbs (modulo the "(none specified)" fallback line for topics, which is now omitted rather than printed empty).

Sanity-check by reading the new prompt-assembly block and confirming:
- `verbRule` literal equals today's two bullets (verb-conjugation rule + multi-meaning clarification paragraph) verbatim.
- `drills.length === 0` → `drillRule` is `""` → `[verbRule, drillRule].filter(Boolean).join("\n")` collapses to just `verbRule`.
- The surrounding rules (tense variety, subjects, eles/elas, length, natural, JSON) are byte-identical to today.

No command for this step — it's a read-through of the diff before committing.

- [ ] **Step 6: Commit**

```bash
git add server.js
git commit -m "$(cat <<'EOF'
feat(server): accept all categories in generate-sentences

Partition selected cards into infinitives (group_name=Verbs) and drills
(everything except Verb Endings). Verbs keep the exact existing prompt
rule; drills get a new rule that handles pre-conjugated forms, phrases,
and vocabulary. A2, Topics, Phrases, Aulas, IR, Conjugations all flow
through the drills bucket.
EOF
)"
```

Expected: one new commit on `main`.

---

## Task 2: Manual smoke tests

**Files:**
- None (verification only).

**Prerequisites:**
- Postgres running locally with `pt_aula` db seeded. If it's empty, boot the server once (`npm start`) and it will auto-seed.
- `ANTHROPIC_API_KEY` exported in the shell that runs the server.

- [ ] **Step 1: Start the server**

In one terminal:
```bash
ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY npm start
```
Expected: `Server running on http://localhost:3005`.

- [ ] **Step 2: Scenario 1 — A2 only**

In a second terminal:
```bash
curl -sS -X POST http://localhost:3005/api/generate-sentences \
  -H 'content-type: application/json' \
  -d '{"activeCats":["a2-w1-verbs","a2-w1-nouns","a2-w1-phrases"]}' | jq '.cards | length, .cards[0:3]'
```
Expected: `20` followed by three `{pt, en}` objects. Scan the first few — they should reference A2 vocab (e.g. "Ontem", "Infância") and use past-tense verb forms. No Node stack trace; no 400.

- [ ] **Step 3: Scenario 2 — Verbs only (byte-identical prompt check)**

```bash
curl -sS -X POST http://localhost:3005/api/generate-sentences \
  -H 'content-type: application/json' \
  -d '{"activeCats":["verbs-common"]}' | jq '.cards | length'
```
Expected: `20`. Output quality should be indistinguishable from pre-change behavior because when `drills` is empty, the prompt collapses to the original verb rules + shared ruleset.

- [ ] **Step 4: Scenario 3 — Mixed Verbs + A2**

```bash
curl -sS -X POST http://localhost:3005/api/generate-sentences \
  -H 'content-type: application/json' \
  -d '{"activeCats":["verbs-common","a2-w1-verbs"]}' | jq '.cards | length, .cards[0:3]'
```
Expected: `20`. Every sentence should use at least one infinitive from `verbs-common`; some should also incorporate an A2 drill form.

- [ ] **Step 5: Scenario 4 — Verb Endings only (400)**

```bash
curl -sS -o /dev/stderr -w '%{http_code}\n' -X POST http://localhost:3005/api/generate-sentences \
  -H 'content-type: application/json' \
  -d '{"activeCats":["end-ar"]}'
```
Expected: HTTP `400` with body `{"error":"Select at least one category with usable content (Verb Endings alone cannot generate sentences)"}`.

- [ ] **Step 6: Scenario 5 — Topics only (regression)**

```bash
curl -sS -X POST http://localhost:3005/api/generate-sentences \
  -H 'content-type: application/json' \
  -d '{"activeCats":["animals"]}' | jq '.cards | length'
```
Expected: `20`. This path already worked today and must continue to work; the drills bucket now covers Topics.

- [ ] **Step 7: Stop the server**

Ctrl-C in the server terminal.

No commit for this task — it's verification only. If any scenario fails, diagnose, fix with a follow-up commit amending the implementation, and re-run the failing scenario.
