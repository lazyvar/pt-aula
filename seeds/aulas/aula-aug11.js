const category = { id: "aula-aug11", label: "Aula Aug 11", css_class: "cat-aula-aug11", group_name: "Aulas" };

const words = [
  { pt: "Buraco", en: "Hole" },
  { pt: "Espelho", en: "Mirror" },
  { pt: "Abajur", en: "Bedside lamp / Lampshade (masc.)" },
  { pt: "Lâmpada", en: "Light bulb" },
  { pt: "Identidade", en: "Identity / ID" },
  { pt: "Desde então", en: "Since then" },
  { pt: "Expirar", en: "To expire" },
  { pt: "Ano passado", en: "Last year" },
  { pt: "Dirigir", en: "To drive" },
  { pt: "Dirijo", en: "I drive (from dirigir)" },
  { pt: "Ilegalmente", en: "Illegally" },
  { pt: "Vencer", en: "To expire / To win" },
  { pt: "Vencida", en: "Expired (fem.)" },
  { pt: "Ressaca", en: "Hangover" },
  { pt: "Legenda", en: "Subtitle / Caption" },
  { pt: "Séries", en: "Series / TV shows" },
  { pt: "Urgente", en: "Urgent" },
  { pt: "Trair", en: "To betray / To cheat on" },
  { pt: "Disponível", en: "Available" },
  { pt: "Voar", en: "To fly" },
  { pt: "Valeu a pena", en: "It was worth it" }
];

const cards = words.map(w => ({ ...w, category_id: category.id }));

module.exports = { categories: [category], cards };
