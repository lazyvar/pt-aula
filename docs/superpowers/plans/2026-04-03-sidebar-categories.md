# Sidebar Categories Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat category button row with a grouped sidebar on desktop and a collapsible grouped section on mobile.

**Architecture:** Add `group_name` to categories in seed data, DB schema, and API. Restructure `index.html` into a two-column layout with a sidebar for desktop and a collapsible toggle for mobile. Pure CSS responsive — no new dependencies.

**Tech Stack:** Express, PostgreSQL, vanilla JS, CSS media queries

---

### Task 1: Add `group_name` to seed data

**Files:**
- Modify: `seed-data.js:1-21`

- [ ] **Step 1: Update category objects with group_name**

Replace the `categories` array in `seed-data.js`:

```js
const categories = [
  { id: "fitness", label: "Fitness", css_class: "cat-fitness", group_name: "Topics" },
  { id: "vocab", label: "Vocabulary", css_class: "cat-vocab", group_name: "Topics" },
  { id: "phrases", label: "Phrases", css_class: "cat-phrases", group_name: "Topics" },
  { id: "verbs", label: "Verbs", css_class: "cat-verbs", group_name: "Topics" },
  { id: "weather", label: "Weather", css_class: "cat-weather", group_name: "Topics" },
  { id: "daily", label: "Daily Life", css_class: "cat-daily", group_name: "Topics" },
  { id: "time", label: "Time & Days", css_class: "cat-time", group_name: "Topics" },
  { id: "bday", label: "Birthday", css_class: "cat-bday", group_name: "Topics" },
  { id: "quase", label: "Quase", css_class: "cat-quase", group_name: "Topics" },
  { id: "ir-phrases", label: "IR Phrases", css_class: "cat-ir-phrases", group_name: "IR" },
  { id: "ir-conj", label: "IR Conjugations", css_class: "cat-ir-conj", group_name: "IR" },
  { id: "ler-conj", label: "Ler Conjugations", css_class: "cat-ler-conj", group_name: "Conjugations" },
  { id: "esquecer-conj", label: "Esquecer Conjugations", css_class: "cat-esquecer-conj", group_name: "Conjugations" },
  { id: "lembrar-conj", label: "Lembrar Conjugations", css_class: "cat-lembrar-conj", group_name: "Conjugations" },
  { id: "dizer-conj", label: "Dizer Conjugations", css_class: "cat-dizer-conj", group_name: "Conjugations" },
  { id: "aula-mar27", label: "Aula Mar 27", css_class: "cat-aula-mar27", group_name: "Aulas" },
  { id: "aula-mar30", label: "Aula Mar 30", css_class: "cat-aula-mar30", group_name: "Aulas" },
  { id: "april-fools", label: "April Fools", css_class: "cat-april-fools", group_name: "Aulas" },
  { id: "april2", label: "April 2", css_class: "cat-april2", group_name: "Aulas" }
];
```

- [ ] **Step 2: Commit**

```bash
git add seed-data.js
git commit -m "feat: add group_name to category seed data"
```

---

### Task 2: Update DB schema and API to include `group_name`

**Files:**
- Modify: `server.js:14-68` (init function — schema + seeding)
- Modify: `server.js:140-149` (GET /api/cards)

- [ ] **Step 1: Add `group_name` column to categories table**

In the `init()` function in `server.js`, after the `CREATE TABLE IF NOT EXISTS categories` statement (line 36-40), add:

```js
await pool.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS group_name TEXT NOT NULL DEFAULT 'Topics'`);
```

- [ ] **Step 2: Update the seed INSERT to include `group_name`**

Replace the category seeding loop (lines 55-59):

```js
for (const cat of categories) {
  await pool.query(
    "INSERT INTO categories (id, label, css_class, group_name) VALUES ($1, $2, $3, $4)",
    [cat.id, cat.label, cat.css_class, cat.group_name]
  );
}
```

- [ ] **Step 3: Update GET /api/cards to return `group_name`**

Replace the categories query in the `/api/cards` handler (lines 141-145):

```js
const { rows: catRows } = await pool.query("SELECT id, label, css_class, group_name FROM categories");
const categories = {};
for (const row of catRows) {
  categories[row.id] = { cls: row.css_class, label: row.label, group: row.group_name };
}
```

- [ ] **Step 4: Commit**

```bash
git add server.js
git commit -m "feat: add group_name to categories schema and API"
```

---

### Task 3: Restructure HTML layout — sidebar and responsive CSS

**Files:**
- Modify: `public/index.html` (CSS section, lines 8-295)

- [ ] **Step 1: Replace the CSS in `index.html`**

Replace the entire `<style>` block (lines 8-295) with the updated CSS that includes sidebar layout, grouped categories, and responsive breakpoints. Key changes:

```css
/* Add after the existing .app rule (line 51), replacing it */
.layout {
  position: relative;
  z-index: 1;
  display: flex;
  width: 100%;
  min-height: 100vh;
}

