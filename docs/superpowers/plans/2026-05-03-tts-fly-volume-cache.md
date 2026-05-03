# TTS Fly-Volume Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cache ElevenLabs TTS audio responses on a Fly volume so repeated phrase requests serve from disk instead of hitting the ElevenLabs API.

**Architecture:** All changes live inline in `server.js` (the codebase convention is a single-file backend — see `CLAUDE.md`). A cache key is `sha256(voice_id + ":" + model_id + ":" + text)` rendered as hex; files are stored as `<TTS_CACHE_DIR>/<hash>.mp3`. On request, `handleTts` checks for a cached file first; on miss it fetches from ElevenLabs, buffers the body, atomically writes `<hash>.mp3` (via tmp-file + rename), and returns the buffer. Cache writes are best-effort — failures are logged and never break the response.

**Tech Stack:** Node.js `crypto` (sha256), `fs/promises` (file I/O), Express, ElevenLabs REST API, Fly.io volumes.

**Spec:** [`docs/superpowers/specs/2026-05-03-tts-fly-volume-cache-design.md`](../specs/2026-05-03-tts-fly-volume-cache-design.md)

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `server.js` | Modify (`require` block at top, new helpers + edits inside `handleTts` near line 442) | Cache key hashing, dir creation on boot, read-on-hit / write-on-miss in `handleTts`. |
| `fly.toml` | Modify (append) | Declare `TTS_CACHE_DIR` env and the `tts_cache` volume mount. |
| `.gitignore` | Modify (append) | Ignore the local-dev cache dir `.tts-cache/`. |
| `CLAUDE.md` | Modify (line 41) | Drop the "no caching" claim; note the volume cache. |

No new files. No new tests (existing Playwright tests stub `/api/tts` via `page.route` and never exercise the server-side cache path — see `tests/listening.spec.js:10-28`).

---

## Verification Approach

The codebase has no unit-test runner — only Playwright integration tests. Per the spec, no automated tests are added. Each task includes a manual verification step (curl, filesystem check, or visual confirmation) so the engineer can catch mistakes before moving on. The final task runs the existing Playwright suite to confirm no regressions.

---

### Task 1: Add cache helpers and boot-time dir creation

**Files:**
- Modify: `server.js` (top-level requires; new helper block after line 440; `init()` body around line 17)

- [ ] **Step 1: Add `crypto` and `fs/promises` requires**

At the top of `server.js`, alongside the existing requires, add:

```js
const crypto = require("crypto");
const fsp = require("fs/promises");
```

Place them after the existing `const path = require("path");` line (around line 4).

- [ ] **Step 2: Add cache-helper block above `handleTts`**

Insert the following directly above the existing `async function handleTts` declaration (around line 442). This places it next to the constants it uses.

```js
const TTS_CACHE_DIR = process.env.TTS_CACHE_DIR || "./.tts-cache";

async function ensureTtsCacheDir() {
  await fsp.mkdir(TTS_CACHE_DIR, { recursive: true });
}

function ttsCacheKey(text) {
  return crypto
    .createHash("sha256")
    .update(`${ELEVENLABS_VOICE_ID}:${ELEVENLABS_MODEL_ID}:${text}`)
    .digest("hex");
}

function ttsCachePath(text) {
  return path.join(TTS_CACHE_DIR, `${ttsCacheKey(text)}.mp3`);
}
```

Note: `ELEVENLABS_VOICE_ID` and `ELEVENLABS_MODEL_ID` are already declared just above this block (`server.js:439-440`) — keep them where they are.

- [ ] **Step 3: Call `ensureTtsCacheDir()` from `init()`**

Inside `init()` (starts at `server.js:17`), append a call at the very end of the function body, just before the closing `}`. The current function ends with the last `ALTER TABLE` / `INSERT` queries before its closing brace — add the line as the last statement inside `init`:

```js
await ensureTtsCacheDir();
```

