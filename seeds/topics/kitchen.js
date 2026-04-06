const category = { id: "kitchen", label: "Kitchen Items", css_class: "cat-kitchen", group_name: "Topics" };

const cards = [
  { pt: "Prato", en: "Plate", category_id: "kitchen" },
  { pt: "Copo", en: "Glass / Cup", category_id: "kitchen" },
  { pt: "Xícara", en: "Cup (for coffee/tea)", category_id: "kitchen" },
  { pt: "Garfo", en: "Fork", category_id: "kitchen" },
  { pt: "Faca", en: "Knife", category_id: "kitchen" },
  { pt: "Colher", en: "Spoon", category_id: "kitchen" },
  { pt: "Panela", en: "Pot", category_id: "kitchen" },
  { pt: "Frigideira", en: "Frying pan", category_id: "kitchen" },
  { pt: "Geladeira", en: "Refrigerator", category_id: "kitchen" },
  { pt: "Fogão", en: "Stove", category_id: "kitchen" },
  { pt: "Micro-ondas", en: "Microwave", category_id: "kitchen" },
  { pt: "Pia", en: "Sink", category_id: "kitchen" },
  { pt: "Guardanapo", en: "Napkin", category_id: "kitchen" },
];

module.exports = { categories: [category], cards };