.sidebar {
  width: 260px;
  min-width: 260px;
  padding: 20px 16px;
  border-right: 1px solid rgba(255,255,255,0.06);
  overflow-y: auto;
  max-height: 100vh;
  position: sticky;
  top: 0;
}

.main-content {
  flex: 1;
  max-width: 520px;
  margin: 0 auto;
  padding: 20px;
}

/* Mobile toggle button - hidden on desktop */
.mobile-cat-toggle {
  display: none;
  width: 100%;
  padding: 10px 16px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.08);
  background: rgba(255,255,255,0.03);
  color: var(--text-dim);
  font-family: 'DM Sans', sans-serif;
  font-size: 0.8rem;
  cursor: pointer;
  text-align: left;
  margin-bottom: 12px;
}
.mobile-cat-toggle:hover { background: rgba(255,255,255,0.07); }

/* Category groups */
.cat-group { margin-bottom: 14px; }

.cat-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-dim);
  user-select: none;
}
.cat-group-header:hover { background: rgba(255,255,255,0.04); }

.cat-group-header .chevron {
  transition: transform 0.2s;
  font-size: 0.6rem;
}
.cat-group-header.collapsed .chevron {
  transform: rotate(-90deg);
}

.cat-group-items {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 4px 0 0 0;
}
.cat-group-items.hidden { display: none; }

.sidebar .filter-btn {
  width: 100%;
  text-align: left;
  padding: 6px 10px;
  font-size: 0.72rem;
}