- [ ] **Step 4: Boot the server and confirm the cache dir is created**

Run the server locally (with the test Postgres up):

```bash
docker compose -f docker-compose.test.yml up -d --wait
DATABASE_URL=postgres://postgres:postgres@localhost:5433/pt_aula_test PORT=3005 npm start
```

In another terminal:

```bash
ls -la /Users/mack/Developer/pt-aula/.tts-cache
```

Expected: directory exists (empty). Stop the server (Ctrl-C).

- [ ] **Step 5: Commit**

```bash
git add server.js
git commit -m "feat(tts): add cache-key helpers and ensure cache dir on boot"
```

---

### Task 2: Serve from cache on hit

**Files:**
- Modify: `server.js` — top of `handleTts` body, BEFORE the existing `ELEVENLABS_API_KEY` check (currently `server.js:446-448`)

- [ ] **Step 1: Add cache-read short-circuit in `handleTts`**

In `handleTts`, insert the cache-read block **between** the text-validation block and the `ELEVENLABS_API_KEY` check. Order matters: cache hits must not require the API key (per the spec's failure-mode table).

The function body should now flow: `validate text → try cache → require API key → fetch network`.

Insert the following immediately after the `if (typeof text !== "string" ...)` line and **before** the `if (!process.env.ELEVENLABS_API_KEY)` line:

```js
  const cachedPath = ttsCachePath(text);
  try {
    const cached = await fsp.readFile(cachedPath);
    res.setHeader("Content-Type", "audio/mpeg");
    res.end(cached);
    return;
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("TTS cache read failed:", err.message);
    }
    // fall through to network fetch
  }
```

After this edit the top of `handleTts` should read:

```js
async function handleTts(text, res) {
  if (typeof text !== "string" || text.length === 0 || text.length > 500) {
    return res.status(400).json({ error: "text must be a non-empty string ≤ 500 chars" });
  }

  const cachedPath = ttsCachePath(text);
  try {
    const cached = await fsp.readFile(cachedPath);
    res.setHeader("Content-Type", "audio/mpeg");
    res.end(cached);
    return;
  } catch (err) {
    if (err.code !== "ENOENT") {
      console.error("TTS cache read failed:", err.message);
    }
    // fall through to network fetch
  }

  if (!process.env.ELEVENLABS_API_KEY) {
    return res.status(500).json({ error: "ELEVENLABS_API_KEY not configured on server" });
  }

  try {
    // ... existing fetch code (unchanged in this task; modified in Task 3)
```

Notes:
- `ENOENT` is the normal cache-miss case → no log.
- Any other read error (e.g. EACCES) is logged but still falls through to the network path.
- Cache hits do NOT require `ELEVENLABS_API_KEY` — the file already exists, so we serve it.

- [ ] **Step 2: Manually verify the read path with a synthetic file**

With the server stopped, create a fake cached file matching what `ttsCachePath("hello")` would compute. Easiest way: use Node to print the path, then write a known byte sequence to it.

```bash
node -e '
  const crypto = require("crypto");
  const VOICE = "FGY2WhTYpPnrIDTdsKH5";
  const MODEL = "eleven_multilingual_v2";
  const text = "hello";
  const hash = crypto.createHash("sha256").update(`${VOICE}:${MODEL}:${text}`).digest("hex");
  console.log(hash);
'
```

Copy the printed hash, then write a sentinel file:

```bash
echo "FAKE_AUDIO_BYTES" > /Users/mack/Developer/pt-aula/.tts-cache/<paste-hash>.mp3
```

Boot the server again:

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5433/pt_aula_test PORT=3005 npm start
```

In another terminal — note: we deliberately omit `ELEVENLABS_API_KEY` here to prove that cache hits don't require the key (the cache-read runs before the key check):

```bash
curl -s -o /tmp/tts-out.mp3 "http://localhost:3005/api/tts?text=hello"
cat /tmp/tts-out.mp3
```

Expected output: `FAKE_AUDIO_BYTES`. If you instead see `{"error":"ELEVENLABS_API_KEY not configured on server"}`, the cache-read block is in the wrong position — it should be above the key check. Re-check Step 1.

Stop the server. Delete the synthetic file:

```bash
rm /Users/mack/Developer/pt-aula/.tts-cache/<paste-hash>.mp3
```

- [ ] **Step 3: Commit**

```bash
git add server.js
git commit -m "feat(tts): serve audio from cache on hit"
```

---

### Task 3: Buffer + atomic-write on cache miss

**Files:**
- Modify: `server.js` — body of the `try { ... }` block in `handleTts` (currently `server.js:450-478`)

- [ ] **Step 1: Replace the streaming response with buffer + write + send**

Replace the **entire current body** of the `try { ... }` block in `handleTts` (the block that calls `fetch` and pipes to the response). The old body looks like this and should be removed in its entirety:

```js
// OLD — remove this whole try block body
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
const reader = upstream.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  res.write(Buffer.from(value));
}
res.end();
```

Replace it with:

```js
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

    const audio = Buffer.from(await upstream.arrayBuffer());

    try {
      const tmp = `${cachedPath}.tmp`;
      await fsp.writeFile(tmp, audio);
      await fsp.rename(tmp, cachedPath);
    } catch (err) {
      console.error("TTS cache write failed:", err.message);
      // best-effort — still serve the audio below
    }

    res.setHeader("Content-Type", "audio/mpeg");
    res.end(audio);
