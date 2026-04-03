# Unconjugated Verbs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mixed "verbs" category with 6 frequency-tiered unconjugated verb categories (300 verbs total) under a "Verbs" group.

**Architecture:** All changes are in `seed-data.js` — replace one category entry + 19 card entries with 6 category entries + 300 card entries. No server or frontend changes needed since categories/cards are data-driven.

**Tech Stack:** Node.js seed data, PostgreSQL (seeded on first run)

---

### Task 1: Remove old "verbs" category and cards

**Files:**
- Modify: `seed-data.js:5` (category entry)
- Modify: `seed-data.js:79,107-119,374-375,380-382,384,402-404,414` (card entries)

- [ ] **Step 1: Remove the "verbs" category entry**

In `seed-data.js`, replace line 5:

```javascript
  { id: "verbs", label: "Verbs", css_class: "cat-verbs", group_name: "Topics" },
```

with the 6 new category entries:

```javascript
  { id: "verbs-essential", label: "Essential Verbs", css_class: "cat-verbs-essential", group_name: "Verbs" },
  { id: "verbs-common", label: "Common Verbs", css_class: "cat-verbs-common", group_name: "Verbs" },
  { id: "verbs-everyday", label: "Everyday Verbs", css_class: "cat-verbs-everyday", group_name: "Verbs" },
  { id: "verbs-practical", label: "Practical Verbs", css_class: "cat-verbs-practical", group_name: "Verbs" },
  { id: "verbs-expanding", label: "Expanding Verbs", css_class: "cat-verbs-expanding", group_name: "Verbs" },
  { id: "verbs-advanced", label: "Advanced Verbs", css_class: "cat-verbs-advanced", group_name: "Verbs" },
```

- [ ] **Step 2: Remove all old "verbs" card entries**

Delete all 19 lines containing `category_id: "verbs"` from the cards array. These are at lines: 79, 107, 108, 114, 115, 116, 117, 118, 119, 374, 375, 380, 381, 382, 384, 402, 403, 404, 414.

- [ ] **Step 3: Verify seed-data.js still parses**

