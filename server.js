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
  await pool.query(`ALTER TABLE card_stats ADD COLUMN IF NOT EXISTS recent_history INTEGER NOT NULL DEFAULT 0`);
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
  await pool.query(`ALTER TABLE session ADD COLUMN IF NOT EXISTS type_mode BOOLEAN NOT NULL DEFAULT false`);
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

// GET /api/stats — return all card stats as { [card_id]: { right, wrong, recent_history } }
app.get("/api/stats", async (req, res) => {
  const { rows } = await pool.query(
    "SELECT card_id, right_count, wrong_count, recent_history FROM card_stats"
  );
  const stats = {};
  for (const row of rows) {
    stats[row.card_id] = {
      right: row.right_count,
      wrong: row.wrong_count,
      recent_history: row.recent_history,
    };
  }
  res.json(stats);
});

// POST /api/stats/:cardId/mark — body: { "correct": true/false }
app.post("/api/stats/:cardId/mark", async (req, res) => {
  const { cardId } = req.params;
  const { correct } = req.body;
  const col = correct ? "right_count" : "wrong_count";
  const bit = correct ? 0 : 1;
  await pool.query(
    `INSERT INTO card_stats (card_id, ${col}, recent_history)
     VALUES ($1, 1, $2)
     ON CONFLICT (card_id) DO UPDATE SET
       ${col} = card_stats.${col} + 1,
       recent_history = ((card_stats.recent_history << 1) | $2) & 31`,
    [cardId, bit]
  );
  const { rows } = await pool.query(
    "SELECT right_count, wrong_count, recent_history FROM card_stats WHERE card_id = $1",
    [cardId]
  );
  res.json({
    right: rows[0].right_count,
    wrong: rows[0].wrong_count,
    recent_history: rows[0].recent_history,
  });
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
    typeMode: r.type_mode,
  });
});

