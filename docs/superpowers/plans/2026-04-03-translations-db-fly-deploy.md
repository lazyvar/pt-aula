# Translations DB Migration & Fly.io Deployment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move hardcoded flashcard data into PostgreSQL tables and deploy the app on Fly.io with managed Postgres.

**Architecture:** Extract the ~500 cards and 19 categories from `public/index.html` into a `seed-data.js` file. Add `categories` and `cards` tables to Postgres. Add a `GET /api/cards` endpoint. Frontend fetches cards on load instead of using inline data. Dockerize and deploy to Fly.io.

**Tech Stack:** Node.js, Express, PostgreSQL (pg), Docker, Fly.io

---

### Task 1: Create seed-data.js

**Files:**
- Create: `seed-data.js`

This file exports the card and category data currently hardcoded in `public/index.html` (lines 302-1026).

- [ ] **Step 1: Create seed-data.js with all categories**

Create `seed-data.js` with the categories object:

```javascript
const categories = [
  { id: "fitness", label: "Fitness", css_class: "cat-fitness" },
  { id: "vocab", label: "Vocabulary", css_class: "cat-vocab" },
  { id: "phrases", label: "Phrases", css_class: "cat-phrases" },
  { id: "verbs", label: "Verbs", css_class: "cat-verbs" },
  { id: "weather", label: "Weather", css_class: "cat-weather" },
  { id: "daily", label: "Daily Life", css_class: "cat-daily" },
  { id: "time", label: "Time & Days", css_class: "cat-time" },
  { id: "ir-phrases", label: "IR Phrases", css_class: "cat-ir-phrases" },
  { id: "ir-conj", label: "IR Conjugations", css_class: "cat-ir-conj" },
  { id: "bday", label: "Birthday", css_class: "cat-bday" },
  { id: "quase", label: "Quase", css_class: "cat-quase" },
  { id: "aula-mar27", label: "Aula Mar 27", css_class: "cat-aula-mar27" },
  { id: "ler-conj", label: "Ler Conjugations", css_class: "cat-ler-conj" },
  { id: "esquecer-conj", label: "Esquecer Conjugations", css_class: "cat-esquecer-conj" },
  { id: "lembrar-conj", label: "Lembrar Conjugations", css_class: "cat-lembrar-conj" },
  { id: "dizer-conj", label: "Dizer Conjugations", css_class: "cat-dizer-conj" },
  { id: "aula-mar30", label: "Aula Mar 30", css_class: "cat-aula-mar30" },
  { id: "april-fools", label: "April Fools", css_class: "cat-april-fools" },
  { id: "april2", label: "April 2", css_class: "cat-april2" },
];

module.exports = { categories, cards };
```

- [ ] **Step 2: Add all cards to seed-data.js**

Add the `cards` array above the `module.exports` line. Copy every entry from `allCards` in `public/index.html` (lines 302-1004), converting the format:

```javascript
const cards = [
  { pt: "Algo novo", en: "Something new", category_id: "vocab" },
  { pt: "Sobre", en: "About", category_id: "vocab" },
  // ... all ~500 cards, changing "cat" key to "category_id"
];
```

Every card from the original `allCards` array must be included. The `cat` property becomes `category_id` to match the DB schema.

- [ ] **Step 3: Verify card count**

Run:
```bash
node -e "const d = require('./seed-data.js'); console.log('categories:', d.categories.length, 'cards:', d.cards.length)"
```

Expected: `categories: 19 cards: <same count as allCards in index.html>`

To get the original count:
```bash
grep -c "{ pt:" public/index.html
```

Both numbers must match.

- [ ] **Step 4: Commit**

```bash
git add seed-data.js
git commit -m "Extract flashcard data into seed-data.js"
```

---

### Task 2: Add database tables and seed logic to server.js

**Files:**
- Modify: `server.js`

- [ ] **Step 1: Add environment variable config**

At the top of `server.js`, replace the hardcoded Pool and port:

Replace:
```javascript
const pool = new Pool({ connectionString: "postgres://localhost/pt_aula" });
```