Run: `node -e "require('./seed-data.js'); console.log('OK')"`
Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add seed-data.js
git commit -m "feat: remove old verbs category, add 6 verb tier categories"
```

---

### Task 2: Add Essential Verbs (verbs-essential, 50 cards)

**Files:**
- Modify: `seed-data.js` (append cards to cards array, before closing `];`)

- [ ] **Step 1: Add 50 essential verb cards**

Add the following entries before the closing `];` of the cards array in `seed-data.js`:

```javascript
  // ── Verbs: Essential (1-50) ──
  { pt: "Ser", en: "To be (permanent)", category_id: "verbs-essential" },
  { pt: "Estar", en: "To be (temporary)", category_id: "verbs-essential" },
  { pt: "Ter", en: "To have", category_id: "verbs-essential" },
  { pt: "Fazer", en: "To do / To make", category_id: "verbs-essential" },
  { pt: "Ir", en: "To go", category_id: "verbs-essential" },
  { pt: "Poder", en: "To be able to / Can", category_id: "verbs-essential" },
  { pt: "Dizer", en: "To say / To tell", category_id: "verbs-essential" },
  { pt: "Dar", en: "To give", category_id: "verbs-essential" },
  { pt: "Saber", en: "To know (facts)", category_id: "verbs-essential" },
  { pt: "Querer", en: "To want", category_id: "verbs-essential" },
  { pt: "Ver", en: "To see", category_id: "verbs-essential" },
  { pt: "Vir", en: "To come", category_id: "verbs-essential" },
  { pt: "Dever", en: "Should / To owe", category_id: "verbs-essential" },
  { pt: "Ficar", en: "To stay / To become", category_id: "verbs-essential" },
  { pt: "Falar", en: "To speak / To talk", category_id: "verbs-essential" },
  { pt: "Deixar", en: "To leave / To let", category_id: "verbs-essential" },
  { pt: "Passar", en: "To pass / To spend (time)", category_id: "verbs-essential" },
  { pt: "Chegar", en: "To arrive", category_id: "verbs-essential" },
  { pt: "Encontrar", en: "To find / To meet", category_id: "verbs-essential" },
  { pt: "Pensar", en: "To think", category_id: "verbs-essential" },
  { pt: "Levar", en: "To take / To carry", category_id: "verbs-essential" },
  { pt: "Conhecer", en: "To know (people/places)", category_id: "verbs-essential" },
  { pt: "Precisar", en: "To need", category_id: "verbs-essential" },
  { pt: "Começar", en: "To start / To begin", category_id: "verbs-essential" },
  { pt: "Pedir", en: "To ask for / To order", category_id: "verbs-essential" },
  { pt: "Parecer", en: "To seem / To appear", category_id: "verbs-essential" },
  { pt: "Acreditar", en: "To believe", category_id: "verbs-essential" },
  { pt: "Olhar", en: "To look", category_id: "verbs-essential" },
  { pt: "Chamar", en: "To call", category_id: "verbs-essential" },
  { pt: "Trabalhar", en: "To work", category_id: "verbs-essential" },
  { pt: "Comer", en: "To eat", category_id: "verbs-essential" },
  { pt: "Beber", en: "To drink", category_id: "verbs-essential" },
  { pt: "Dormir", en: "To sleep", category_id: "verbs-essential" },
  { pt: "Morar", en: "To live (reside)", category_id: "verbs-essential" },
  { pt: "Esperar", en: "To wait / To hope", category_id: "verbs-essential" },
  { pt: "Gostar", en: "To like", category_id: "verbs-essential" },
  { pt: "Achar", en: "To think / To find", category_id: "verbs-essential" },
  { pt: "Entender", en: "To understand", category_id: "verbs-essential" },
  { pt: "Colocar", en: "To put / To place", category_id: "verbs-essential" },
  { pt: "Perguntar", en: "To ask (a question)", category_id: "verbs-essential" },
  { pt: "Sentir", en: "To feel", category_id: "verbs-essential" },
  { pt: "Comprar", en: "To buy", category_id: "verbs-essential" },
  { pt: "Sair", en: "To leave / To go out", category_id: "verbs-essential" },
  { pt: "Tomar", en: "To take / To drink", category_id: "verbs-essential" },
  { pt: "Lembrar", en: "To remember", category_id: "verbs-essential" },
  { pt: "Voltar", en: "To return / To come back", category_id: "verbs-essential" },
  { pt: "Acabar", en: "To finish / To end", category_id: "verbs-essential" },
  { pt: "Ouvir", en: "To hear / To listen", category_id: "verbs-essential" },
  { pt: "Ler", en: "To read", category_id: "verbs-essential" },
  { pt: "Escrever", en: "To write", category_id: "verbs-essential" },
