# Conjugation Card Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Standardize all conjugation cards to clean format (no infinitive prefixes or parenthetical tense labels), expand incomplete verbs to full 30-card paradigms, and disambiguate homographs.

**Architecture:** All changes are in `seed-data.js` — replacing/expanding conjugation card entries in the `cards` array. No UI, schema, or category changes.

**Tech Stack:** Plain JavaScript data (seed-data.js)

**Spec:** `docs/superpowers/specs/2026-04-03-conjugation-standardization-design.md`

---

### Task 1: Remove duplicate simple conjugations and reformat Ler, Esquecer, Lembrar, Dizer

**Files:**
- Modify: `seed-data.js`

These 4 verbs already have complete 30-card paradigms in the old format. The transformation is mechanical: strip `"Verb (conjugation)"` → just the conjugation, and strip `"To verb — translation (Tense)"` → just the translation.

- [ ] **Step 1: Remove 12 duplicate simple conjugation cards**

Delete these 12 cards (around lines 103-114 in seed-data.js):

```javascript
// DELETE these — they're duplicates of the full paradigms
{ pt: "Estar (eu estava)", en: "To be — I was (past)", category_id: "estar-conj" },
{ pt: "Estar (eu estou)", en: "To be — I am (present)", category_id: "estar-conj" },
{ pt: "Estar (eu vou estar / estarei)", en: "To be — I will be (future)", category_id: "estar-conj" },
{ pt: "Esperar (eu esperei)", en: "To wait/hope — I waited (past)", category_id: "esperar-conj" },
{ pt: "Esperar (eu espero)", en: "To wait/hope — I wait (present)", category_id: "esperar-conj" },
{ pt: "Esperar (eu vou esperar / esperarei)", en: "To wait/hope — I will wait (future)", category_id: "esperar-conj" },
{ pt: "Buscar (eu busquei)", en: "To search/fetch — I searched (past)", category_id: "buscar-conj" },
{ pt: "Buscar (eu busco)", en: "To search/fetch — I search (present)", category_id: "buscar-conj" },
{ pt: "Buscar (eu vou buscar / buscarei)", en: "To search/fetch — I will search (future)", category_id: "buscar-conj" },
{ pt: "Tomar (eu tomei)", en: "To take/drink — I took (past)", category_id: "tomar-conj" },
{ pt: "Tomar (eu tomo)", en: "To take/drink — I take (present)", category_id: "tomar-conj" },
{ pt: "Tomar (eu vou tomar / tomarei)", en: "To take/drink — I will take (future)", category_id: "tomar-conj" },
```

- [ ] **Step 2: Reformat Ler conjugations (30 cards)**

Replace the existing 30 Ler cards with:

```javascript
  // Ler — Presente
  { pt: "Eu leio", en: "I read", category_id: "ler-conj" },
  { pt: "Você lê", en: "You read", category_id: "ler-conj" },
  { pt: "Ele/Ela lê", en: "He/She reads", category_id: "ler-conj" },
  { pt: "Nós lemos", en: "We read", category_id: "ler-conj" },
  { pt: "Vocês leem", en: "You all read", category_id: "ler-conj" },
  { pt: "Eles/Elas leem", en: "They read", category_id: "ler-conj" },
  // Ler — Imperfeito
  { pt: "Eu lia", en: "I used to read", category_id: "ler-conj" },
  { pt: "Você lia", en: "You used to read", category_id: "ler-conj" },
  { pt: "Ele/Ela lia", en: "He/She used to read", category_id: "ler-conj" },
  { pt: "Nós líamos", en: "We used to read", category_id: "ler-conj" },
  { pt: "Vocês liam", en: "You all used to read", category_id: "ler-conj" },
  { pt: "Eles/Elas liam", en: "They used to read", category_id: "ler-conj" },
  // Ler — Perfeito
  { pt: "Eu li", en: "I read (past)", category_id: "ler-conj" },
  { pt: "Você leu", en: "You read (past)", category_id: "ler-conj" },
  { pt: "Ele/Ela leu", en: "He/She read (past)", category_id: "ler-conj" },
  { pt: "Nós lemos (past)", en: "We read (past)", category_id: "ler-conj" },
  { pt: "Vocês leram", en: "You all read (past)", category_id: "ler-conj" },
  { pt: "Eles/Elas leram", en: "They read (past)", category_id: "ler-conj" },
  // Ler — Futuro
  { pt: "Eu lerei", en: "I will read", category_id: "ler-conj" },
  { pt: "Você lerá", en: "You will read", category_id: "ler-conj" },
  { pt: "Ele/Ela lerá", en: "He/She will read", category_id: "ler-conj" },
  { pt: "Nós leremos", en: "We will read", category_id: "ler-conj" },
  { pt: "Vocês lerão", en: "You all will read", category_id: "ler-conj" },
  { pt: "Eles/Elas lerão", en: "They will read", category_id: "ler-conj" },
  // Ler — Conditional
  { pt: "Eu leria", en: "I would read", category_id: "ler-conj" },
  { pt: "Você leria", en: "You would read", category_id: "ler-conj" },
  { pt: "Ele/Ela leria", en: "He/She would read", category_id: "ler-conj" },
  { pt: "Nós leríamos", en: "We would read", category_id: "ler-conj" },
  { pt: "Vocês leriam", en: "You all would read", category_id: "ler-conj" },
  { pt: "Eles/Elas leriam", en: "They would read", category_id: "ler-conj" },
```

Note: "Ler" is tricky because English "read" is the same in present and past. Use "I used to read" for Imperfeito and "I read (past)" for Perfeito to distinguish. "Nós lemos" appears in both Presente and Perfeito — add "(past)" to the PT side for Perfeito: `"Nós lemos (past)"`.

- [ ] **Step 3: Reformat Esquecer conjugations (30 cards)**

Replace the existing 30 Esquecer cards with:

```javascript
  // Esquecer — Presente
  { pt: "Eu esqueço", en: "I forget", category_id: "esquecer-conj" },
  { pt: "Você esquece", en: "You forget", category_id: "esquecer-conj" },
  { pt: "Ele/Ela esquece", en: "He/She forgets", category_id: "esquecer-conj" },
  { pt: "Nós esquecemos", en: "We forget", category_id: "esquecer-conj" },
  { pt: "Vocês esquecem", en: "You all forget", category_id: "esquecer-conj" },
  { pt: "Eles/Elas esquecem", en: "They forget", category_id: "esquecer-conj" },
  // Esquecer — Imperfeito
  { pt: "Eu esquecia", en: "I used to forget", category_id: "esquecer-conj" },
  { pt: "Você esquecia", en: "You used to forget", category_id: "esquecer-conj" },
  { pt: "Ele/Ela esquecia", en: "He/She used to forget", category_id: "esquecer-conj" },
  { pt: "Nós esquecíamos", en: "We used to forget", category_id: "esquecer-conj" },
  { pt: "Vocês esqueciam", en: "You all used to forget", category_id: "esquecer-conj" },
  { pt: "Eles/Elas esqueciam", en: "They used to forget", category_id: "esquecer-conj" },
  // Esquecer — Perfeito
  { pt: "Eu esqueci", en: "I forgot", category_id: "esquecer-conj" },
  { pt: "Você esqueceu", en: "You forgot", category_id: "esquecer-conj" },
  { pt: "Ele/Ela esqueceu", en: "He/She forgot", category_id: "esquecer-conj" },
  { pt: "Nós esquecemos (past)", en: "We forgot", category_id: "esquecer-conj" },
  { pt: "Vocês esqueceram", en: "You all forgot", category_id: "esquecer-conj" },
  { pt: "Eles/Elas esqueceram", en: "They forgot", category_id: "esquecer-conj" },
  // Esquecer — Futuro
  { pt: "Eu esquecerei", en: "I will forget", category_id: "esquecer-conj" },
  { pt: "Você esquecerá", en: "You will forget", category_id: "esquecer-conj" },
  { pt: "Ele/Ela esquecerá", en: "He/She will forget", category_id: "esquecer-conj" },
  { pt: "Nós esqueceremos", en: "We will forget", category_id: "esquecer-conj" },
  { pt: "Vocês esquecerão", en: "You all will forget", category_id: "esquecer-conj" },
  { pt: "Eles/Elas esquecerão", en: "They will forget", category_id: "esquecer-conj" },
  // Esquecer — Conditional
  { pt: "Eu esqueceria", en: "I would forget", category_id: "esquecer-conj" },
  { pt: "Você esqueceria", en: "You would forget", category_id: "esquecer-conj" },
  { pt: "Ele/Ela esqueceria", en: "He/She would forget", category_id: "esquecer-conj" },
  { pt: "Nós esqueceríamos", en: "We would forget", category_id: "esquecer-conj" },
  { pt: "Vocês esqueceriam", en: "You all would forget", category_id: "esquecer-conj" },
  { pt: "Eles/Elas esqueceriam", en: "They would forget", category_id: "esquecer-conj" },
```

Note: "Nós esquecemos" appears in both Presente and Perfeito. Add "(past)" to PT side for Perfeito.

- [ ] **Step 4: Reformat Lembrar conjugations (30 cards)**

Replace the existing 30 Lembrar cards with:

```javascript
  // Lembrar — Presente
  { pt: "Eu lembro", en: "I remember", category_id: "lembrar-conj" },
  { pt: "Você lembra", en: "You remember", category_id: "lembrar-conj" },
  { pt: "Ele/Ela lembra", en: "He/She remembers", category_id: "lembrar-conj" },
  { pt: "Nós lembramos", en: "We remember", category_id: "lembrar-conj" },
  { pt: "Vocês lembram", en: "You all remember", category_id: "lembrar-conj" },
  { pt: "Eles/Elas lembram", en: "They remember", category_id: "lembrar-conj" },
  // Lembrar — Imperfeito
  { pt: "Eu lembrava", en: "I used to remember", category_id: "lembrar-conj" },
  { pt: "Você lembrava", en: "You used to remember", category_id: "lembrar-conj" },
  { pt: "Ele/Ela lembrava", en: "He/She used to remember", category_id: "lembrar-conj" },
  { pt: "Nós lembrávamos", en: "We used to remember", category_id: "lembrar-conj" },
  { pt: "Vocês lembravam", en: "You all used to remember", category_id: "lembrar-conj" },
  { pt: "Eles/Elas lembravam", en: "They used to remember", category_id: "lembrar-conj" },
  // Lembrar — Perfeito
  { pt: "Eu lembrei", en: "I remembered", category_id: "lembrar-conj" },
  { pt: "Você lembrou", en: "You remembered", category_id: "lembrar-conj" },
  { pt: "Ele/Ela lembrou", en: "He/She remembered", category_id: "lembrar-conj" },
  { pt: "Nós lembramos (past)", en: "We remembered", category_id: "lembrar-conj" },
  { pt: "Vocês lembraram", en: "You all remembered", category_id: "lembrar-conj" },
  { pt: "Eles/Elas lembraram", en: "They remembered", category_id: "lembrar-conj" },
  // Lembrar — Futuro
  { pt: "Eu lembrarei", en: "I will remember", category_id: "lembrar-conj" },
  { pt: "Você lembrará", en: "You will remember", category_id: "lembrar-conj" },
  { pt: "Ele/Ela lembrará", en: "He/She will remember", category_id: "lembrar-conj" },
  { pt: "Nós lembraremos", en: "We will remember", category_id: "lembrar-conj" },
  { pt: "Vocês lembrarão", en: "You all will remember", category_id: "lembrar-conj" },
  { pt: "Eles/Elas lembrarão", en: "They will remember", category_id: "lembrar-conj" },
  // Lembrar — Conditional
  { pt: "Eu lembraria", en: "I would remember", category_id: "lembrar-conj" },
  { pt: "Você lembraria", en: "You would remember", category_id: "lembrar-conj" },
  { pt: "Ele/Ela lembraria", en: "He/She would remember", category_id: "lembrar-conj" },
  { pt: "Nós lembraríamos", en: "We would remember", category_id: "lembrar-conj" },
  { pt: "Vocês lembrariam", en: "You all would remember", category_id: "lembrar-conj" },
  { pt: "Eles/Elas lembrariam", en: "They would remember", category_id: "lembrar-conj" },
```

Note: "Nós lembramos" appears in both Presente and Perfeito. Add "(past)" to PT side for Perfeito.

- [ ] **Step 5: Reformat Dizer conjugations (30 cards)**

Replace the existing 30 Dizer cards with:

