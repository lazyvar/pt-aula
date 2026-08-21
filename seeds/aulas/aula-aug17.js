const category = { id: "aula-aug17", label: "Aula Aug 17", css_class: "cat-aula-aug17", group_name: "Aulas" };

const words = [
  { pt: "Bêbado", en: "Drunk" },
  { pt: "Ressaca", en: "Hangover" },
  { pt: "Sóbrio", en: "Sober" },
  { pt: "Flexível", en: "Flexible" }
];

const cards = words.map(w => ({ ...w, category_id: category.id }));

module.exports = { categories: [category], cards };
