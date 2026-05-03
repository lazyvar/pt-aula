# TTS Fly-Volume Cache — Design

## Goal

Cache ElevenLabs TTS audio responses on a Fly volume so repeated requests for the same phrase serve from disk instead of hitting the ElevenLabs API. This reduces latency and ElevenLabs API spend for the bounded vocabulary of a single-user PT flashcard trainer.

## Current State

`server.js:436-493` defines `/api/tts` (POST + GET). It proxies ElevenLabs as a streaming response with no caching. Voice (`ELEVENLABS_VOICE_ID`) and model (`ELEVENLABS_MODEL_ID = "eleven_multilingual_v2"`) are constants. Text is rejected if empty or > 500 chars. `fly.toml` has no `[mounts]` section — no volume currently exists.

## Cache Key

`sha256(voice_id + ":" + model_id + ":" + text)` rendered as lowercase hex. Including voice + model ensures that changing either invalidates the cache automatically (old files become orphans, never read). SHA-256 collision probability for ~10⁴ phrases is ~10⁻⁷⁰ — negligible, no collision handling needed.

## Storage Layout

- Single flat directory of `<hash>.mp3` files.
- Configurable via `TTS_CACHE_DIR` env var.
- Default: `./.tts-cache` (works locally without a Fly volume).
- On Fly: `TTS_CACHE_DIR=/data/tts-cache`, with a Fly volume mounted at `/data`.
- Directory is created on server boot if it doesn't exist (`fs.mkdir({ recursive: true })`).

## Read Path (cache hit)

1. Validate `text` (existing rules: non-empty string, ≤ 500 chars).
2. Compute hash, build path `<TTS_CACHE_DIR>/<hash>.mp3`.
3. If the file exists, set `Content-Type: audio/mpeg` and stream it from disk to the response.
4. Return.

A `fs.stat` followed by streaming is fine — if the file is unlinked between stat and open, fall through to the network path.

## Write Path (cache miss)

1. Validate (as today, including the `ELEVENLABS_API_KEY` check).
2. POST to ElevenLabs with the existing headers and body shape.
3. On non-OK upstream: return 502 (existing behavior).
4. On OK: read the full response body into a `Buffer` (`await upstream.arrayBuffer()`).
5. Write the buffer to `<hash>.mp3.tmp`, then `rename` to `<hash>.mp3` (atomic — no torn files if the process crashes mid-write).
6. Send the buffer as the response with `Content-Type: audio/mpeg`.

If the disk write throws, log the error and still serve the audio. Caching is best-effort; a write failure must never break the user-facing request.

### Why buffer-then-write instead of stream-tee

ElevenLabs clips for ≤ 500-char Portuguese phrases are typically 50-300 KB. Buffering the full response in memory before writing avoids partial-file cleanup logic (a tee'd write that fails mid-stream would leave a corrupt `.mp3` on disk that future hits would happily serve). The atomic tmp-then-rename pattern eliminates that class of bug entirely.

## Eviction

None. Worst-case cache size:
- Vocabulary upper bound: low thousands of cards.
- Average clip: ~150 KB.
- Total: a few hundred MB.

Fly volume minimum size is 1 GB, so the cache fits comfortably without any eviction logic. If the deck ever grows large enough for this to matter, add eviction in a follow-up — YAGNI for now.

## fly.toml Changes

Add to the existing config:

```toml
[env]
  TTS_CACHE_DIR = "/data/tts-cache"

[mounts]
  source = "tts_cache"
  destination = "/data"
```

The volume must be created once before the next deploy:

```sh
fly volumes create tts_cache --size 1 --region iad
```

(Manual one-time step — not part of the code change.)

## Other Files Touched

- `.gitignore` — add `.tts-cache/` so the local-dev cache dir isn't committed.
- `CLAUDE.md` — update the listening-mode note that currently says `/api/tts` has no caching.

## Failure Modes

| Failure | Behavior |
|---|---|
| Cache dir doesn't exist on boot | Created via `mkdir({ recursive: true })`. |
| Cache file unreadable / corrupt | Falls through to network fetch. (We don't validate content; a corrupt mp3 will play as broken audio. Mitigated by atomic rename, so this should not occur in practice.) |
| Cache write fails (disk full, permission, etc.) | Log error, serve audio anyway. |
| ElevenLabs returns non-OK | Existing 502 behavior — no cache write. |
| `text` invalid (empty / > 500 chars) | Existing 400 behavior — no cache touched. |
| Missing `ELEVENLABS_API_KEY` on a cache miss | Existing 500 behavior. (On a cache hit, the key is not needed — cached audio is served regardless of key presence.) |

## Testing

Existing Playwright tests (`tests/listening.spec.js`) stub `/api/tts` at the network layer via `page.route`, so they never exercise the cache code path. No test changes required, no risk of cache pollution from CI.

The cache helpers (`hashKey`, path resolution) are simple enough that unit tests aren't justified — they'd duplicate trivial logic.

## Out of Scope

- Cache eviction / size limits.
- Pre-warming the cache.
- Cache stats endpoint.
- Manual cache-clear endpoint (just `fly ssh` and `rm -rf` the dir if needed).
- Per-voice or per-model directory layout (flat dir with hashed names is enough).