```javascript
  // Dizer — Presente
  { pt: "Eu digo", en: "I say", category_id: "dizer-conj" },
  { pt: "Você diz", en: "You say", category_id: "dizer-conj" },
  { pt: "Ele/Ela diz", en: "He/She says", category_id: "dizer-conj" },
  { pt: "Nós dizemos", en: "We say", category_id: "dizer-conj" },
  { pt: "Vocês dizem", en: "You all say", category_id: "dizer-conj" },
  { pt: "Eles/Elas dizem", en: "They say", category_id: "dizer-conj" },
  // Dizer — Imperfeito
  { pt: "Eu dizia", en: "I used to say", category_id: "dizer-conj" },
  { pt: "Você dizia", en: "You used to say", category_id: "dizer-conj" },
  { pt: "Ele/Ela dizia", en: "He/She used to say", category_id: "dizer-conj" },
  { pt: "Nós dizíamos", en: "We used to say", category_id: "dizer-conj" },
  { pt: "Vocês diziam", en: "You all used to say", category_id: "dizer-conj" },
  { pt: "Eles/Elas diziam", en: "They used to say", category_id: "dizer-conj" },
  // Dizer — Perfeito
  { pt: "Eu disse", en: "I said", category_id: "dizer-conj" },
  { pt: "Você disse", en: "You said", category_id: "dizer-conj" },
  { pt: "Ele/Ela disse", en: "He/She said", category_id: "dizer-conj" },
  { pt: "Nós dissemos", en: "We said", category_id: "dizer-conj" },
  { pt: "Vocês disseram", en: "You all said", category_id: "dizer-conj" },
  { pt: "Eles/Elas disseram", en: "They said", category_id: "dizer-conj" },
  // Dizer — Futuro
  { pt: "Eu direi", en: "I will say", category_id: "dizer-conj" },
  { pt: "Você dirá", en: "You will say", category_id: "dizer-conj" },
  { pt: "Ele/Ela dirá", en: "He/She will say", category_id: "dizer-conj" },
  { pt: "Nós diremos", en: "We will say", category_id: "dizer-conj" },
  { pt: "Vocês dirão", en: "You all will say", category_id: "dizer-conj" },
  { pt: "Eles/Elas dirão", en: "They will say", category_id: "dizer-conj" },
  // Dizer — Conditional
  { pt: "Eu diria", en: "I would say", category_id: "dizer-conj" },
  { pt: "Você diria", en: "You would say", category_id: "dizer-conj" },
  { pt: "Ele/Ela diria", en: "He/She would say", category_id: "dizer-conj" },
  { pt: "Nós diríamos", en: "We would say", category_id: "dizer-conj" },
  { pt: "Vocês diriam", en: "You all would say", category_id: "dizer-conj" },
  { pt: "Eles/Elas diriam", en: "They would say", category_id: "dizer-conj" },
```

- [ ] **Step 6: Verify and commit**

Run: `node -e "const d = require('./seed-data.js'); const conj = ['ler-conj','esquecer-conj','lembrar-conj','dizer-conj']; conj.forEach(c => { const n = d.cards.filter(x => x.category_id === c).length; console.log(c + ': ' + n + ' cards'); }); const dups = d.cards.filter(x => x.pt.match(/^(Estar|Esperar|Buscar|Tomar) \\(/)); console.log('Remaining old-format duplicates: ' + dups.length);"`

Expected:
```
ler-conj: 30 cards
esquecer-conj: 30 cards
lembrar-conj: 30 cards
dizer-conj: 30 cards
Remaining old-format duplicates: 0
```

Commit:
```bash
git add seed-data.js
git commit -m "refactor: reformat Ler, Esquecer, Lembrar, Dizer to clean format and remove duplicates"
```

---

### Task 2: Reformat IR and Ser with homograph disambiguation

**Files:**
- Modify: `seed-data.js`

IR and Ser share identical Perfeito forms (eu fui, você foi, etc.). Both need reformatting from old format to clean, and the shared forms need `(ir)`/`(ser)` disambiguation.

- [ ] **Step 1: Replace all IR conjugation cards**

Remove all existing ir-conj cards and replace with:

```javascript
  // Ir — Presente
  { pt: "Eu vou", en: "I go", category_id: "ir-conj" },
  { pt: "Você vai", en: "You go", category_id: "ir-conj" },
  { pt: "Ele/Ela vai", en: "He/She goes", category_id: "ir-conj" },
  { pt: "Nós vamos", en: "We go", category_id: "ir-conj" },
  { pt: "Vocês vão", en: "You all go", category_id: "ir-conj" },
  { pt: "Eles/Elas vão", en: "They go", category_id: "ir-conj" },
  // Ir — Imperfeito
  { pt: "Eu ia", en: "I used to go", category_id: "ir-conj" },
  { pt: "Você ia", en: "You used to go", category_id: "ir-conj" },
  { pt: "Ele/Ela ia", en: "He/She used to go", category_id: "ir-conj" },
  { pt: "Nós íamos", en: "We used to go", category_id: "ir-conj" },
  { pt: "Vocês iam", en: "You all used to go", category_id: "ir-conj" },
  { pt: "Eles/Elas iam", en: "They used to go", category_id: "ir-conj" },
  // Ir — Perfeito (disambiguated with "(ir)" since Ser shares these forms)
  { pt: "Eu fui (ir)", en: "I went", category_id: "ir-conj" },
  { pt: "Você foi (ir)", en: "You went", category_id: "ir-conj" },
  { pt: "Ele/Ela foi (ir)", en: "He/She went", category_id: "ir-conj" },
  { pt: "Nós fomos (ir)", en: "We went", category_id: "ir-conj" },
  { pt: "Vocês foram (ir)", en: "You all went", category_id: "ir-conj" },
  { pt: "Eles/Elas foram (ir)", en: "They went", category_id: "ir-conj" },
  // Ir — Futuro
  { pt: "Eu irei", en: "I will go", category_id: "ir-conj" },
  { pt: "Você irá", en: "You will go", category_id: "ir-conj" },
  { pt: "Ele/Ela irá", en: "He/She will go", category_id: "ir-conj" },
  { pt: "Nós iremos", en: "We will go", category_id: "ir-conj" },
  { pt: "Vocês irão", en: "You all will go", category_id: "ir-conj" },
  { pt: "Eles/Elas irão", en: "They will go", category_id: "ir-conj" },
  // Ir — Conditional
  { pt: "Eu iria", en: "I would go", category_id: "ir-conj" },
  { pt: "Você iria", en: "You would go", category_id: "ir-conj" },
  { pt: "Ele/Ela iria", en: "He/She would go", category_id: "ir-conj" },
  { pt: "Nós iríamos", en: "We would go", category_id: "ir-conj" },
  { pt: "Vocês iriam", en: "You all would go", category_id: "ir-conj" },
  { pt: "Eles/Elas iriam", en: "They would go", category_id: "ir-conj" },
```

- [ ] **Step 2: Replace all Ser conjugation cards**

Remove all existing ser-conj cards and replace with:

