const category = { id: "aula-nov9", label: "Aula Nov 9", css_class: "cat-aula-nov9", group_name: "Aulas" };

const words = [
  { pt: "Além disso", en: "Besides that / Furthermore" },
  { pt: "Novinho em folha", en: "Brand new" },
  { pt: "Arriscar", en: "To risk" },
  { pt: "Multa", en: "Fine (penalty)" },
  { pt: "Contratar", en: "To hire" },
  { pt: "Tradição", en: "Tradition" },
  { pt: "Baseado", en: "Based (on)" },
  { pt: "Refeição", en: "Meal" }
];

const cards = words.map(w => ({ ...w, category_id: category.id }));

module.exports = { categories: [category], cards };
