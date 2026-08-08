const category = { id: "aula-aug6", label: "Aula Aug 6", css_class: "cat-aula-aug6", group_name: "Aulas" };

const words = [
  { pt: "Realizado", en: "Accomplished / Achieved" },
  { pt: "Paradas", en: "Stops (bus stops) / Stopped (fem. pl.)" },
  { pt: "Calçada", en: "Sidewalk" },
  { pt: "Dobro / Triplo", en: "Double / Triple" },
  { pt: "Exceto", en: "Except" },
  { pt: "Atrair / Atração", en: "To attract / Attraction" },
  { pt: "Manifestando", en: "Manifesting" },
  { pt: "Valeu a pena", en: "It was worth it" },
  { pt: "Das / Dos", en: "Of the (fem. pl.) / Of the (masc. pl.)" },
  { pt: "Eu gosto das nossas aulas", en: "I like our classes" },
  { pt: "Pista", en: "Clue / Lane / Track" },
  { pt: "Fisioterapia", en: "Physical therapy" },
  { pt: "Neste / Nesta", en: "In this (masc.) / In this (fem.)" },
  { pt: "Naquele / Naquela", en: "In that one over there (masc.) / (fem.)" },
  { pt: "No / Na", en: "In the (masc.) / In the (fem.)" },
  { pt: "Nosso / Nossa", en: "Our (masc. sg.) / Our (fem. sg.)" },
  { pt: "Novo / Nova", en: "New (masc.) / New (fem.)" },
  { pt: "Nada", en: "Nothing" },
  { pt: "Ninguém", en: "Nobody" },
  { pt: "Está aquecendo", en: "It's heating up" },
  { pt: "Doar / Dor", en: "To donate / Pain" },
  { pt: "Caridade", en: "Charity / Goodwill" }
];

const cards = words.map(w => ({ ...w, category_id: category.id }));

module.exports = { categories: [category], cards };