```javascript
  // Ser — Presente
  { pt: "Eu sou", en: "I am", category_id: "ser-conj" },
  { pt: "Você é", en: "You are", category_id: "ser-conj" },
  { pt: "Ele/Ela é", en: "He/She is", category_id: "ser-conj" },
  { pt: "Nós somos", en: "We are", category_id: "ser-conj" },
  { pt: "Vocês são", en: "You all are", category_id: "ser-conj" },
  { pt: "Eles/Elas são", en: "They are", category_id: "ser-conj" },
  // Ser — Imperfeito
  { pt: "Eu era", en: "I used to be", category_id: "ser-conj" },
  { pt: "Você era", en: "You used to be", category_id: "ser-conj" },
  { pt: "Ele/Ela era", en: "He/She used to be", category_id: "ser-conj" },
  { pt: "Nós éramos", en: "We used to be", category_id: "ser-conj" },
  { pt: "Vocês eram", en: "You all used to be", category_id: "ser-conj" },
  { pt: "Eles/Elas eram", en: "They used to be", category_id: "ser-conj" },
  // Ser — Perfeito (disambiguated with "(ser)" since Ir shares these forms)
  { pt: "Eu fui (ser)", en: "I was", category_id: "ser-conj" },
  { pt: "Você foi (ser)", en: "You were", category_id: "ser-conj" },
  { pt: "Ele/Ela foi (ser)", en: "He/She was", category_id: "ser-conj" },
  { pt: "Nós fomos (ser)", en: "We were", category_id: "ser-conj" },
  { pt: "Vocês foram (ser)", en: "You all were", category_id: "ser-conj" },
  { pt: "Eles/Elas foram (ser)", en: "They were", category_id: "ser-conj" },
  // Ser — Futuro
  { pt: "Eu serei", en: "I will be", category_id: "ser-conj" },
  { pt: "Você será", en: "You will be", category_id: "ser-conj" },
  { pt: "Ele/Ela será", en: "He/She will be", category_id: "ser-conj" },
  { pt: "Nós seremos", en: "We will be", category_id: "ser-conj" },
  { pt: "Vocês serão", en: "You all will be", category_id: "ser-conj" },
  { pt: "Eles/Elas serão", en: "They will be", category_id: "ser-conj" },
  // Ser — Conditional
  { pt: "Eu seria", en: "I would be", category_id: "ser-conj" },
  { pt: "Você seria", en: "You would be", category_id: "ser-conj" },
  { pt: "Ele/Ela seria", en: "He/She would be", category_id: "ser-conj" },
  { pt: "Nós seríamos", en: "We would be", category_id: "ser-conj" },
  { pt: "Vocês seriam", en: "You all would be", category_id: "ser-conj" },
  { pt: "Eles/Elas seriam", en: "They would be", category_id: "ser-conj" },
```

- [ ] **Step 3: Verify and commit**

Run: `node -e "const d = require('./seed-data.js'); ['ir-conj','ser-conj'].forEach(c => { const n = d.cards.filter(x => x.category_id === c).length; console.log(c + ': ' + n + ' cards'); }); const old = d.cards.filter(x => x.pt.match(/^(Ir|Ser) \\(/)); console.log('Remaining old-format IR/Ser: ' + old.length);"`

Expected:
```
ir-conj: 30 cards
ser-conj: 30 cards
Remaining old-format IR/Ser: 0
```

Commit:
```bash
git add seed-data.js
git commit -m "refactor: reformat IR and Ser to clean format with homograph disambiguation"
```

---

### Task 3: Reformat Estar and expand to full paradigm

**Files:**
- Modify: `seed-data.js`

Estar currently has 15 cards (Imperfeito, Presente, Futuro — 3 tenses x ~5 persons, missing eu forms for Presente). Needs reformatting + adding Perfeito and Conditional tenses.

- [ ] **Step 1: Replace all Estar conjugation cards**

Remove all existing estar-conj cards and replace with:

```javascript
  // Estar — Presente
  { pt: "Eu estou", en: "I am (state)", category_id: "estar-conj" },
  { pt: "Você está", en: "You are (state)", category_id: "estar-conj" },
  { pt: "Ele/Ela está", en: "He/She is (state)", category_id: "estar-conj" },
  { pt: "Nós estamos", en: "We are (state)", category_id: "estar-conj" },
  { pt: "Vocês estão", en: "You all are (state)", category_id: "estar-conj" },
  { pt: "Eles/Elas estão", en: "They are (state)", category_id: "estar-conj" },
  // Estar — Imperfeito
  { pt: "Eu estava", en: "I was being / I used to be (state)", category_id: "estar-conj" },
  { pt: "Você estava", en: "You were being / You used to be (state)", category_id: "estar-conj" },
  { pt: "Ele/Ela estava", en: "He/She was being (state)", category_id: "estar-conj" },
  { pt: "Nós estávamos", en: "We were being / We used to be (state)", category_id: "estar-conj" },
  { pt: "Vocês estavam", en: "You all were being (state)", category_id: "estar-conj" },
  { pt: "Eles/Elas estavam", en: "They were being (state)", category_id: "estar-conj" },
  // Estar — Perfeito
  { pt: "Eu estive", en: "I was (state, specific occasion)", category_id: "estar-conj" },
  { pt: "Você esteve", en: "You were (state, specific occasion)", category_id: "estar-conj" },
  { pt: "Ele/Ela esteve", en: "He/She was (state, specific occasion)", category_id: "estar-conj" },
  { pt: "Nós estivemos", en: "We were (state, specific occasion)", category_id: "estar-conj" },
  { pt: "Vocês estiveram", en: "You all were (state, specific occasion)", category_id: "estar-conj" },
  { pt: "Eles/Elas estiveram", en: "They were (state, specific occasion)", category_id: "estar-conj" },
  // Estar — Futuro
  { pt: "Eu estarei", en: "I will be (state)", category_id: "estar-conj" },
  { pt: "Você estará", en: "You will be (state)", category_id: "estar-conj" },
  { pt: "Ele/Ela estará", en: "He/She will be (state)", category_id: "estar-conj" },
  { pt: "Nós estaremos", en: "We will be (state)", category_id: "estar-conj" },
  { pt: "Vocês estarão", en: "You all will be (state)", category_id: "estar-conj" },
  { pt: "Eles/Elas estarão", en: "They will be (state)", category_id: "estar-conj" },
  // Estar — Conditional
  { pt: "Eu estaria", en: "I would be (state)", category_id: "estar-conj" },
  { pt: "Você estaria", en: "You would be (state)", category_id: "estar-conj" },
  { pt: "Ele/Ela estaria", en: "He/She would be (state)", category_id: "estar-conj" },
  { pt: "Nós estaríamos", en: "We would be (state)", category_id: "estar-conj" },
  { pt: "Vocês estariam", en: "You all would be (state)", category_id: "estar-conj" },
  { pt: "Eles/Elas estariam", en: "They would be (state)", category_id: "estar-conj" },
```

Note: Estar translations include "(state)" to distinguish from Ser ("to be" permanent). This helps learners understand when to use estar vs ser.

- [ ] **Step 2: Verify and commit**

Run: `node -e "const d = require('./seed-data.js'); const n = d.cards.filter(x => x.category_id === 'estar-conj').length; console.log('estar-conj: ' + n + ' cards'); const old = d.cards.filter(x => x.pt.match(/^Estar \\(/)); console.log('Remaining old-format Estar: ' + old.length);"`

