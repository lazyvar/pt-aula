# Conjugation Tense Picker — Design

Date: 2026-05-04
Branch: `conjugation-selector`

## Goal

Let the user choose which tenses to study when generating a conjugation
deck. Today `POST /api/generate-conjugations` always randomises across all
six hardcoded tenses; we want the user to multi-select a subset before
each generation.

## UX

- The existing `✨ Conjugations` button in `ControlButtons.svelte` becomes
  a popover trigger. No caret — clicking the button itself opens the
  popover. Clicking outside, pressing `Escape`, or clicking `Generate`
  closes it. The popover closes synchronously when `Generate` is
  clicked; the network call runs in the background and the existing
  `⏳ Generating…` label on the outer button stays as the in-flight
  indicator.
- Popover contents:
  - One checkbox per tense (six total).
  - A `Generate` button at the bottom that closes the popover and starts
    generation. Disabled when zero tenses are selected.
- Selected tenses persist across reloads in `localStorage`. Default on
  first load is all six checked.
- The outer `✨ Conjugations` button keeps its existing disabled rules
  (in-flight generation, currently in generated mode).
- The same component is rendered inside `BottomSheet.svelte` for mobile;
  the popover is positioned relative to its trigger button so it works
  in both layouts.

## Tense list

Single source of truth in `src/lib/tenses.ts`:

```ts
export const TENSES = [
  { value: 'presente',                           label: 'Present' },
  { value: 'pretérito perfeito',                 label: 'Preterite' },
  { value: 'pretérito imperfeito',               label: 'Imperfect' },
  { value: 'futuro do pretérito',                label: 'Conditional' },
  { value: 'presente do subjuntivo',             label: 'Present subjunctive' },
  { value: 'pretérito imperfeito do subjuntivo', label: 'Imperfect subjunctive' },
] as const;

export type TenseValue = typeof TENSES[number]['value'];
```

The server keeps its own allowlist (the same six PT strings) — never
trust the client. The wire format is the array of those exact PT
strings, e.g. `["presente", "pretérito imperfeito"]`.

## Component & state

New component `src/lib/ConjugationsButton.svelte` replaces the inline
Conjugations button currently in `ControlButtons.svelte`. It owns:

- `popoverOpen: boolean`
- `selected: Set<TenseValue>` (hydrated from `localStorage` on mount)
- click-outside / `Escape` handling

`localStorage` key: `pt-aula:conjugation-tenses`. Value: JSON array of
`TenseValue` strings. On mount: parse the JSON, drop unknown values,
then:

- key missing or JSON corrupt → fall back to "all six".
- valid array (including an empty array a user could set manually) →
  use as-is. An empty selection just leaves `Generate` disabled until
  the user picks at least one.

Write whenever the selection changes.

`testIds` prop is plumbed through (matches existing `ControlButtons`
convention) so we can disambiguate desktop vs. mobile copies in tests.

## Store wire-up

`generate()` in `src/stores/generated.ts` switches to an options-object
signature to avoid juggling positional args:

```ts
generate(
  { kind, activeCats, tenses }:
    { kind: GenerateKind; activeCats: string[]; tenses?: string[] },
  { takeSnapshot, applyGenerated }:
    { takeSnapshot: () => DeckSnapshot; applyGenerated: (cards: Card[]) => void },
): Promise<string | null>
```

When `kind === 'conjugations'`, `tenses` is included in the request body.
For sentences it is ignored.

## Server contract

`POST /api/generate-conjugations` body becomes
`{ activeCats, tenses? }`.

- If `tenses` is missing or not an array, fall back to the full six-tense
  list (back-compat for any cached client).
- Otherwise filter to the server's allowlist; if the result is empty,
  return `400 { error: "Pick at least one tense" }`.
- Replace the hardcoded `tenses = [...]` line with the validated list.
- The combo generator already picks a random tense from the array, so
  the rest of the handler needs no changes.
- The "Tense labels" mapping in the prompt stays the full six-row table
  — Claude only sees the tenses that actually appear in the `Items:`
  list, so leaving the mapping complete is harmless and keeps the prompt
  stable.

## Tests

New file `tests/conjugation-tense-picker.spec.js`:

1. Clicking `✨ Conjugations` opens the popover. Clicking outside closes
   it. Pressing `Escape` closes it.
2. All six checkboxes are checked by default on first load.
3. Unchecking all six disables the `Generate` button.
4. Selecting a subset and clicking `Generate` POSTs `tenses: [...]`
   matching the selection. Verified by capturing the request via
   `page.route` and asserting on the parsed body.
5. Reloading the page restores the last selection from `localStorage`.
6. After a successful `Generate`, the popover closes, Generated Mode
   banner appears, and generated cards render — the popover does not
   regress the existing flow.

Existing files `tests/conjugations-mode.spec.js` and
`tests/generated-mode.spec.js` need their `enterConjugationsMode`
helpers updated to perform the extra click on the popover's `Generate`
button. No behavioural change to the rest of those tests — the route
mocks (`page.route('**/api/generate-conjugations', ...)`) keep working
because they don't inspect the request body.

## Out of scope

- Persisting the tense selection to the database `session` row. The
  selection is a UI preference, so `localStorage` is the appropriate
  storage tier.
- Per-tense weighting (e.g. "60% present, 40% past"). Today's combo
  generator picks uniformly at random, and the picker preserves that.
- Letting the user pick which pronouns appear. Out of scope for this
  change.