```

- [ ] **Step 2: Verify**

Run: `node -e "const d = require('./seed-data.js'); console.log(d.cards.filter(c => c.category_id === 'verbs-essential').length)"`
Expected: `50`

- [ ] **Step 3: Commit**

```bash
git add seed-data.js
git commit -m "feat: add 50 essential verbs (tier 1)"
```

---

### Task 3: Add Common Verbs (verbs-common, 50 cards)

**Files:**
- Modify: `seed-data.js` (append cards)

- [ ] **Step 1: Add 50 common verb cards**

Append before the closing `];`:

```javascript
  // ── Verbs: Common (51-100) ──
  { pt: "Correr", en: "To run", category_id: "verbs-common" },
  { pt: "Abrir", en: "To open", category_id: "verbs-common" },
  { pt: "Fechar", en: "To close", category_id: "verbs-common" },
  { pt: "Pagar", en: "To pay", category_id: "verbs-common" },
  { pt: "Vender", en: "To sell", category_id: "verbs-common" },
  { pt: "Ajudar", en: "To help", category_id: "verbs-common" },
  { pt: "Mudar", en: "To change / To move", category_id: "verbs-common" },
  { pt: "Usar", en: "To use", category_id: "verbs-common" },
  { pt: "Tentar", en: "To try", category_id: "verbs-common" },
  { pt: "Acontecer", en: "To happen", category_id: "verbs-common" },
  { pt: "Jogar", en: "To play (games/sports)", category_id: "verbs-common" },
  { pt: "Tocar", en: "To touch / To play (music)", category_id: "verbs-common" },
  { pt: "Andar", en: "To walk", category_id: "verbs-common" },
  { pt: "Viver", en: "To live", category_id: "verbs-common" },
  { pt: "Morrer", en: "To die", category_id: "verbs-common" },
  { pt: "Perder", en: "To lose", category_id: "verbs-common" },
  { pt: "Ganhar", en: "To win / To earn", category_id: "verbs-common" },
  { pt: "Seguir", en: "To follow", category_id: "verbs-common" },
  { pt: "Criar", en: "To create", category_id: "verbs-common" },
  { pt: "Mandar", en: "To send / To order", category_id: "verbs-common" },
  { pt: "Receber", en: "To receive", category_id: "verbs-common" },
  { pt: "Entrar", en: "To enter", category_id: "verbs-common" },
  { pt: "Cair", en: "To fall", category_id: "verbs-common" },
  { pt: "Escolher", en: "To choose", category_id: "verbs-common" },
  { pt: "Continuar", en: "To continue", category_id: "verbs-common" },
  { pt: "Aprender", en: "To learn", category_id: "verbs-common" },
  { pt: "Ensinar", en: "To teach", category_id: "verbs-common" },
  { pt: "Contar", en: "To count / To tell", category_id: "verbs-common" },
  { pt: "Mostrar", en: "To show", category_id: "verbs-common" },
  { pt: "Servir", en: "To serve", category_id: "verbs-common" },
  { pt: "Trazer", en: "To bring", category_id: "verbs-common" },
  { pt: "Pôr", en: "To put", category_id: "verbs-common" },
  { pt: "Tirar", en: "To take off / To remove", category_id: "verbs-common" },
  { pt: "Buscar", en: "To search / To pick up", category_id: "verbs-common" },
  { pt: "Subir", en: "To go up / To climb", category_id: "verbs-common" },
  { pt: "Descer", en: "To go down", category_id: "verbs-common" },
  { pt: "Cortar", en: "To cut", category_id: "verbs-common" },
  { pt: "Guardar", en: "To keep / To save", category_id: "verbs-common" },
  { pt: "Ligar", en: "To call / To turn on", category_id: "verbs-common" },
  { pt: "Desligar", en: "To hang up / To turn off", category_id: "verbs-common" },
  { pt: "Dirigir", en: "To drive", category_id: "verbs-common" },
  { pt: "Parar", en: "To stop", category_id: "verbs-common" },
  { pt: "Terminar", en: "To finish / To end", category_id: "verbs-common" },
  { pt: "Explicar", en: "To explain", category_id: "verbs-common" },
  { pt: "Responder", en: "To answer / To reply", category_id: "verbs-common" },
  { pt: "Esquecer", en: "To forget", category_id: "verbs-common" },
  { pt: "Cuidar", en: "To take care of", category_id: "verbs-common" },
  { pt: "Preocupar", en: "To worry", category_id: "verbs-common" },
  { pt: "Acordar", en: "To wake up", category_id: "verbs-common" },
  { pt: "Trocar", en: "To exchange / To switch", category_id: "verbs-common" },
