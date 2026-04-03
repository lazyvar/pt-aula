# Conjugation Card Standardization

## Problem

Conjugation cards have two incompatible formats, inconsistent data quality, and incomplete verb paradigms.

**Old format** (IR, Estar, Ler, Esquecer, Lembrar, Dizer, Ser, Fazer, Trabalhar, Esperar, Buscar, Tomar):
- PT: `"Ir (eu vou)"` — infinitive + conjugation in parentheses (gives away the answer)
- EN: `"To go — I go (Presente)"` — infinitive prefix + tense label

**New format** (Ter, Poder, Querer, Saber, Dar, Ver, Vir):
- PT: `"Eu tenho"` — clean, natural
- EN: `"I have"` — clean, natural

Additional issues:
- 12 duplicate simple conjugations (estar, esperar, buscar, tomar eu-only forms at lines 103-114)
- Esperar, Buscar, Tomar, Trabalhar only have 3 cards each (eu form, 3 tenses)
- Ter, Poder, Querer, Saber, Dar, Ver, Vir are missing Futuro tense
- Fazer uses present continuous ("eu estou fazendo") instead of simple present ("eu faço")
- Homographs not disambiguated: "Nós vimos" means both "We come" (vir) and "We saw" (ver)
- Ser/Ir share identical Perfeito forms with no disambiguation
- Inconsistent tense labels: "(past)" vs "(Imperfeito)" vs "(Perfeito)" vs no label

## Solution

### Card Format

All conjugation cards use the clean format with no tense labels:

- **PT side:** pronoun + conjugated verb only — `"Eu tenho"`
- **EN side:** natural English translation only — `"I have"`

No infinitive prefixes, no parenthetical tense names, no `"To verb —"` patterns.

### Tense Disambiguation via English

Where Imperfeito and Perfeito overlap in English, use distinct translations:

| Tense | Strategy | Example (Querer) |
|---|---|---|
| Imperfeito | Emphasize habitual/ongoing | "I used to want" or "I was wanting" |
| Perfeito | Emphasize completed/punctual action | "I wanted (decided to)" |

Other verbs with overlap:
- **Poder:** Imperfeito "I could / I used to be able to" vs Perfeito "I managed to / I was able to"
- **Saber:** Imperfeito "I used to know" vs Perfeito "I found out"
- **Dar:** Imperfeito "I used to give" vs Perfeito "I gave"
- **Ver:** Imperfeito "I used to see" vs Perfeito "I saw"
- **Ter:** Imperfeito "I used to have" vs Perfeito "I had (specific occasion)"

### Homograph Disambiguation

Minimal context added only where the same PT string appears for different verbs:

- `"Nós vimos (vir)"` → "We come" vs `"Nós vimos (ver)"` → "We saw"
- Ser/Ir Perfeito: `"Eu fui (ir)"` → "I went" vs `"Eu fui (ser)"` → "I was"
- Same pattern for você foi, ele/ela foi, nós fomos, vocês foram, eles/elas foram

### Full Paradigms

Every conjugation verb gets **6 persons x 5 tenses = 30 cards**:

**Persons:** eu, você, ele/ela, nós, vocês, eles/elas

**Tenses:** Presente, Imperfeito, Perfeito, Futuro, Conditional

### Verbs to Reformat (strip old format, keep existing tenses/persons)

- IR (currently 24 cards across 5 tenses — already has full paradigm, just reformat)
- Estar (currently 15 cards across 3 tenses — reformat + expand to 5 tenses)
- Ler (30 cards — reformat only)
- Esquecer (30 cards — reformat only)
- Lembrar (30 cards — reformat only)
- Dizer (30 cards — reformat only)
- Ser (30 cards — reformat only)

### Verbs to Expand (currently incomplete)

- **Esperar:** 3 cards → 30 cards
- **Buscar:** 3 cards → 30 cards
- **Tomar:** 3 cards → 30 cards
- **Trabalhar:** 3 cards → 30 cards
- **Fazer:** 5 cards → 30 cards (also fix present tense: faço not estou fazendo)

### Verbs to Add Futuro (currently missing)

- **Ter:** add 6 Futuro cards (eu terei, você terá, etc.)
- **Poder:** add 6 Futuro cards
- **Querer:** add 6 Futuro cards
- **Saber:** add 6 Futuro cards
- **Dar:** add 6 Futuro cards
- **Ver:** add 6 Futuro cards
- **Vir:** add 6 Futuro cards

### Cleanup

- Remove 12 duplicate simple conjugation cards (lines 103-114 in seed-data.js)
- These are eu-only variants of estar, esperar, buscar, tomar that overlap with the full paradigms

## Scope

Changes are limited to `seed-data.js` — specifically the conjugation entries in the `cards` array. No UI changes, no schema changes, no new categories.

## Final Card Count

19 verbs x 30 cards = 570 conjugation cards (up from current ~340 conjugation cards with inconsistent coverage).
