const express = require("express");
const { Pool } = require("pg");
const path = require("path");
const { categories, cards } = require("./seed-data");

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://localhost/pt_aula",
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS card_stats (
      card_id TEXT PRIMARY KEY,
      right_count INTEGER NOT NULL DEFAULT 0,
      wrong_count INTEGER NOT NULL DEFAULT 0
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS session (
      id INTEGER PRIMARY KEY DEFAULT 1,
      deck_order JSONB NOT NULL DEFAULT '[]',
      current_index INTEGER NOT NULL DEFAULT 0,
      correct INTEGER NOT NULL DEFAULT 0,
      wrong INTEGER NOT NULL DEFAULT 0,
      mode TEXT NOT NULL DEFAULT 'pt-to-en',
      active_cats JSONB NOT NULL DEFAULT '[]',
      wrong_cards JSONB NOT NULL DEFAULT '[]'
    )
  `);
  await pool.query(`ALTER TABLE session ADD COLUMN IF NOT EXISTS wrong_cards JSONB NOT NULL DEFAULT '[]'`);
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
}

// GET /api/stats — return all card stats as { [card_id]: { right, wrong } }
app.get("/api/stats", async (req, res) => {
  const { rows } = await pool.query("SELECT card_id, right_count, wrong_count FROM card_stats");
  const stats = {};
  for (const row of rows) {
    stats[row.card_id] = { right: row.right_count, wrong: row.wrong_count };
  }
  res.json(stats);
});

// POST /api/stats/:cardId/mark — body: { "correct": true/false }
app.post("/api/stats/:cardId/mark", async (req, res) => {
  const { cardId } = req.params;
  const { correct } = req.body;
  const col = correct ? "right_count" : "wrong_count";
  await pool.query(
    `INSERT INTO card_stats (card_id, ${col})
     VALUES ($1, 1)
     ON CONFLICT (card_id) DO UPDATE SET ${col} = card_stats.${col} + 1`,
    [cardId]
  );
  const { rows } = await pool.query(
    "SELECT right_count, wrong_count FROM card_stats WHERE card_id = $1",
    [cardId]
  );
  res.json({ right: rows[0].right_count, wrong: rows[0].wrong_count });
});

// GET /api/session
app.get("/api/session", async (req, res) => {
  const { rows } = await pool.query("SELECT * FROM session WHERE id = 1");
  if (rows.length === 0) return res.json(null);
  const r = rows[0];
  res.json({
    deckOrder: r.deck_order,
    currentIndex: r.current_index,
    correct: r.correct,
    wrong: r.wrong,
    mode: r.mode,
    activeCats: r.active_cats,
    wrongCards: r.wrong_cards,
  });
});

// PUT /api/session
app.put("/api/session", async (req, res) => {
  const { deckOrder, currentIndex, correct, wrong, mode, activeCats, wrongCards } = req.body;
  await pool.query(
    `INSERT INTO session (id, deck_order, current_index, correct, wrong, mode, active_cats, wrong_cards)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (id) DO UPDATE SET
       deck_order = $1, current_index = $2, correct = $3, wrong = $4, mode = $5, active_cats = $6, wrong_cards = $7`,
    [JSON.stringify(deckOrder), currentIndex, correct, wrong, mode, JSON.stringify(activeCats), JSON.stringify(wrongCards || [])]
  );
  res.json({ ok: true });
});

// DELETE /api/session
app.delete("/api/session", async (req, res) => {
  await pool.query("DELETE FROM session WHERE id = 1");
  res.json({ ok: true });
});

// DELETE /api/stats — reset all stats
app.delete("/api/stats", async (req, res) => {
  await pool.query("DELETE FROM card_stats");
  res.json({ ok: true });
});

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

init().then(() => {
  const port = process.env.PORT || 3005;
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
}).catch(err => {
  console.error("Failed to initialize database:", err.message);
  process.exit(1);
});