```

- [ ] **Step 2: Verify**

Run: `node -e "const d = require('./seed-data.js'); console.log(d.cards.filter(c => c.category_id === 'verbs-common').length)"`
Expected: `50`

- [ ] **Step 3: Commit**

```bash
git add seed-data.js
git commit -m "feat: add 50 common verbs (tier 2)"
```

---

### Task 4: Add Everyday Verbs (verbs-everyday, 50 cards)

**Files:**
- Modify: `seed-data.js` (append cards)

- [ ] **Step 1: Add 50 everyday verb cards**

Append before the closing `];`:

```javascript
  // ── Verbs: Everyday (101-150) ──
  { pt: "Prender", en: "To arrest / To attach", category_id: "verbs-everyday" },
  { pt: "Virar", en: "To turn / To become", category_id: "verbs-everyday" },
  { pt: "Manter", en: "To maintain / To keep", category_id: "verbs-everyday" },
  { pt: "Conseguir", en: "To manage / To get", category_id: "verbs-everyday" },
  { pt: "Devolver", en: "To return (something)", category_id: "verbs-everyday" },
  { pt: "Cozinhar", en: "To cook", category_id: "verbs-everyday" },
  { pt: "Lavar", en: "To wash", category_id: "verbs-everyday" },
  { pt: "Limpar", en: "To clean", category_id: "verbs-everyday" },
  { pt: "Nadar", en: "To swim", category_id: "verbs-everyday" },
  { pt: "Viajar", en: "To travel", category_id: "verbs-everyday" },
  { pt: "Descansar", en: "To rest", category_id: "verbs-everyday" },
  { pt: "Vestir", en: "To wear / To dress", category_id: "verbs-everyday" },
  { pt: "Crescer", en: "To grow", category_id: "verbs-everyday" },
  { pt: "Sofrer", en: "To suffer", category_id: "verbs-everyday" },
  { pt: "Rir", en: "To laugh", category_id: "verbs-everyday" },
  { pt: "Chorar", en: "To cry", category_id: "verbs-everyday" },
  { pt: "Gritar", en: "To shout / To scream", category_id: "verbs-everyday" },
  { pt: "Cantar", en: "To sing", category_id: "verbs-everyday" },
  { pt: "Dançar", en: "To dance", category_id: "verbs-everyday" },
  { pt: "Desenhar", en: "To draw", category_id: "verbs-everyday" },
  { pt: "Pintar", en: "To paint", category_id: "verbs-everyday" },
  { pt: "Namorar", en: "To date / To be in a relationship", category_id: "verbs-everyday" },
  { pt: "Casar", en: "To marry", category_id: "verbs-everyday" },
  { pt: "Brigar", en: "To fight / To argue", category_id: "verbs-everyday" },
  { pt: "Abraçar", en: "To hug", category_id: "verbs-everyday" },
  { pt: "Beijar", en: "To kiss", category_id: "verbs-everyday" },
  { pt: "Sorrir", en: "To smile", category_id: "verbs-everyday" },
  { pt: "Mentir", en: "To lie", category_id: "verbs-everyday" },
  { pt: "Prometer", en: "To promise", category_id: "verbs-everyday" },
  { pt: "Decidir", en: "To decide", category_id: "verbs-everyday" },
  { pt: "Permitir", en: "To allow / To permit", category_id: "verbs-everyday" },
  { pt: "Proibir", en: "To prohibit / To forbid", category_id: "verbs-everyday" },
  { pt: "Oferecer", en: "To offer", category_id: "verbs-everyday" },
  { pt: "Aceitar", en: "To accept", category_id: "verbs-everyday" },
  { pt: "Recusar", en: "To refuse", category_id: "verbs-everyday" },
  { pt: "Emprestar", en: "To lend", category_id: "verbs-everyday" },
  { pt: "Pegar", en: "To grab / To catch", category_id: "verbs-everyday" },
  { pt: "Jogar fora", en: "To throw away", category_id: "verbs-everyday" },
  { pt: "Quebrar", en: "To break", category_id: "verbs-everyday" },
  { pt: "Consertar", en: "To fix / To repair", category_id: "verbs-everyday" },
  { pt: "Construir", en: "To build", category_id: "verbs-everyday" },
  { pt: "Destruir", en: "To destroy", category_id: "verbs-everyday" },
  { pt: "Empurrar", en: "To push", category_id: "verbs-everyday" },
  { pt: "Puxar", en: "To pull", category_id: "verbs-everyday" },
  { pt: "Carregar", en: "To carry / To charge", category_id: "verbs-everyday" },
  { pt: "Soltar", en: "To release / To let go", category_id: "verbs-everyday" },
  { pt: "Esconder", en: "To hide", category_id: "verbs-everyday" },
  { pt: "Procurar", en: "To look for / To search", category_id: "verbs-everyday" },
  { pt: "Descobrir", en: "To discover / To find out", category_id: "verbs-everyday" },
  { pt: "Cobrir", en: "To cover", category_id: "verbs-everyday" },