Expected:
```
estar-conj: 30 cards
Remaining old-format Estar: 0
```

Commit:
```bash
git add seed-data.js
git commit -m "refactor: reformat Estar to clean format and expand to full paradigm"
```

---

### Task 4: Expand Esperar, Buscar, Tomar, Trabalhar to full paradigms

**Files:**
- Modify: `seed-data.js`

These verbs currently have 0 cards (their simple 3-card versions were removed in Task 1). They need full 30-card paradigms. All are regular verbs (-ar conjugation pattern).

- [ ] **Step 1: Add Esperar full paradigm (30 cards)**

Add after the existing esperar-conj location (or at end of conjugation section):

```javascript
  // Esperar — Presente
  { pt: "Eu espero", en: "I wait / I hope", category_id: "esperar-conj" },
  { pt: "Você espera", en: "You wait / You hope", category_id: "esperar-conj" },
  { pt: "Ele/Ela espera", en: "He/She waits / hopes", category_id: "esperar-conj" },
  { pt: "Nós esperamos", en: "We wait / We hope", category_id: "esperar-conj" },
  { pt: "Vocês esperam", en: "You all wait / hope", category_id: "esperar-conj" },
  { pt: "Eles/Elas esperam", en: "They wait / hope", category_id: "esperar-conj" },
  // Esperar — Imperfeito
  { pt: "Eu esperava", en: "I used to wait / I was hoping", category_id: "esperar-conj" },
  { pt: "Você esperava", en: "You used to wait / You were hoping", category_id: "esperar-conj" },
  { pt: "Ele/Ela esperava", en: "He/She used to wait / was hoping", category_id: "esperar-conj" },
  { pt: "Nós esperávamos", en: "We used to wait / We were hoping", category_id: "esperar-conj" },
  { pt: "Vocês esperavam", en: "You all used to wait / were hoping", category_id: "esperar-conj" },
  { pt: "Eles/Elas esperavam", en: "They used to wait / were hoping", category_id: "esperar-conj" },
  // Esperar — Perfeito
  { pt: "Eu esperei", en: "I waited / I hoped", category_id: "esperar-conj" },
  { pt: "Você esperou", en: "You waited / You hoped", category_id: "esperar-conj" },
  { pt: "Ele/Ela esperou", en: "He/She waited / hoped", category_id: "esperar-conj" },
  { pt: "Nós esperamos (past)", en: "We waited / We hoped", category_id: "esperar-conj" },
  { pt: "Vocês esperaram", en: "You all waited / hoped", category_id: "esperar-conj" },
  { pt: "Eles/Elas esperaram", en: "They waited / hoped", category_id: "esperar-conj" },
  // Esperar — Futuro
  { pt: "Eu esperarei", en: "I will wait / I will hope", category_id: "esperar-conj" },
  { pt: "Você esperará", en: "You will wait / You will hope", category_id: "esperar-conj" },
  { pt: "Ele/Ela esperará", en: "He/She will wait / will hope", category_id: "esperar-conj" },
  { pt: "Nós esperaremos", en: "We will wait / We will hope", category_id: "esperar-conj" },
  { pt: "Vocês esperarão", en: "You all will wait / will hope", category_id: "esperar-conj" },
  { pt: "Eles/Elas esperarão", en: "They will wait / will hope", category_id: "esperar-conj" },
  // Esperar — Conditional
  { pt: "Eu esperaria", en: "I would wait / I would hope", category_id: "esperar-conj" },
  { pt: "Você esperaria", en: "You would wait / You would hope", category_id: "esperar-conj" },
  { pt: "Ele/Ela esperaria", en: "He/She would wait / would hope", category_id: "esperar-conj" },
  { pt: "Nós esperaríamos", en: "We would wait / We would hope", category_id: "esperar-conj" },
  { pt: "Vocês esperariam", en: "You all would wait / would hope", category_id: "esperar-conj" },
  { pt: "Eles/Elas esperariam", en: "They would wait / would hope", category_id: "esperar-conj" },
```

Note: "Nós esperamos" appears in both Presente and Perfeito — add "(past)" to PT for Perfeito.

- [ ] **Step 2: Add Buscar full paradigm (30 cards)**

```javascript
  // Buscar — Presente
  { pt: "Eu busco", en: "I search / I fetch", category_id: "buscar-conj" },
  { pt: "Você busca", en: "You search / You fetch", category_id: "buscar-conj" },
  { pt: "Ele/Ela busca", en: "He/She searches / fetches", category_id: "buscar-conj" },
  { pt: "Nós buscamos", en: "We search / We fetch", category_id: "buscar-conj" },
  { pt: "Vocês buscam", en: "You all search / fetch", category_id: "buscar-conj" },
  { pt: "Eles/Elas buscam", en: "They search / fetch", category_id: "buscar-conj" },
  // Buscar — Imperfeito
  { pt: "Eu buscava", en: "I used to search / I was looking for", category_id: "buscar-conj" },
  { pt: "Você buscava", en: "You used to search / You were looking for", category_id: "buscar-conj" },
  { pt: "Ele/Ela buscava", en: "He/She used to search / was looking for", category_id: "buscar-conj" },
  { pt: "Nós buscávamos", en: "We used to search / We were looking for", category_id: "buscar-conj" },
  { pt: "Vocês buscavam", en: "You all used to search / were looking for", category_id: "buscar-conj" },
  { pt: "Eles/Elas buscavam", en: "They used to search / were looking for", category_id: "buscar-conj" },
  // Buscar — Perfeito
  { pt: "Eu busquei", en: "I searched / I fetched", category_id: "buscar-conj" },
  { pt: "Você buscou", en: "You searched / You fetched", category_id: "buscar-conj" },
  { pt: "Ele/Ela buscou", en: "He/She searched / fetched", category_id: "buscar-conj" },
  { pt: "Nós buscamos (past)", en: "We searched / We fetched", category_id: "buscar-conj" },
  { pt: "Vocês buscaram", en: "You all searched / fetched", category_id: "buscar-conj" },
  { pt: "Eles/Elas buscaram", en: "They searched / fetched", category_id: "buscar-conj" },
  // Buscar — Futuro
  { pt: "Eu buscarei", en: "I will search / I will fetch", category_id: "buscar-conj" },
  { pt: "Você buscará", en: "You will search / You will fetch", category_id: "buscar-conj" },
  { pt: "Ele/Ela buscará", en: "He/She will search / will fetch", category_id: "buscar-conj" },
  { pt: "Nós buscaremos", en: "We will search / We will fetch", category_id: "buscar-conj" },
  { pt: "Vocês buscarão", en: "You all will search / will fetch", category_id: "buscar-conj" },
  { pt: "Eles/Elas buscarão", en: "They will search / will fetch", category_id: "buscar-conj" },
  // Buscar — Conditional
  { pt: "Eu buscaria", en: "I would search / I would fetch", category_id: "buscar-conj" },
  { pt: "Você buscaria", en: "You would search / You would fetch", category_id: "buscar-conj" },
  { pt: "Ele/Ela buscaria", en: "He/She would search / would fetch", category_id: "buscar-conj" },
  { pt: "Nós buscaríamos", en: "We would search / We would fetch", category_id: "buscar-conj" },
  { pt: "Vocês buscariam", en: "You all would search / would fetch", category_id: "buscar-conj" },
  { pt: "Eles/Elas buscariam", en: "They would search / would fetch", category_id: "buscar-conj" },
```

