# Generate Sentences — All Categories

## Problem

`POST /api/generate-sentences` only recognizes two `group_name` values:

- `Verbs` → infinitives to conjugate (required for the call to succeed).
- `Topics` → optional vocabulary to weave in.

Every other group (`A2`, `Phrases`, `Aulas`, `IR`, `Conjugations`, `Verb Endings`) is
dropped by the server even when the user has those categories active. Selecting an
A2 category alone returns `400 "Select at least one Verb or Topic category"`, so the
A2 seeds aren't usable by the generator.

The user wants any category selection to produce sentences. A2 is the motivating
case, but the fix should generalize to every existing group and any future group.

## Constraint

**The verb-handling portion of the prompt must stay byte-identical to today.** When
any `Verbs`-group cards are present in `activeCats`, the rules they produce in the
prompt — including the multi-meaning clarification paragraph and the literal
wording "Each sentence must use at least one verb from this list, conjugated
naturally. Use each verb at most once, picked randomly: …" — appear exactly as
they do now. This is the load-bearing prompt the user has tuned.

## Design

### Bucketing

The server partitions the cards returned by the `activeCats` query into two
buckets driven by `group_name`:

| group_name                                                        | Bucket      |
|-------------------------------------------------------------------|-------------|
| `Verbs`                                                           | infinitives |
| `Topics`, `Phrases`, `Aulas`, `IR`, `Conjugations`, `A2`          | drills      |
| `Verb Endings`                                                    | skipped     |
| _unknown future value_                                            | drills (default) |

Mapping lives in a single `groupRole(name)` helper near the top of the endpoint so
adding a new group is a one-line change.

Bucket sizing matches today's behavior: each bucket is deduped by `pt`, shuffled,
and capped at 30 items.

### Validation

Current check:

```js
if (verbs.length === 0 && topics.length === 0) {
  return res.status(400).json({ error: "Select at least one Verb or Topic category" });
}
```

New check:

```js
if (infinitives.length === 0 && drills.length === 0) {
  return res.status(400).json({
    error: "Select at least one category with usable content (Verb Endings alone cannot generate sentences)"
  });
}
```

### Prompt assembly

Two prompt fragments, conditionally included:

**Infinitives fragment (unchanged wording, emitted only when `infinitives.length > 0`):**

```
- Each sentence must use at least one verb from this list, conjugated naturally. Use each verb at most once, picked randomly: {infinitives joined by ", "}
- For verbs with multiple meanings, clarify the specific sense in the English translation with a brief parenthetical, e.g. "to know (a place/person)" for conhecer vs "to know (a fact)" for saber, "to play (music)" for tocar vs "to play (a game)" for jogar, "to take (carry)" for levar vs "to take (grab)" for pegar, etc.
```

Today's `${verbs.join(", ") || "(none specified)"}` fallback goes away — when no
infinitives are selected, this bullet is omitted entirely rather than printed with
"(none specified)".

**Drills fragment (emitted only when `drills.length > 0`):**

Drills are passed as `pt — en` pairs so the model has translation context for
each item:

```
- Incorporate items from this drill list where they fit naturally. Use each at most once. For each item:
  - if it's a pre-conjugated verb form (e.g. "Eu fui", "Nós estávamos"), use it as a tense/verb hint — you may conjugate the same verb in the same tense for a different subject
  - if it's a phrase or time marker (e.g. "Ontem", "De repente"), use it verbatim
  - if it's a noun or other vocabulary, weave it into a sentence as-is
  Drill items:
  {each item on its own line as "- {pt} — {en}"}
```

The existing rules about tense variety, subject variety, `eles`/`elas` gender
disambiguation, sentence length/structure variety, natural conversational BR
Portuguese, and strict JSON output remain unchanged and are shared by both
fragments.

### Query change

Today's SQL already returns `group_name`; no schema change needed. The server
keeps the same `SELECT c.pt, c.en, cat.group_name …` shape but passes each row
through `groupRole(group_name)` to assign a bucket. Drills need both `pt` and `en`
(infinitives currently use only `pt`), so the projection stays as-is.

## Seeds

No seed schema change. All existing `group_name` values are sufficient to drive
the bucket mapping. A2 weeks 1-10 already tag cards with `group_name: "A2"`, which
now routes them to the drills bucket automatically.

## Out of scope

- `/api/generate-conjugations` — verb-only by design, unchanged.
- UI — the endpoint is the only surface being changed; the Generated Mode client
  code passes whatever `activeCats` the user has selected and expects
  `{ cards: [{pt, en}] }` back, which this design preserves.
- Automated tests — `generate-sentences` has no Playwright coverage today (it
  depends on a live Anthropic call). Verification is manual.

## Verification

Manual smoke tests against a running server with `ANTHROPIC_API_KEY` set:

1. **A2 only:** POST `{ activeCats: ["a2-w1-verbs", "a2-w1-nouns", "a2-w1-phrases"] }` — expect 20 sentences that draw on those cards, with A2 verb forms appearing either verbatim or as tense/verb inspiration.
2. **Verbs only:** POST `{ activeCats: ["verbs-common"] }` — output should be indistinguishable from today's output for the same input (prompt is byte-identical in this path).
3. **Mixed Verbs + A2:** POST `{ activeCats: ["verbs-common", "a2-w1-verbs"] }` — each sentence uses at least one infinitive; A2 forms appear as additional drill content.
4. **Verb Endings only:** POST `{ activeCats: ["end-ar"] }` — expect `400` with the new error message.
5. **Topics only (regression):** POST `{ activeCats: ["animals"] }` — Topics-only already succeeds today (no verb requirement). Confirm it still succeeds under the new partition and that the drill prompt produces reasonable output.