```

- [ ] **Step 2: Verify**

Run: `node -e "const d = require('./seed-data.js'); console.log(d.cards.filter(c => c.category_id === 'verbs-everyday').length)"`
Expected: `50`

- [ ] **Step 3: Commit**

```bash
git add seed-data.js
git commit -m "feat: add 50 everyday verbs (tier 3)"
```

---

### Task 5: Add Practical Verbs (verbs-practical, 50 cards)

**Files:**
- Modify: `seed-data.js` (append cards)

- [ ] **Step 1: Add 50 practical verb cards**

Append before the closing `];`:

```javascript
  // ── Verbs: Practical (151-200) ──
  { pt: "Enviar", en: "To send", category_id: "verbs-practical" },
  { pt: "Recomendar", en: "To recommend", category_id: "verbs-practical" },
  { pt: "Sugerir", en: "To suggest", category_id: "verbs-practical" },
  { pt: "Combinar", en: "To arrange / To match", category_id: "verbs-practical" },
  { pt: "Marcar", en: "To schedule / To mark", category_id: "verbs-practical" },
  { pt: "Cancelar", en: "To cancel", category_id: "verbs-practical" },
  { pt: "Atrasar", en: "To delay / To be late", category_id: "verbs-practical" },
  { pt: "Demorar", en: "To take long", category_id: "verbs-practical" },
  { pt: "Aproveitar", en: "To enjoy / To take advantage", category_id: "verbs-practical" },
  { pt: "Celebrar", en: "To celebrate", category_id: "verbs-practical" },
  { pt: "Convidar", en: "To invite", category_id: "verbs-practical" },
  { pt: "Visitar", en: "To visit", category_id: "verbs-practical" },
  { pt: "Passear", en: "To go for a walk / To stroll", category_id: "verbs-practical" },
  { pt: "Reservar", en: "To reserve / To book", category_id: "verbs-practical" },
  { pt: "Alugar", en: "To rent", category_id: "verbs-practical" },
  { pt: "Gastar", en: "To spend (money)", category_id: "verbs-practical" },
  { pt: "Economizar", en: "To save (money)", category_id: "verbs-practical" },
  { pt: "Investir", en: "To invest", category_id: "verbs-practical" },
  { pt: "Desenvolver", en: "To develop", category_id: "verbs-practical" },
  { pt: "Melhorar", en: "To improve", category_id: "verbs-practical" },
  { pt: "Piorar", en: "To worsen", category_id: "verbs-practical" },
  { pt: "Aumentar", en: "To increase", category_id: "verbs-practical" },
  { pt: "Diminuir", en: "To decrease", category_id: "verbs-practical" },
  { pt: "Juntar", en: "To join / To gather", category_id: "verbs-practical" },
  { pt: "Separar", en: "To separate", category_id: "verbs-practical" },
  { pt: "Misturar", en: "To mix", category_id: "verbs-practical" },
  { pt: "Dividir", en: "To divide / To share", category_id: "verbs-practical" },
  { pt: "Compartilhar", en: "To share", category_id: "verbs-practical" },
  { pt: "Proteger", en: "To protect", category_id: "verbs-practical" },
  { pt: "Defender", en: "To defend", category_id: "verbs-practical" },
  { pt: "Atacar", en: "To attack", category_id: "verbs-practical" },
  { pt: "Competir", en: "To compete", category_id: "verbs-practical" },
  { pt: "Treinar", en: "To train", category_id: "verbs-practical" },
  { pt: "Exercitar", en: "To exercise", category_id: "verbs-practical" },
  { pt: "Alongar", en: "To stretch", category_id: "verbs-practical" },
  { pt: "Respirar", en: "To breathe", category_id: "verbs-practical" },
  { pt: "Tossir", en: "To cough", category_id: "verbs-practical" },
  { pt: "Espirrar", en: "To sneeze", category_id: "verbs-practical" },
  { pt: "Doer", en: "To hurt / To ache", category_id: "verbs-practical" },
  { pt: "Curar", en: "To cure / To heal", category_id: "verbs-practical" },
  { pt: "Operar", en: "To operate", category_id: "verbs-practical" },
  { pt: "Examinar", en: "To examine", category_id: "verbs-practical" },
  { pt: "Pesar", en: "To weigh", category_id: "verbs-practical" },
  { pt: "Medir", en: "To measure", category_id: "verbs-practical" },
  { pt: "Comparar", en: "To compare", category_id: "verbs-practical" },
  { pt: "Organizar", en: "To organize", category_id: "verbs-practical" },
  { pt: "Planejar", en: "To plan", category_id: "verbs-practical" },
  { pt: "Preparar", en: "To prepare", category_id: "verbs-practical" },
  { pt: "Verificar", en: "To verify / To check", category_id: "verbs-practical" },
  { pt: "Confirmar", en: "To confirm", category_id: "verbs-practical" },