With:
```javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://localhost/pt_aula",
});
```

- [ ] **Step 2: Add new table creation to init()**

In the `init()` function in `server.js`, after the existing `CREATE TABLE` statements (after the `ALTER TABLE session` line), add:

```javascript
  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      css_class TEXT NOT NULL
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS cards (
      id SERIAL PRIMARY KEY,
      pt TEXT NOT NULL,
      en TEXT NOT NULL,
      category_id TEXT NOT NULL REFERENCES categories(id)
    )
  `);
```

- [ ] **Step 3: Add seed logic to init()**

At the top of `server.js`, add the require:

```javascript
const { categories, cards } = require("./seed-data");
```

At the end of the `init()` function, add the seeding logic:

```javascript
  // Seed if empty
  const { rows: catRows } = await pool.query("SELECT COUNT(*) FROM categories");
  if (parseInt(catRows[0].count) === 0) {
    for (const cat of categories) {
      await pool.query(
        "INSERT INTO categories (id, label, css_class) VALUES ($1, $2, $3)",
        [cat.id, cat.label, cat.css_class]
      );
    }
    for (const card of cards) {
      await pool.query(
        "INSERT INTO cards (pt, en, category_id) VALUES ($1, $2, $3)",
        [card.pt, card.en, card.category_id]
      );
    }
    console.log(`Seeded ${categories.length} categories and ${cards.length} cards`);
  }
```

- [ ] **Step 4: Add GET /api/cards endpoint**

Add this route to `server.js`, after the existing routes:

```javascript
// GET /api/cards — return all cards and categories
app.get("/api/cards", async (req, res) => {
  const { rows: catRows } = await pool.query("SELECT id, label, css_class FROM categories");
  const categories = {};
  for (const row of catRows) {
    categories[row.id] = { cls: row.css_class, label: row.label };
  }
  const { rows: cardRows } = await pool.query("SELECT pt, en, category_id FROM cards ORDER BY id");
  const cards = cardRows.map(r => ({ pt: r.pt, en: r.en, cat: r.category_id }));
  res.json({ cards, categories });
});
```

- [ ] **Step 5: Use PORT env var**

Replace:
```javascript
  app.listen(3005, () => console.log("Server running on http://localhost:3005"));
```

With:
```javascript
  const port = process.env.PORT || 3005;
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
```

- [ ] **Step 6: Test locally**

Run:
```bash
node server.js
```

Then in another terminal:
```bash
curl -s http://localhost:3005/api/cards | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log('cards:', d.cards.length, 'categories:', Object.keys(d.categories).length)"
```

Expected: `cards: <same count> categories: 19`

Kill the server after verifying.

- [ ] **Step 7: Commit**

```bash
git add server.js
git commit -m "Add cards/categories tables, seed logic, and /api/cards endpoint"
```

---

### Task 3: Update frontend to fetch cards from API

**Files:**
- Modify: `public/index.html`

- [ ] **Step 1: Remove hardcoded data**

In `public/index.html`, remove the entire `const allCards = [...]` array (lines 302-1004) and the `const catConfig = {...}` object (lines 1006-1026).

Replace them with:

```javascript
let allCards = [];
let catConfig = {};
```

- [ ] **Step 2: Update session storage to use card pt text instead of array indices**

The current `saveSession()` stores deck order as array indices into `allCards`. Since the DB array order could change, switch to using `pt` text as the identifier.

Replace the `saveSession` function:

```javascript
function saveSession() {
  const deckOrder = deck.map(c => c.pt);
  const wc = wrongCards.map(c => c.pt);
  fetch("/api/session", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deckOrder, currentIndex, correct, wrong, mode, activeCats: [...activeCats], wrongCards: wc })
  });
}
```

Replace the `loadSession` function:

```javascript
async function loadSession() {
  const s = await fetch("/api/session").then(r => r.json());
  if (!s) return false;
  const cardMap = new Map(allCards.map(c => [c.pt, c]));
  deck = s.deckOrder.map(pt => cardMap.get(pt)).filter(Boolean);
  currentIndex = s.currentIndex;
  correct = s.correct;
  wrong = s.wrong;
  mode = s.mode;
  activeCats = new Set(s.activeCats);
  wrongCards = (s.wrongCards || []).map(pt => cardMap.get(pt)).filter(Boolean);
  if (deck.length === 0) return false;
  return true;
}
```

- [ ] **Step 3: Add fetch-and-boot logic**

Replace the boot code at the bottom of the script (the last 3 lines before `</script>`):

```javascript
fetchAllStats().then(() => loadSession()).then(restored => {
  if (restored) render(); else startDeck();
});
```

With:

```javascript
async function boot() {
  const data = await fetch("/api/cards").then(r => r.json());
  allCards = data.cards;
  catConfig = data.categories;
  activeCats = new Set(Object.keys(catConfig));
  await fetchAllStats();
  const restored = await loadSession();
  if (restored) render(); else startDeck();
}

