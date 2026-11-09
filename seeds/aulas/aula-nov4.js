const category = { id: "aula-nov4", label: "Aula Nov 4", css_class: "cat-aula-nov4", group_name: "Aulas" };

const words = [
  { pt: "Apropriada", en: "Appropriate (f)" },
  { pt: "Adequada", en: "Suitable / Adequate (f)" },
  { pt: "Pecado", en: "Sin" },
  { pt: "Pecar", en: "To sin" },
  { pt: "Correta", en: "Correct (f)" },
  { pt: "Triturar", en: "To grind / To crush" },
  { pt: "Esquentar", en: "To heat up (informal)" },
  { pt: "Aquecer", en: "To heat / To warm up" },
  { pt: "Tamanho", en: "Size" },
  { pt: "Vinícola", en: "Winery" },
  { pt: "Eu não tenho certeza", en: "I'm not sure" },
  { pt: "Eu não vejo a hora", en: "I can't wait" }
];

const cards = words.map(w => ({ ...w, category_id: category.id }));

module.exports = { categories: [category], cards };
