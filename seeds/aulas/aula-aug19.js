const category = { id: "aula-aug19", label: "Aula Aug 19", css_class: "cat-aula-aug19", group_name: "Aulas" };

const words = [
  { pt: "Leigo", en: "Layperson / Non-expert" },
  { pt: "Pontos", en: "Points / Stitches" },
  { pt: "Acalmar", en: "To calm down" },
  { pt: "Local", en: "Local / Place" },
  { pt: "Agulha", en: "Needle" },
  { pt: "Geral", en: "General" },
  { pt: "Cicatriz", en: "Scar" },
  { pt: "Retirar", en: "To remove / To withdraw" },
  { pt: "Direita", en: "Right (direction)" },
  { pt: "Direto", en: "Direct / Straight" },
  { pt: "Direito", en: "Right (legal) / Law" },
  { pt: "Ocupado", en: "Busy / Occupied" },
  { pt: "Vou dar 100% de mim", en: "I'll give 100% of myself" },
  { pt: "Derramar", en: "To spill" },
  { pt: "Derrubar", en: "To knock over / To knock down" },
  { pt: "Expressar", en: "To express" },
  { pt: "Sou fluente", en: "I am fluent" },
  { pt: "Tenho fluência", en: "I have fluency" },
  { pt: "Estou com fluência", en: "I'm speaking fluently (right now)" },
  { pt: "Dinossauros", en: "Dinosaurs" },
  { pt: "Caber", en: "To fit" },
  { pt: "Quando fizer isso", en: "When you do that (future subjunctive)" }
];

const cards = words.map(w => ({ ...w, category_id: category.id }));

module.exports = { categories: [category], cards };