- [ ] **Step 3: Add Tomar full paradigm (30 cards)**

```javascript
  // Tomar — Presente
  { pt: "Eu tomo", en: "I take / I drink", category_id: "tomar-conj" },
  { pt: "Você toma", en: "You take / You drink", category_id: "tomar-conj" },
  { pt: "Ele/Ela toma", en: "He/She takes / drinks", category_id: "tomar-conj" },
  { pt: "Nós tomamos", en: "We take / We drink", category_id: "tomar-conj" },
  { pt: "Vocês tomam", en: "You all take / drink", category_id: "tomar-conj" },
  { pt: "Eles/Elas tomam", en: "They take / drink", category_id: "tomar-conj" },
  // Tomar — Imperfeito
  { pt: "Eu tomava", en: "I used to take / I used to drink", category_id: "tomar-conj" },
  { pt: "Você tomava", en: "You used to take / You used to drink", category_id: "tomar-conj" },
  { pt: "Ele/Ela tomava", en: "He/She used to take / drink", category_id: "tomar-conj" },
  { pt: "Nós tomávamos", en: "We used to take / We used to drink", category_id: "tomar-conj" },
  { pt: "Vocês tomavam", en: "You all used to take / drink", category_id: "tomar-conj" },
  { pt: "Eles/Elas tomavam", en: "They used to take / drink", category_id: "tomar-conj" },
  // Tomar — Perfeito
  { pt: "Eu tomei", en: "I took / I drank", category_id: "tomar-conj" },
  { pt: "Você tomou", en: "You took / You drank", category_id: "tomar-conj" },
  { pt: "Ele/Ela tomou", en: "He/She took / drank", category_id: "tomar-conj" },
  { pt: "Nós tomamos (past)", en: "We took / We drank", category_id: "tomar-conj" },
  { pt: "Vocês tomaram", en: "You all took / drank", category_id: "tomar-conj" },
  { pt: "Eles/Elas tomaram", en: "They took / drank", category_id: "tomar-conj" },
  // Tomar — Futuro
  { pt: "Eu tomarei", en: "I will take / I will drink", category_id: "tomar-conj" },
  { pt: "Você tomará", en: "You will take / You will drink", category_id: "tomar-conj" },
  { pt: "Ele/Ela tomará", en: "He/She will take / will drink", category_id: "tomar-conj" },
  { pt: "Nós tomaremos", en: "We will take / We will drink", category_id: "tomar-conj" },
  { pt: "Vocês tomarão", en: "You all will take / will drink", category_id: "tomar-conj" },
  { pt: "Eles/Elas tomarão", en: "They will take / will drink", category_id: "tomar-conj" },
  // Tomar — Conditional
  { pt: "Eu tomaria", en: "I would take / I would drink", category_id: "tomar-conj" },
  { pt: "Você tomaria", en: "You would take / You would drink", category_id: "tomar-conj" },
  { pt: "Ele/Ela tomaria", en: "He/She would take / would drink", category_id: "tomar-conj" },
  { pt: "Nós tomaríamos", en: "We would take / We would drink", category_id: "tomar-conj" },
  { pt: "Vocês tomariam", en: "You all would take / would drink", category_id: "tomar-conj" },
  { pt: "Eles/Elas tomariam", en: "They would take / would drink", category_id: "tomar-conj" },
```

- [ ] **Step 4: Add Trabalhar full paradigm (30 cards)**

Remove the 3 existing old-format trabalhar-conj cards and replace with:

```javascript
  // Trabalhar — Presente
  { pt: "Eu trabalho", en: "I work", category_id: "trabalhar-conj" },
  { pt: "Você trabalha", en: "You work", category_id: "trabalhar-conj" },
  { pt: "Ele/Ela trabalha", en: "He/She works", category_id: "trabalhar-conj" },
  { pt: "Nós trabalhamos", en: "We work", category_id: "trabalhar-conj" },
  { pt: "Vocês trabalham", en: "You all work", category_id: "trabalhar-conj" },
  { pt: "Eles/Elas trabalham", en: "They work", category_id: "trabalhar-conj" },
  // Trabalhar — Imperfeito
  { pt: "Eu trabalhava", en: "I used to work", category_id: "trabalhar-conj" },
  { pt: "Você trabalhava", en: "You used to work", category_id: "trabalhar-conj" },
  { pt: "Ele/Ela trabalhava", en: "He/She used to work", category_id: "trabalhar-conj" },
  { pt: "Nós trabalhávamos", en: "We used to work", category_id: "trabalhar-conj" },
  { pt: "Vocês trabalhavam", en: "You all used to work", category_id: "trabalhar-conj" },
  { pt: "Eles/Elas trabalhavam", en: "They used to work", category_id: "trabalhar-conj" },
  // Trabalhar — Perfeito
  { pt: "Eu trabalhei", en: "I worked", category_id: "trabalhar-conj" },
  { pt: "Você trabalhou", en: "You worked", category_id: "trabalhar-conj" },
  { pt: "Ele/Ela trabalhou", en: "He/She worked", category_id: "trabalhar-conj" },
  { pt: "Nós trabalhamos (past)", en: "We worked", category_id: "trabalhar-conj" },
  { pt: "Vocês trabalharam", en: "You all worked", category_id: "trabalhar-conj" },
  { pt: "Eles/Elas trabalharam", en: "They worked", category_id: "trabalhar-conj" },
  // Trabalhar — Futuro
  { pt: "Eu trabalharei", en: "I will work", category_id: "trabalhar-conj" },
  { pt: "Você trabalhará", en: "You will work", category_id: "trabalhar-conj" },
  { pt: "Ele/Ela trabalhará", en: "He/She will work", category_id: "trabalhar-conj" },
  { pt: "Nós trabalharemos", en: "We will work", category_id: "trabalhar-conj" },
  { pt: "Vocês trabalharão", en: "You all will work", category_id: "trabalhar-conj" },
  { pt: "Eles/Elas trabalharão", en: "They will work", category_id: "trabalhar-conj" },
  // Trabalhar — Conditional
  { pt: "Eu trabalharia", en: "I would work", category_id: "trabalhar-conj" },
  { pt: "Você trabalharia", en: "You would work", category_id: "trabalhar-conj" },
  { pt: "Ele/Ela trabalharia", en: "He/She would work", category_id: "trabalhar-conj" },
  { pt: "Nós trabalharíamos", en: "We would work", category_id: "trabalhar-conj" },
  { pt: "Vocês trabalhariam", en: "You all would work", category_id: "trabalhar-conj" },
  { pt: "Eles/Elas trabalhariam", en: "They would work", category_id: "trabalhar-conj" },
```

