const category = { id: "aula-aug13", label: "Aula Aug 13", css_class: "cat-aula-aug13", group_name: "Aulas" };

const words = [
  { pt: "Promovendo", en: "Promoting" },
  { pt: "Promover", en: "To promote" },
  { pt: "Após", en: "After (formal)" },
  { pt: "Segundo", en: "According to / Second" },
  { pt: "Entre", en: "Between / Among" },
  { pt: "Ferramentas", en: "Tools" },
  { pt: "Vinculado", en: "Linked / Tied to" },
  { pt: "Voltada", en: "Aimed at / Geared toward (fem.)" },
  { pt: "Ações", en: "Actions / Shares (stock)" },
  { pt: "Pretende", en: "He/she intends (from pretender)" },
  { pt: "Pretender", en: "To intend" },
  { pt: "Escolar", en: "School (adj.)" },
  { pt: "Escolha", en: "Choice" },
  { pt: "Escolher", en: "To choose" },
  { pt: "Formatura", en: "Graduation" }
];

const cards = words.map(w => ({ ...w, category_id: category.id }));

module.exports = { categories: [category], cards };