boot();
```

- [ ] **Step 4: Remove the initial activeCats line**

The line `let activeCats = new Set(Object.keys(catConfig));` (was line 1028) should be changed to just:

```javascript
let activeCats = new Set();
```

Since `catConfig` is empty at parse time, we initialize it in `boot()` instead.

- [ ] **Step 5: Test locally**

Start the server and open `http://localhost:3005` in a browser. Verify:
- Cards load and display
- Category filters work
- Flip, mark correct/wrong, keyboard shortcuts all work
- Session persists on page reload

- [ ] **Step 6: Clear old session data**

Since the session format changed (pt text instead of indices), clear the old session:

```bash
curl -s -X DELETE http://localhost:3005/api/session
```

- [ ] **Step 7: Commit**

```bash
git add public/index.html
git commit -m "Fetch cards from API instead of hardcoding in HTML"
```

---

### Task 4: Add Docker and Fly.io config

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `fly.toml`

- [ ] **Step 1: Create .dockerignore**

```
node_modules
.git
.claude
docs
```

- [ ] **Step 2: Create Dockerfile**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production
COPY . .
EXPOSE 3005
CMD ["npm", "start"]
```

- [ ] **Step 3: Create fly.toml**

```toml
app = "pt-aula"
primary_region = "iad"

[build]

[http_service]
  internal_port = 3005
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  size = "shared-cpu-1x"
  memory = "256mb"
```

Note: The `app` name may need to change if `pt-aula` is taken on Fly. `fly launch` will prompt for a unique name.

- [ ] **Step 4: Test Docker build locally (optional)**

```bash
docker build -t pt-aula .
```

Expected: Builds successfully.

- [ ] **Step 5: Commit**

```bash
git add Dockerfile .dockerignore fly.toml
git commit -m "Add Dockerfile and fly.toml for deployment"
```

---

### Task 5: Deploy to Fly.io

**Files:** None (manual deployment commands)

- [ ] **Step 1: Launch the app**

```bash
fly launch --no-deploy
```

This creates the app on Fly. If the name `pt-aula` is taken, pick a different name and update `fly.toml` accordingly.

- [ ] **Step 2: Create Postgres database**

```bash
fly postgres create --name pt-aula-db --region iad --vm-size shared-cpu-1x --initial-cluster-size 1 --volume-size 1
```

- [ ] **Step 3: Attach Postgres to the app**

```bash
fly postgres attach pt-aula-db
```

This sets `DATABASE_URL` as a secret on the app automatically.

- [ ] **Step 4: Deploy**

```bash
fly deploy
```

Expected: Build succeeds, app starts, init() creates tables and seeds data.

- [ ] **Step 5: Verify deployment**

```bash
fly logs
```

Look for the "Seeded 19 categories and N cards" message.

Then open the app URL shown by `fly status` in a browser and verify cards load.

- [ ] **Step 6: Commit any fly.toml changes**

If `fly launch` modified `fly.toml` (e.g., changed the app name), commit:

```bash
git add fly.toml
git commit -m "Update fly.toml with deployed app name"
```