```

Notes:
- We rely on `cachedPath` already being computed earlier in the function (Task 2 added it).
- `fsp.rename` is atomic on the same filesystem, so a crash mid-write leaves at most a `.tmp` orphan, never a torn `<hash>.mp3`.
- Tmp-file cleanup on error is intentionally omitted: an orphan `.tmp` is harmless and the next successful write to the same key overwrites it.

- [ ] **Step 2: Verify miss → write → hit end-to-end**

You'll need a real `ELEVENLABS_API_KEY` for this step. If you don't have one, skip to manual deploy verification in Task 4.

```bash
rm -rf /Users/mack/Developer/pt-aula/.tts-cache
ELEVENLABS_API_KEY=<your-real-key> \
DATABASE_URL=postgres://postgres:postgres@localhost:5433/pt_aula_test \
PORT=3005 npm start
```

In another terminal, time two requests for the same text:

```bash
time curl -s -o /tmp/a.mp3 "http://localhost:3005/api/tts?text=ola%20mundo"
time curl -s -o /tmp/b.mp3 "http://localhost:3005/api/tts?text=ola%20mundo"
```

Expected:
- First call takes hundreds of ms to a couple seconds (network round-trip to ElevenLabs).
- Second call returns in single-digit ms (disk read).
- Both files are non-empty and identical:
  ```bash
  diff /tmp/a.mp3 /tmp/b.mp3 && echo "identical"
  ls -la /Users/mack/Developer/pt-aula/.tts-cache
  ```
  Expected: `identical`, and exactly one `.mp3` file in the cache dir.

Stop the server.

- [ ] **Step 3: Commit**

```bash
git add server.js
git commit -m "feat(tts): write audio to cache on miss with atomic rename"
```

---

### Task 4: Wire the Fly volume

**Files:**
- Modify: `fly.toml`

- [ ] **Step 1: Append `[env]` and `[mounts]` blocks**

Open `/Users/mack/Developer/pt-aula/fly.toml` and add the following two blocks at the end of the file:

```toml
[env]
  TTS_CACHE_DIR = "/data/tts-cache"

[mounts]
  source = "tts_cache"
  destination = "/data"
```

The full file should now read (after `[[vm]]` block):

```toml
[[vm]]
  memory = '1gb'
  cpu_kind = 'shared'
  cpus = 1
  memory_mb = 1024

