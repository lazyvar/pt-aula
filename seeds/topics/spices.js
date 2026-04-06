const category = { id: "spices", label: "Spices & Seasonings", css_class: "cat-spices", group_name: "Topics" };

const cards = [
  { pt: "Sal", en: "Salt", category_id: "spices" },
  { pt: "Pimenta", en: "Pepper / Hot pepper", category_id: "spices" },
  { pt: "Açúcar", en: "Sugar", category_id: "spices" },
  { pt: "Canela", en: "Cinnamon", category_id: "spices" },
  { pt: "Orégano", en: "Oregano", category_id: "spices" },
  { pt: "Manjericão", en: "Basil", category_id: "spices" },
  { pt: "Coentro", en: "Cilantro / Coriander", category_id: "spices" },
  { pt: "Gengibre", en: "Ginger", category_id: "spices" },
  { pt: "Azeite", en: "Olive oil", category_id: "spices" },
  { pt: "Vinagre", en: "Vinegar", category_id: "spices" },
  { pt: "Molho", en: "Sauce", category_id: "spices" },
  { pt: "Mostarda", en: "Mustard", category_id: "spices" },
];

module.exports = { categories: [category], cards };
