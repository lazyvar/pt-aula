// src/lib/tenses.ts
//
// Single source of truth for conjugation tenses on the client.
// `value` strings MUST match the server's ALL_TENSES allowlist in
// server.js (POST /api/generate-conjugations). The English `label` is
// what the user sees in the picker.
export const TENSES = [
  { value: 'presente',                           label: 'Present' },
  { value: 'pretérito perfeito',                 label: 'Preterite' },
  { value: 'pretérito imperfeito',               label: 'Imperfect' },
  { value: 'futuro do pretérito',                label: 'Conditional' },
  { value: 'presente do subjuntivo',             label: 'Present subjunctive' },
  { value: 'pretérito imperfeito do subjuntivo', label: 'Imperfect subjunctive' },
] as const;

export type TenseValue = typeof TENSES[number]['value'];
