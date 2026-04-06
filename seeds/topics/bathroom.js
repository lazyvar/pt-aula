const category = { id: "bathroom", label: "Bathroom", css_class: "cat-bathroom", group_name: "Topics" };

const cards = [
  { pt: "Toalha", en: "Towel", category_id: "bathroom" },
  { pt: "Sabonete", en: "Soap (bar)", category_id: "bathroom" },
  { pt: "Shampoo", en: "Shampoo", category_id: "bathroom" },
  { pt: "Escova de dentes", en: "Toothbrush", category_id: "bathroom" },
  { pt: "Pasta de dente", en: "Toothpaste", category_id: "bathroom" },
  { pt: "Chuveiro", en: "Shower", category_id: "bathroom" },
  { pt: "Banheira", en: "Bathtub", category_id: "bathroom" },
  { pt: "Vaso sanitário", en: "Toilet", category_id: "bathroom" },
  { pt: "Espelho", en: "Mirror", category_id: "bathroom" },
  { pt: "Secador de cabelo", en: "Hair dryer", category_id: "bathroom" },
  { pt: "Papel higiênico", en: "Toilet paper", category_id: "bathroom" },
];

module.exports = { categories: [category], cards };
