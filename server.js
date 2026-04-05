const express = require("express");
const { Pool } = require("pg");
const Anthropic = require("@anthropic-ai/sdk");
const path = require("path");
const { categories, cards } = require("./seeds");

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgres://localhost/pt_aula",
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));

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
  await pool.query(`ALTER TABLE categories ADD COLUMN IF NOT EXISTS group_name TEXT NOT NULL DEFAULT 'Topics'`);
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
    await seedCardsAndCategories();
  }
}

async function seedCardsAndCategories() {
  for (const cat of categories) {
    await pool.query(
      "INSERT INTO categories (id, label, css_class, group_name) VALUES ($1, $2, $3, $4)",
      [cat.id, cat.label, cat.css_class, cat.group_name]
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

// POST /api/reseed — truncate cards/categories/stats/session and re-seed from seed files
app.post("/api/reseed", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("TRUNCATE cards, categories, card_stats RESTART IDENTITY CASCADE");
    await client.query("DELETE FROM session");
    for (const cat of categories) {
      await client.query(
        "INSERT INTO categories (id, label, css_class, group_name) VALUES ($1, $2, $3, $4)",
        [cat.id, cat.label, cat.css_class, cat.group_name]
      );
    }
    for (const card of cards) {
      await client.query(
        "INSERT INTO cards (pt, en, category_id) VALUES ($1, $2, $3)",
        [card.pt, card.en, card.category_id]
      );
    }
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Reseed failed:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// POST /api/generate-sentences — body: { activeCats: [categoryId, ...] }
// Returns { cards: [{ pt, en }, ...] }
app.post("/api/generate-sentences", async (req, res) => {
  const { activeCats } = req.body;
  if (!Array.isArray(activeCats) || activeCats.length === 0) {
    return res.status(400).json({ error: "activeCats must be a non-empty array" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured on server" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT c.pt, c.en, cat.group_name
       FROM cards c JOIN categories cat ON c.category_id = cat.id
       WHERE c.category_id = ANY($1)`,
      [activeCats]
    );
    const shuffle = (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };
    const verbs = shuffle(rows.filter(r => r.group_name === "Verbs").map(r => r.pt)).slice(0, 30);
    const topics = shuffle(rows.filter(r => r.group_name === "Topics").map(r => r.pt)).slice(0, 30);

    if (verbs.length === 0 && topics.length === 0) {
      return res.status(400).json({ error: "Select at least one Verb or Topic category" });
    }

    const prompt = `Generate exactly 20 Brazilian Portuguese sentences for an intermediate learner to translate.

Rules:
- Each sentence must use at least one verb from this list, conjugated naturally. Use each verb at most once, picked randomly: ${verbs.join(", ") || "(none specified)"}
- Weave in vocabulary from this topic list where it fits naturally. Use each at most once: ${topics.join(", ") || "(none specified)"}
- Vary tenses across the set (present, preterite, imperfect, future, subjunctive where natural).
- Vary subjects (eu, você, ele/ela, nós, eles/elas) — don't start every sentence the same way.
- Vary structure and length: mix short (5-8 words) and longer (10-15 words, with clauses).
- Natural, conversational Brazilian Portuguese.
- English translations should be natural and idiomatic, not literal.

Return STRICT JSON only, no prose, no markdown fence. The "sentences" array must contain exactly 20 items:
{"sentences":[{"pt":"...","en":"..."}]}`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }]
    });

    let text = response.content[0].text.trim();
    // Strip optional markdown fence
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("Generate: failed to parse Claude response:", text);
      return res.status(502).json({ error: "Claude returned malformed JSON" });
    }

    if (!parsed || !Array.isArray(parsed.sentences)) {
      return res.status(502).json({ error: "Claude response missing sentences array" });
    }

    const cards = parsed.sentences
      .filter(s => s && typeof s.pt === "string" && typeof s.en === "string")
      .map(s => ({ pt: s.pt, en: s.en }));

    res.json({ cards });
  } catch (err) {
    console.error("Generate failed:", err.message);
    res.status(502).json({ error: err.message });
  }
});

// GET /api/cards — return all cards and categories
app.get("/api/cards", async (req, res) => {
  const { rows: catRows } = await pool.query("SELECT id, label, css_class, group_name FROM categories");
  const categories = {};
  for (const row of catRows) {
    categories[row.id] = { cls: row.css_class, label: row.label, group: row.group_name };
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