.sidebar-controls {
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sidebar-controls .ctrl-btn {
  width: 100%;
  text-align: center;
}

/* Mobile categories panel */
.mobile-cats {
  display: none;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}
.mobile-cats.open { display: flex; }

@media (max-width: 768px) {
  .sidebar { display: none; }
  .mobile-cat-toggle { display: block; }
  .layout { flex-direction: column; }
  .main-content { padding: 12px; max-width: 100%; }
}
```

Keep all existing card, button, animation, and category-tag CSS unchanged. Only add the new layout rules and modify `.app` to `.layout`.

- [ ] **Step 2: Commit**

```bash
git add public/index.html
git commit -m "feat: add sidebar and responsive CSS for grouped categories"
```

---

### Task 4: Update the JavaScript rendering to use sidebar layout

**Files:**
- Modify: `public/index.html` (JavaScript section, lines 301-541)

- [ ] **Step 1: Add group rendering helper function**

Add this function after the existing `getCardStats` function (after line 326):

```js
function renderCatGroups(isMobile) {
  const groups = {};
  for (const [key, val] of Object.entries(catConfig)) {
    const group = val.group || 'Topics';
    if (!groups[group]) groups[group] = [];
    const count = allCards.filter(c => c.cat === key).length;
    groups[group].push({ key, label: val.label, count });
  }

  return Object.entries(groups).map(([groupName, cats]) => {
    const defaultCollapsed = isMobile;
    const items = cats.map(c =>
      `<button class="filter-btn ${activeCats.has(c.key) ? 'active' : ''}" onclick="toggleCat('${c.key}')">${c.label} (${c.count})</button>`
    ).join('');
    return `
      <div class="cat-group">
        <div class="cat-group-header ${defaultCollapsed ? 'collapsed' : ''}" onclick="toggleGroup(this)">
          <span>${groupName}</span>
          <span class="chevron">&#9660;</span>
        </div>
        <div class="cat-group-items ${defaultCollapsed ? 'hidden' : ''}">${items}</div>
      </div>`;
  }).join('');
}
```

- [ ] **Step 2: Add toggleGroup and toggleMobileCats functions**

Add after the `renderCatGroups` function:

```js
function toggleGroup(header) {
  header.classList.toggle('collapsed');
  header.nextElementSibling.classList.toggle('hidden');
}

function toggleMobileCats() {
  document.getElementById('mobileCats').classList.toggle('open');
}
```

- [ ] **Step 3: Update the `render()` function**

Replace the `app.innerHTML` assignment inside the `render()` function (the main rendering block starting around line 452) with:

```js
const selectedCount = activeCats.size;

app.innerHTML = `
  <div class="layout">
    <div class="sidebar">
      <div class="header">
        <h1>🇧🇷 Português Flashcards</h1>
      </div>
      ${renderCatGroups(false)}
      <div class="sidebar-controls">
        <button class="ctrl-btn" onclick="toggleMode()">${mode === "pt-to-en" ? "PT → EN" : "EN → PT"}</button>
        <button class="ctrl-btn" onclick="startDeck()">Shuffle</button>
        <button class="ctrl-btn" onclick="resetStats()">Reset Stats</button>
      </div>
    </div>

    <div class="main-content">
      <div class="header" style="display:none">
        <h1>🇧🇷 Português Flashcards</h1>
      </div>

      <button class="mobile-cat-toggle" onclick="toggleMobileCats()">
        Categories (${selectedCount} selected) ▾
      </button>
      <div class="mobile-cats" id="mobileCats">
        ${renderCatGroups(true)}
        <div class="controls" style="margin-top:8px;">
          <button class="ctrl-btn" onclick="toggleMode()">${mode === "pt-to-en" ? "PT → EN" : "EN → PT"}</button>
          <button class="ctrl-btn" onclick="startDeck()">Shuffle</button>
          <button class="ctrl-btn" onclick="resetStats()">Reset Stats</button>
        </div>
      </div>

      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      <div class="stats">
        <span><span class="dot green"></span> ${correct}</span>
        <span><span class="dot red"></span> ${wrong}</span>
        <span><span class="dot gray"></span> ${deck.length - currentIndex} left</span>
      </div>

      <div class="card-container" onclick="flipCard()">
        <div class="card ${isFlipped ? 'flipped' : ''}" id="theCard">
          <div class="card-face card-front">
            <span class="category-tag ${cc.cls}">${cc.label}</span>
            <div class="card-label">${frontLabel}</div>
            <div class="card-word">${front}</div>
            ${cardStatsHTML}
            <div class="card-hint">tap to flip</div>
          </div>
          <div class="card-face card-back">
            <span class="category-tag ${cc.cls}">${cc.label}</span>
            <div class="card-label">${backLabel}</div>
            <div class="card-word">${back}</div>
            ${cardStatsHTML}
          </div>
        </div>
      </div>

      <div class="buttons">
        <button class="btn btn-wrong" onclick="mark(false)">✗ Again</button>
        <button class="btn btn-right" onclick="mark(true)">✓ Got it</button>
      </div>
      <div class="keyboard-hint">Space = flip · → = got it · ← = again</div>
    </div>
  </div>`;
```

- [ ] **Step 4: Update the outer container**

Change the HTML body container (line 299) from:
```html
<div class="app" id="app"></div>
```
to:
```html
<div id="app"></div>
```

And update `render()` to reference `document.getElementById("app")` (already does this).

- [ ] **Step 5: Update the "no cards" and "done" screens**

These screens should render inside the layout too. Update the empty deck check at the top of `render()`:

```js
if (deck.length === 0) {
  app.innerHTML = `<div class="layout"><div class="sidebar">
    <div class="header"><h1>🇧🇷 Português Flashcards</h1></div>
    ${renderCatGroups(false)}
  </div><div class="main-content">
    <button class="mobile-cat-toggle" onclick="toggleMobileCats()">Categories (${activeCats.size} selected) ▾</button>
    <div class="mobile-cats" id="mobileCats">${renderCatGroups(true)}</div>
    <div class="done-screen animate-in"><h2>No cards</h2><p>Select at least one category</p></div>
  </div></div>`;
  return;
}
```

Similarly wrap the "done" screens in the layout with sidebar.

- [ ] **Step 6: Commit**

```bash
git add public/index.html
git commit -m "feat: render grouped categories in sidebar/collapsible layout"
```

---

### Task 5: Manual testing and polish

- [ ] **Step 1: Test desktop layout**

Run: `npm start` (or connect to the running server)

Verify:
- Sidebar appears on the left at >768px width
- Categories are grouped under Topics, IR, Conjugations, Aulas headers
- Clicking a group header collapses/expands that group
- Clicking a category button toggles it and reshuffles the deck
- Control buttons (mode, shuffle, reset) appear at the bottom of the sidebar
- Card area is centered in the remaining space

- [ ] **Step 2: Test mobile layout**

Resize browser to <768px or use mobile device simulation.

Verify:
- Sidebar is hidden
- "Categories (N selected)" toggle button appears at top
- Clicking it reveals grouped categories with groups collapsed by default
- Clicking a group header expands it
- Category selection works correctly
- Controls appear inside the collapsible panel

- [ ] **Step 3: Test done/empty screens**

Verify that the "round done" and "no cards" screens still render correctly within the layout on both desktop and mobile.

- [ ] **Step 4: Fix any visual polish issues**

Adjust spacing, colors, or sizing as needed based on testing.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: polish sidebar layout and responsive behavior"
```