```

- [ ] **Step 2: Verify**

Run: `node -e "const d = require('./seed-data.js'); console.log(d.cards.filter(c => c.category_id === 'verbs-practical').length)"`
Expected: `50`

- [ ] **Step 3: Commit**

```bash
git add seed-data.js
git commit -m "feat: add 50 practical verbs (tier 4)"
```

---

### Task 6: Add Expanding Verbs (verbs-expanding, 50 cards)

**Files:**
- Modify: `seed-data.js` (append cards)

- [ ] **Step 1: Add 50 expanding verb cards**

Append before the closing `];`:

```javascript
  // ── Verbs: Expanding (201-250) ──
  { pt: "Imaginar", en: "To imagine", category_id: "verbs-expanding" },
  { pt: "Sonhar", en: "To dream", category_id: "verbs-expanding" },
  { pt: "Desejar", en: "To wish / To desire", category_id: "verbs-expanding" },
  { pt: "Respeitar", en: "To respect", category_id: "verbs-expanding" },
  { pt: "Confiar", en: "To trust", category_id: "verbs-expanding" },
  { pt: "Duvidar", en: "To doubt", category_id: "verbs-expanding" },
  { pt: "Arrepender", en: "To regret", category_id: "verbs-expanding" },
  { pt: "Perdoar", en: "To forgive", category_id: "verbs-expanding" },
  { pt: "Culpar", en: "To blame", category_id: "verbs-expanding" },
  { pt: "Elogiar", en: "To compliment / To praise", category_id: "verbs-expanding" },
  { pt: "Criticar", en: "To criticize", category_id: "verbs-expanding" },
  { pt: "Apoiar", en: "To support", category_id: "verbs-expanding" },
  { pt: "Incentivar", en: "To encourage", category_id: "verbs-expanding" },
  { pt: "Convencer", en: "To convince", category_id: "verbs-expanding" },
  { pt: "Concordar", en: "To agree", category_id: "verbs-expanding" },
  { pt: "Discordar", en: "To disagree", category_id: "verbs-expanding" },
  { pt: "Discutir", en: "To discuss / To argue", category_id: "verbs-expanding" },
  { pt: "Negociar", en: "To negotiate", category_id: "verbs-expanding" },
  { pt: "Exigir", en: "To demand", category_id: "verbs-expanding" },
  { pt: "Insistir", en: "To insist", category_id: "verbs-expanding" },
  { pt: "Avisar", en: "To warn / To notify", category_id: "verbs-expanding" },
  { pt: "Informar", en: "To inform", category_id: "verbs-expanding" },
  { pt: "Anunciar", en: "To announce", category_id: "verbs-expanding" },
  { pt: "Publicar", en: "To publish", category_id: "verbs-expanding" },
  { pt: "Traduzir", en: "To translate", category_id: "verbs-expanding" },
  { pt: "Pronunciar", en: "To pronounce", category_id: "verbs-expanding" },
  { pt: "Soletrar", en: "To spell", category_id: "verbs-expanding" },
  { pt: "Assinar", en: "To sign", category_id: "verbs-expanding" },
  { pt: "Imprimir", en: "To print", category_id: "verbs-expanding" },
  { pt: "Copiar", en: "To copy", category_id: "verbs-expanding" },
  { pt: "Colar", en: "To paste / To glue", category_id: "verbs-expanding" },
  { pt: "Apagar", en: "To erase / To turn off", category_id: "verbs-expanding" },
  { pt: "Salvar", en: "To save", category_id: "verbs-expanding" },
  { pt: "Baixar", en: "To download / To lower", category_id: "verbs-expanding" },
  { pt: "Instalar", en: "To install", category_id: "verbs-expanding" },
  { pt: "Funcionar", en: "To work / To function", category_id: "verbs-expanding" },
  { pt: "Estragar", en: "To break / To ruin", category_id: "verbs-expanding" },
  { pt: "Tropeçar", en: "To trip / To stumble", category_id: "verbs-expanding" },
  { pt: "Escorregar", en: "To slip", category_id: "verbs-expanding" },
  { pt: "Derrubar", en: "To knock down / To spill", category_id: "verbs-expanding" },
  { pt: "Derramar", en: "To spill / To pour", category_id: "verbs-expanding" },
  { pt: "Queimar", en: "To burn", category_id: "verbs-expanding" },
  { pt: "Congelar", en: "To freeze", category_id: "verbs-expanding" },
  { pt: "Ferver", en: "To boil", category_id: "verbs-expanding" },
  { pt: "Assar", en: "To roast / To bake", category_id: "verbs-expanding" },
  { pt: "Fritar", en: "To fry", category_id: "verbs-expanding" },
  { pt: "Temperar", en: "To season", category_id: "verbs-expanding" },
  { pt: "Picar", en: "To chop / To sting", category_id: "verbs-expanding" },
  { pt: "Refogar", en: "To sauté", category_id: "verbs-expanding" },
  { pt: "Provar", en: "To taste / To prove", category_id: "verbs-expanding" },