- [ ] **Step 5: Verify and commit**

Run: `node -e "const d = require('./seed-data.js'); ['esperar-conj','buscar-conj','tomar-conj','trabalhar-conj'].forEach(c => { const n = d.cards.filter(x => x.category_id === c).length; console.log(c + ': ' + n + ' cards'); });"`

Expected:
```
esperar-conj: 30 cards
buscar-conj: 30 cards
tomar-conj: 30 cards
trabalhar-conj: 30 cards
```

Commit:
```bash
git add seed-data.js
git commit -m "feat: expand Esperar, Buscar, Tomar, Trabalhar to full 30-card paradigms"
```

---

### Task 5: Fix and expand Fazer to full paradigm

**Files:**
- Modify: `seed-data.js`

Fazer currently has 5 cards in old format with wrong present tense (uses "estou fazendo" instead of "faço"). Replace entirely with clean 30-card paradigm.

- [ ] **Step 1: Replace all Fazer conjugation cards**

Remove all existing fazer-conj cards and replace with:

```javascript
  // Fazer — Presente
  { pt: "Eu faço", en: "I do / I make", category_id: "fazer-conj" },
  { pt: "Você faz", en: "You do / You make", category_id: "fazer-conj" },
  { pt: "Ele/Ela faz", en: "He/She does / makes", category_id: "fazer-conj" },
  { pt: "Nós fazemos", en: "We do / We make", category_id: "fazer-conj" },
  { pt: "Vocês fazem", en: "You all do / make", category_id: "fazer-conj" },
  { pt: "Eles/Elas fazem", en: "They do / make", category_id: "fazer-conj" },
  // Fazer — Imperfeito
  { pt: "Eu fazia", en: "I used to do / I used to make", category_id: "fazer-conj" },
  { pt: "Você fazia", en: "You used to do / You used to make", category_id: "fazer-conj" },
  { pt: "Ele/Ela fazia", en: "He/She used to do / make", category_id: "fazer-conj" },
  { pt: "Nós fazíamos", en: "We used to do / We used to make", category_id: "fazer-conj" },
  { pt: "Vocês faziam", en: "You all used to do / make", category_id: "fazer-conj" },
  { pt: "Eles/Elas faziam", en: "They used to do / make", category_id: "fazer-conj" },
  // Fazer — Perfeito
  { pt: "Eu fiz", en: "I did / I made", category_id: "fazer-conj" },
  { pt: "Você fez", en: "You did / You made", category_id: "fazer-conj" },
  { pt: "Ele/Ela fez", en: "He/She did / made", category_id: "fazer-conj" },
  { pt: "Nós fizemos", en: "We did / We made", category_id: "fazer-conj" },
  { pt: "Vocês fizeram", en: "You all did / made", category_id: "fazer-conj" },
  { pt: "Eles/Elas fizeram", en: "They did / made", category_id: "fazer-conj" },
  // Fazer — Futuro
  { pt: "Eu farei", en: "I will do / I will make", category_id: "fazer-conj" },
  { pt: "Você fará", en: "You will do / You will make", category_id: "fazer-conj" },
  { pt: "Ele/Ela fará", en: "He/She will do / will make", category_id: "fazer-conj" },
  { pt: "Nós faremos", en: "We will do / We will make", category_id: "fazer-conj" },
  { pt: "Vocês farão", en: "You all will do / will make", category_id: "fazer-conj" },
  { pt: "Eles/Elas farão", en: "They will do / will make", category_id: "fazer-conj" },
  // Fazer — Conditional
  { pt: "Eu faria", en: "I would do / I would make", category_id: "fazer-conj" },
  { pt: "Você faria", en: "You would do / You would make", category_id: "fazer-conj" },
  { pt: "Ele/Ela faria", en: "He/She would do / would make", category_id: "fazer-conj" },
  { pt: "Nós faríamos", en: "We would do / We would make", category_id: "fazer-conj" },
  { pt: "Vocês fariam", en: "You all would do / would make", category_id: "fazer-conj" },
  { pt: "Eles/Elas fariam", en: "They would do / would make", category_id: "fazer-conj" },
```

- [ ] **Step 2: Verify and commit**

Run: `node -e "const d = require('./seed-data.js'); const n = d.cards.filter(x => x.category_id === 'fazer-conj').length; console.log('fazer-conj: ' + n + ' cards'); const old = d.cards.filter(x => x.pt.match(/^Fazer \\(/)); console.log('Remaining old-format Fazer: ' + old.length);"`

Expected:
```
fazer-conj: 30 cards
Remaining old-format Fazer: 0
```

Commit:
```bash
git add seed-data.js
git commit -m "feat: fix Fazer present tense and expand to full 30-card paradigm"
```

---

### Task 6: Add Futuro tense to Ter, Poder, Querer, Saber, Dar, Ver, Vir + disambiguate homographs

**Files:**
- Modify: `seed-data.js`

These 7 verbs already use clean format but are missing Futuro tense (6 cards each = 42 new cards). Also need to disambiguate "Nós vimos" which appears in both Vir (presente) and Ver (perfeito).

- [ ] **Step 1: Add Futuro cards for Ter**

Insert after the existing Ter Conditional block:

```javascript
  // Ter — Futuro
  { pt: "Eu terei", en: "I will have", category_id: "ter-conj" },
  { pt: "Você terá", en: "You will have", category_id: "ter-conj" },
  { pt: "Ele/Ela terá", en: "He/She will have", category_id: "ter-conj" },
  { pt: "Nós teremos", en: "We will have", category_id: "ter-conj" },
  { pt: "Vocês terão", en: "You all will have", category_id: "ter-conj" },
  { pt: "Eles/Elas terão", en: "They will have", category_id: "ter-conj" },
```

- [ ] **Step 2: Add Futuro cards for Poder**

Insert after the existing Poder Conditional block:

```javascript
  // Poder — Futuro
  { pt: "Eu poderei", en: "I will be able to", category_id: "poder-conj" },
  { pt: "Você poderá", en: "You will be able to", category_id: "poder-conj" },
  { pt: "Ele/Ela poderá", en: "He/She will be able to", category_id: "poder-conj" },
  { pt: "Nós poderemos", en: "We will be able to", category_id: "poder-conj" },
  { pt: "Vocês poderão", en: "You all will be able to", category_id: "poder-conj" },
  { pt: "Eles/Elas poderão", en: "They will be able to", category_id: "poder-conj" },
```

