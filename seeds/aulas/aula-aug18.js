const category = { id: "aula-aug18", label: "Aula Aug 18", css_class: "cat-aula-aug18", group_name: "Aulas" };

const words = [
  { pt: "Barba", en: "Beard" },
  { pt: "Coçar", en: "To scratch / To itch" },
  { pt: "Cheio", en: "Full (masc.)" },
  { pt: "Cheia", en: "Full (fem.)" },
  { pt: "Discurso", en: "Speech" },
  { pt: "Calma", en: "Calm / Wait, hold on" },
  { pt: "Estrangeira", en: "Foreign / Foreigner (fem.)" },
  { pt: "Interpretação", en: "Interpretation / Acting" },
  { pt: "Sem querer", en: "By accident / Unintentionally" },
  { pt: "Gravações", en: "Recordings" },
  { pt: "Desperdiçar", en: "To waste" },
  { pt: "Pedaços", en: "Pieces" },
  { pt: "Fazer questão", en: "To insist on / To make a point of" },
  { pt: "Si mesmo", en: "Oneself / Himself" },
  { pt: "Tão", en: "So / Such" },
  { pt: "Tanto", en: "So much" },
  { pt: "A ponto", en: "To the point (of)" },
  { pt: "Um dos", en: "One of the" },
  { pt: "Perceber", en: "To notice / To realize" }
];

const cards = words.map(w => ({ ...w, category_id: category.id }));

module.exports = { categories: [category], cards };