```

- [ ] **Step 2: Verify**

Run: `node -e "const d = require('./seed-data.js'); console.log(d.cards.filter(c => c.category_id === 'verbs-expanding').length)"`
Expected: `50`

- [ ] **Step 3: Commit**

```bash
git add seed-data.js
git commit -m "feat: add 50 expanding verbs (tier 5)"
```

---

### Task 7: Add Advanced Verbs (verbs-advanced, 50 cards)

**Files:**
- Modify: `seed-data.js` (append cards)

- [ ] **Step 1: Add 50 advanced verb cards**

Append before the closing `];`:

```javascript
  // ── Verbs: Advanced (251-300) ──
  { pt: "Alcançar", en: "To reach / To achieve", category_id: "verbs-advanced" },
  { pt: "Atingir", en: "To reach / To hit", category_id: "verbs-advanced" },
  { pt: "Superar", en: "To overcome", category_id: "verbs-advanced" },
  { pt: "Enfrentar", en: "To face / To confront", category_id: "verbs-advanced" },
  { pt: "Suportar", en: "To endure / To stand", category_id: "verbs-advanced" },
  { pt: "Aguentar", en: "To handle / To bear", category_id: "verbs-advanced" },
  { pt: "Resistir", en: "To resist", category_id: "verbs-advanced" },
  { pt: "Render", en: "To yield / To surrender", category_id: "verbs-advanced" },
  { pt: "Desistir", en: "To give up", category_id: "verbs-advanced" },
  { pt: "Arriscar", en: "To risk", category_id: "verbs-advanced" },
  { pt: "Beneficiar", en: "To benefit", category_id: "verbs-advanced" },
  { pt: "Desperdiçar", en: "To waste", category_id: "verbs-advanced" },
  { pt: "Acumular", en: "To accumulate", category_id: "verbs-advanced" },
  { pt: "Espalhar", en: "To spread", category_id: "verbs-advanced" },
  { pt: "Encolher", en: "To shrink", category_id: "verbs-advanced" },
  { pt: "Esticar", en: "To stretch / To extend", category_id: "verbs-advanced" },
  { pt: "Dobrar", en: "To fold / To double", category_id: "verbs-advanced" },
  { pt: "Embrulhar", en: "To wrap", category_id: "verbs-advanced" },
  { pt: "Desembrulhar", en: "To unwrap", category_id: "verbs-advanced" },
  { pt: "Pendurar", en: "To hang", category_id: "verbs-advanced" },
  { pt: "Amarrar", en: "To tie", category_id: "verbs-advanced" },
  { pt: "Desamarrar", en: "To untie", category_id: "verbs-advanced" },
  { pt: "Caber", en: "To fit", category_id: "verbs-advanced" },
  { pt: "Pertencer", en: "To belong", category_id: "verbs-advanced" },
  { pt: "Depender", en: "To depend", category_id: "verbs-advanced" },
  { pt: "Influenciar", en: "To influence", category_id: "verbs-advanced" },
  { pt: "Contribuir", en: "To contribute", category_id: "verbs-advanced" },
  { pt: "Participar", en: "To participate", category_id: "verbs-advanced" },
  { pt: "Colaborar", en: "To collaborate", category_id: "verbs-advanced" },
  { pt: "Liderar", en: "To lead", category_id: "verbs-advanced" },
  { pt: "Obedecer", en: "To obey", category_id: "verbs-advanced" },
  { pt: "Trair", en: "To betray", category_id: "verbs-advanced" },
  { pt: "Enganar", en: "To deceive / To trick", category_id: "verbs-advanced" },
  { pt: "Roubar", en: "To steal / To rob", category_id: "verbs-advanced" },
  { pt: "Deter", en: "To detain / To stop", category_id: "verbs-advanced" },
  { pt: "Fugir", en: "To flee / To escape", category_id: "verbs-advanced" },
  { pt: "Perseguir", en: "To chase / To pursue", category_id: "verbs-advanced" },
  { pt: "Investigar", en: "To investigate", category_id: "verbs-advanced" },
  { pt: "Comprovar", en: "To prove / To confirm", category_id: "verbs-advanced" },
  { pt: "Testemunhar", en: "To witness", category_id: "verbs-advanced" },
  { pt: "Jurar", en: "To swear", category_id: "verbs-advanced" },
  { pt: "Herdar", en: "To inherit", category_id: "verbs-advanced" },
  { pt: "Envelhecer", en: "To age / To grow old", category_id: "verbs-advanced" },
  { pt: "Amadurecer", en: "To mature / To ripen", category_id: "verbs-advanced" },
  { pt: "Adoecer", en: "To get sick", category_id: "verbs-advanced" },
  { pt: "Emagrecer", en: "To lose weight", category_id: "verbs-advanced" },
  { pt: "Engordar", en: "To gain weight", category_id: "verbs-advanced" },
  { pt: "Fortalecer", en: "To strengthen", category_id: "verbs-advanced" },
  { pt: "Enfraquecer", en: "To weaken", category_id: "verbs-advanced" },
  { pt: "Transformar", en: "To transform", category_id: "verbs-advanced" },