// PUT /api/session
app.put("/api/session", async (req, res) => {
  const { deckOrder, currentIndex, correct, wrong, mode, activeCats, wrongCards, typeMode } = req.body;
  await pool.query(
    `INSERT INTO session (id, deck_order, current_index, correct, wrong, mode, active_cats, wrong_cards, type_mode)
     VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       deck_order = $1, current_index = $2, correct = $3, wrong = $4, mode = $5, active_cats = $6, wrong_cards = $7, type_mode = $8`,
    [JSON.stringify(deckOrder), currentIndex, correct, wrong, mode, JSON.stringify(activeCats), JSON.stringify(wrongCards || []), !!typeMode]
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

    // Map each group_name to a role. Verb Endings are literal suffixes
    // ("-amos") and aren't usable as sentence content, so they're skipped.
    const groupRole = (name) => {
      if (name === "Verbs") return "infinitives";
      if (name === "Verb Endings") return "skip";
      return "drills";
    };

    const infinitiveRows = rows.filter(r => groupRole(r.group_name) === "infinitives");
    const drillRows = rows.filter(r => groupRole(r.group_name) === "drills");

    const infinitives = shuffle([...new Set(infinitiveRows.map(r => r.pt))]).slice(0, 30);

    const seenDrill = new Set();
    const drills = shuffle(
      drillRows.filter(r => {
        if (seenDrill.has(r.pt)) return false;
        seenDrill.add(r.pt);
        return true;
      }).map(r => ({ pt: r.pt, en: r.en }))
    ).slice(0, 30);

    if (infinitives.length === 0 && drills.length === 0) {
      return res.status(400).json({
        error: "Select at least one category with usable content (Verb Endings alone cannot generate sentences)"
      });
    }

    const verbRule = infinitives.length > 0
      ? `- Each sentence must use at least one verb from this list, conjugated naturally. Use each verb at most once, picked randomly: ${infinitives.join(", ")}
- For verbs with multiple meanings, clarify the specific sense in the English translation with a brief parenthetical, e.g. "to know (a place/person)" for conhecer vs "to know (a fact)" for saber, "to play (music)" for tocar vs "to play (a game)" for jogar, "to take (carry)" for levar vs "to take (grab)" for pegar, etc.`
      : "";

    const drillRule = drills.length > 0
      ? `- Incorporate items from this drill list where they fit naturally. Use each at most once. For each item:
  - if it's a pre-conjugated verb form (e.g. "Eu fui", "Nós estávamos"), use it as a tense/verb hint — you may conjugate the same verb in the same tense for a different subject
  - if it's a phrase or time marker (e.g. "Ontem", "De repente"), use it verbatim
  - if it's a noun or other vocabulary, weave it into a sentence as-is
  Drill items:
${drills.map(d => `  - ${d.pt} — ${d.en}`).join("\n")}`
      : "";

    const prompt = `Generate exactly 20 Brazilian Portuguese sentences for an intermediate learner to translate.

Rules:
${[verbRule, drillRule].filter(Boolean).join("\n")}
- Vary tenses across the set (present, preterite, imperfect, future, subjunctive where natural).
- Vary subjects (eu, você, ele/ela, nós, eles/elas) — don't start every sentence the same way.
- When the subject is "eles" or "elas", the English translation MUST disambiguate gender with a parenthetical: "they (m)" for eles, "they (f)" for elas. Never leave plain "they" for these subjects.
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
    const msg = err && err.message ? err.message : String(err);
    console.error("Generate failed:", msg);
    res.status(502).json({ error: msg });
  }
});

// POST /api/generate-conjugations — body: { activeCats: [categoryId, ...] }
// Returns { cards: [{ pt, en }, ...] } where each card drills ONE verb
// conjugation. We pre-build the 20 combos (verb + pronoun + tense) server-side
// and ask the AI only to conjugate/translate them.
app.post("/api/generate-conjugations", async (req, res) => {
  const { activeCats } = req.body;
  if (!Array.isArray(activeCats) || activeCats.length === 0) {
    return res.status(400).json({ error: "activeCats must be a non-empty array" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured on server" });
  }

  try {
    const { rows } = await pool.query(
      `SELECT c.pt, c.en FROM cards c JOIN categories cat ON c.category_id = cat.id
       WHERE c.category_id = ANY($1) AND cat.group_name = 'Verbs'`,
      [activeCats]
    );
    if (rows.length === 0) {
      return res.status(400).json({ error: "Select at least one Verbs category" });
    }
    const shuffle = (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const regularRows = rows;

    if (regularRows.length === 0) {
      return res.status(400).json({ error: "No regular verbs found in selected categories" });
    }

    // Build the English meaning lookup from seed data (preserves differentiators)
    const enMap = Object.fromEntries(regularRows.map(r => [r.pt, r.en]));

    const pronouns = [
      { pt: 'eu', en: 'I' },
      { pt: 'você', en: 'you' },
      { pt: 'ele', en: 'he' },
      { pt: 'ela', en: 'she' },
      { pt: 'nós', en: 'we' },
      { pt: 'elas', en: 'they (f)' },
      { pt: 'eles', en: 'they (m)' },
      { pt: 'vocês', en: 'you all' },
    ];

    const tenses = ['presente', 'pretérito perfeito', 'pretérito imperfeito'];

    // Generate 20 random combos: verb + pronoun + tense
    const combos = [];
    const shuffledVerbs = shuffle(regularRows.map(r => r.pt));
    for (let i = 0; i < 20; i++) {
      combos.push({
        verb: shuffledVerbs[i % shuffledVerbs.length],
        pronoun: pronouns[Math.floor(Math.random() * pronouns.length)],
        tense: tenses[Math.floor(Math.random() * tenses.length)],
      });
    }

    const comboList = combos.map((c, i) =>
      `${i + 1}. ${c.verb} (${enMap[c.verb]}) — ${c.pronoun.pt} (${c.pronoun.en}) — ${c.tense}`
    ).join('\n');

    const prompt = `Conjugate each verb below for the given pronoun and tense. Return a JSON array of cards.

For each item, produce:
- "pt": the Portuguese pronoun + conjugated verb (e.g. "eu andei")
- "en": the English subject + conjugated verb + meaning from the parentheses (e.g. "I walked (strolled)")

Use regular -ar/-er/-ir conjugation rules only. Keep the English meaning/differentiator from the parentheses in each "en" value.

For "eles" and "elas", the English subject MUST include a gender parenthetical: "they (m)" for eles, "they (f)" for elas. Never output plain "they" for these pronouns.

Items:
${comboList}

Return STRICT JSON only, no prose, no markdown fence:
{"cards":[{"pt":"...","en":"..."}]}`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{ role: "user", content: prompt }]
    });

    let text = response.content[0].text.trim();
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error("Generate conjugations: failed to parse Claude response:", text);
      return res.status(502).json({ error: "Claude returned malformed JSON" });
    }
    if (!parsed || !Array.isArray(parsed.cards)) {
      return res.status(502).json({ error: "Claude response missing cards array" });
    }

    const cards = parsed.cards
      .filter(s => s && typeof s.pt === "string" && typeof s.en === "string")
      .map(s => ({ pt: s.pt, en: s.en }));

    res.json({ cards });
  } catch (err) {
    console.error("Generate conjugations failed:", err.message);
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