[env]
  TTS_CACHE_DIR = "/data/tts-cache"

[mounts]
  source = "tts_cache"
  destination = "/data"
```

- [ ] **Step 2: Validate the toml**

```bash
fly config validate -c /Users/mack/Developer/pt-aula/fly.toml
```

Expected: `Configuration is valid`. (If the `fly` CLI isn't installed locally, skip this — Fly will validate on deploy.)

- [ ] **Step 3: Document the one-time volume creation**

This is **not** automated. The user must run this once before their next deploy:

```bash
fly volumes create tts_cache --size 1 --region iad
```

Mention this in the commit message body so it's discoverable in `git log`.

- [ ] **Step 4: Commit**

```bash
git add fly.toml
git commit -m "$(cat <<'EOF'
feat(deploy): mount Fly volume for TTS cache

Before next deploy, run once:
  fly volumes create tts_cache --size 1 --region iad
EOF
)"
```

---

### Task 5: Update `.gitignore` and `CLAUDE.md`

**Files:**
- Modify: `.gitignore`
- Modify: `CLAUDE.md` (line 41)

- [ ] **Step 1: Append `.tts-cache/` to `.gitignore`**

Add this line at the end of `/Users/mack/Developer/pt-aula/.gitignore`:

```
.tts-cache
```

(No trailing slash needed; matches the existing style of `dist`, `node_modules`, etc.)

- [ ] **Step 2: Update the listening-mode note in `CLAUDE.md`**

Find this line in `CLAUDE.md` (line 41):

```
- A third mode value `listen-to-pt` activates Listening Mode: `<ListeningCard>` replaces the flip card, audio comes from `/api/tts` (ElevenLabs proxy, no caching), and answers are graded with `normalizeForListening` (case/diacritic/punctuation-insensitive).
```

Replace `(ElevenLabs proxy, no caching)` with `(ElevenLabs proxy, cached on a Fly volume at \`$TTS_CACHE_DIR\`)`. The full line becomes:

```
- A third mode value `listen-to-pt` activates Listening Mode: `<ListeningCard>` replaces the flip card, audio comes from `/api/tts` (ElevenLabs proxy, cached on a Fly volume at `$TTS_CACHE_DIR`), and answers are graded with `normalizeForListening` (case/diacritic/punctuation-insensitive).
```

- [ ] **Step 3: Commit**

```bash
git add .gitignore CLAUDE.md
git commit -m "chore: ignore local TTS cache; document Fly-volume cache in CLAUDE.md"
```

---

### Task 6: Regression-check the existing Playwright suite

**Files:** none

- [ ] **Step 1: Run the full Playwright suite**

```bash
cd /Users/mack/Developer/pt-aula
npm test
```

Expected: all tests pass, including `tests/listening.spec.js`. The listening tests stub `/api/tts` via `page.route` (`tests/listening.spec.js:10-28`), so they bypass the server-side cache entirely and should be unaffected.

- [ ] **Step 2: If any test fails**

Investigate before moving on. The most likely failure modes:
- `init()` fails because it can't create `.tts-cache` (e.g. permission issue in CI). Fix: ensure the dir is writable, or add error handling around `ensureTtsCacheDir` so a creation failure doesn't crash boot.
- A typo in the helper block breaks server startup. Fix and re-run.

Do not edit the tests themselves — they should not need to know about the cache.

- [ ] **Step 3: Final verification done**

No commit needed for this task — it's a checkpoint. The plan is complete.

---

## Out of Scope (per spec)

- Cache eviction / LRU / size limits.
- Pre-warming the cache.
- A `DELETE /api/tts/cache` endpoint (use `fly ssh console` + `rm -rf /data/tts-cache` if needed).
- Sharding the cache directory (flat `<hash>.mp3` is fine for thousands of files).
- Unit tests for the helpers (no unit-test infrastructure exists in this repo).