```

- [ ] **Step 2: Verify**

Run: `node -e "const d = require('./seed-data.js'); console.log(d.cards.filter(c => c.category_id === 'verbs-advanced').length)"`
Expected: `50`

- [ ] **Step 3: Commit**

```bash
git add seed-data.js
git commit -m "feat: add 50 advanced verbs (tier 6)"
```

---

### Task 8: Final verification

**Files:**
- Read: `seed-data.js`

- [ ] **Step 1: Verify all 6 categories and 300 verb cards**

Run:
```bash
node -e "
const d = require('./seed-data.js');
const tiers = ['verbs-essential','verbs-common','verbs-everyday','verbs-practical','verbs-expanding','verbs-advanced'];
tiers.forEach(t => console.log(t + ': ' + d.cards.filter(c => c.category_id === t).length));
console.log('Total: ' + d.cards.filter(c => c.category_id.startsWith('verbs-')).length);
console.log('Old verbs: ' + d.cards.filter(c => c.category_id === 'verbs').length);
console.log('Categories: ' + d.categories.filter(c => c.group_name === 'Verbs').map(c => c.id).join(', '));
"
```

Expected:
```
verbs-essential: 50
verbs-common: 50
verbs-everyday: 50
verbs-practical: 50
verbs-expanding: 50
verbs-advanced: 50
Total: 300
Old verbs: 0
Categories: verbs-essential, verbs-common, verbs-everyday, verbs-practical, verbs-expanding, verbs-advanced
```

- [ ] **Step 2: Check for duplicate PT values across all verb tiers**

Run:
```bash
node -e "
const d = require('./seed-data.js');
const verbs = d.cards.filter(c => c.category_id.startsWith('verbs-')).map(c => c.pt);
const dupes = verbs.filter((v, i) => verbs.indexOf(v) !== i);
if (dupes.length) console.log('DUPLICATES:', dupes);
else console.log('No duplicates found');
"
```

Expected: `No duplicates found`

- [ ] **Step 3: Reset local database to pick up new seed data**

The app seeds from `seed-data.js` only when the database is empty. To see the new verbs, the database needs to be re-seeded. The user should drop and recreate the database, or the app needs a reseed mechanism.

Note: This step depends on the user's local setup — flag it for manual action.