- [ ] **Step 3: Add Futuro cards for Querer**

Insert after the existing Querer Conditional block:

```javascript
  // Querer — Futuro
  { pt: "Eu quererei", en: "I will want", category_id: "querer-conj" },
  { pt: "Você quererá", en: "You will want", category_id: "querer-conj" },
  { pt: "Ele/Ela quererá", en: "He/She will want", category_id: "querer-conj" },
  { pt: "Nós quereremos", en: "We will want", category_id: "querer-conj" },
  { pt: "Vocês quererão", en: "You all will want", category_id: "querer-conj" },
  { pt: "Eles/Elas quererão", en: "They will want", category_id: "querer-conj" },
```

- [ ] **Step 4: Add Futuro cards for Saber**

Insert after the existing Saber Conditional block:

```javascript
  // Saber — Futuro
  { pt: "Eu saberei", en: "I will know", category_id: "saber-conj" },
  { pt: "Você saberá", en: "You will know", category_id: "saber-conj" },
  { pt: "Ele/Ela saberá", en: "He/She will know", category_id: "saber-conj" },
  { pt: "Nós saberemos", en: "We will know", category_id: "saber-conj" },
  { pt: "Vocês saberão", en: "You all will know", category_id: "saber-conj" },
  { pt: "Eles/Elas saberão", en: "They will know", category_id: "saber-conj" },
```

- [ ] **Step 5: Add Futuro cards for Dar**

Insert after the existing Dar Conditional block:

```javascript
  // Dar — Futuro
  { pt: "Eu darei", en: "I will give", category_id: "dar-conj" },
  { pt: "Você dará", en: "You will give", category_id: "dar-conj" },
  { pt: "Ele/Ela dará", en: "He/She will give", category_id: "dar-conj" },
  { pt: "Nós daremos", en: "We will give", category_id: "dar-conj" },
  { pt: "Vocês darão", en: "You all will give", category_id: "dar-conj" },
  { pt: "Eles/Elas darão", en: "They will give", category_id: "dar-conj" },
```

- [ ] **Step 6: Add Futuro cards for Ver**

Insert after the existing Ver Conditional block:

```javascript
  // Ver — Futuro
  { pt: "Eu verei", en: "I will see", category_id: "ver-conj" },
  { pt: "Você verá", en: "You will see", category_id: "ver-conj" },
  { pt: "Ele/Ela verá", en: "He/She will see", category_id: "ver-conj" },
  { pt: "Nós veremos", en: "We will see", category_id: "ver-conj" },
  { pt: "Vocês verão", en: "You all will see", category_id: "ver-conj" },
  { pt: "Eles/Elas verão", en: "They will see", category_id: "ver-conj" },
```

- [ ] **Step 7: Add Futuro cards for Vir**

Insert after the existing Vir Conditional block:

```javascript
  // Vir — Futuro
  { pt: "Eu virei", en: "I will come", category_id: "vir-conj" },
  { pt: "Você virá", en: "You will come", category_id: "vir-conj" },
  { pt: "Ele/Ela virá", en: "He/She will come", category_id: "vir-conj" },
  { pt: "Nós viremos", en: "We will come", category_id: "vir-conj" },
  { pt: "Vocês virão", en: "You all will come", category_id: "vir-conj" },
  { pt: "Eles/Elas virão", en: "They will come", category_id: "vir-conj" },
```

- [ ] **Step 8: Disambiguate "Nós vimos" homograph**

Find and update these two cards:

In vir-conj Presente, change:
- `{ pt: "Nós vimos", en: "We come" }` → `{ pt: "Nós vimos (vir)", en: "We come" }`

In ver-conj Perfeito, change:
- `{ pt: "Nós vimos", en: "We saw" }` → `{ pt: "Nós vimos (ver)", en: "We saw" }`

- [ ] **Step 9: Verify and commit**

Run: `node -e "const d = require('./seed-data.js'); ['ter-conj','poder-conj','querer-conj','saber-conj','dar-conj','ver-conj','vir-conj'].forEach(c => { const n = d.cards.filter(x => x.category_id === c).length; console.log(c + ': ' + n + ' cards'); }); const vimos = d.cards.filter(x => x.pt === 'Nós vimos'); console.log('Ambiguous Nós vimos remaining: ' + vimos.length);"`

Expected:
```
ter-conj: 30 cards
poder-conj: 30 cards
querer-conj: 30 cards
saber-conj: 30 cards
dar-conj: 30 cards
ver-conj: 30 cards
vir-conj: 30 cards
Ambiguous Nós vimos remaining: 0
```

Commit:
```bash
git add seed-data.js
git commit -m "feat: add Futuro tense to 7 verbs and disambiguate homographs"
```

---

### Task 7: Final verification

**Files:**
- Read: `seed-data.js`

- [ ] **Step 1: Verify all 19 conjugation verbs have exactly 30 cards**

Run:
```bash
node -e "
const d = require('./seed-data.js');
const conjs = d.categories.filter(c => c.id.endsWith('-conj')).map(c => c.id);
let total = 0;
let allGood = true;
conjs.forEach(c => {
  const n = d.cards.filter(x => x.category_id === c).length;
  total += n;
  const status = n === 30 ? 'OK' : 'WRONG';
  if (n !== 30) allGood = false;
  console.log(c + ': ' + n + ' cards ' + status);
});
console.log('---');
console.log('Total conjugation cards: ' + total);
console.log('Expected: ' + (conjs.length * 30));
console.log(allGood ? 'ALL GOOD' : 'PROBLEMS FOUND');
"
```

Expected: All 19 verbs show 30 cards, total = 570, ALL GOOD.

- [ ] **Step 2: Verify no old-format cards remain**

Run:
```bash
node -e "
const d = require('./seed-data.js');
const oldFormat = d.cards.filter(x => x.pt.match(/^[A-Z][a-záéíóúâêô]+ \\(/) && x.category_id.endsWith('-conj') && !x.pt.match(/\\((ir|ser|vir|ver|past)\\)/));
console.log('Old-format conjugation cards remaining: ' + oldFormat.length);
if (oldFormat.length > 0) oldFormat.forEach(c => console.log('  ' + c.pt));
"
```

Expected: `Old-format conjugation cards remaining: 0`

- [ ] **Step 3: Verify file parses cleanly**

Run: `node -e "const d = require('./seed-data.js'); console.log('Categories: ' + d.categories.length); console.log('Total cards: ' + d.cards.length); console.log('Parse OK');"`

Expected: Parse OK with expected category and card counts.
