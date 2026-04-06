const category = { id: "drinks", label: "Drinks", css_class: "cat-drinks", group_name: "Topics" };

const cards = [
  { pt: "Água", en: "Water", category_id: "drinks" },
  { pt: "Café", en: "Coffee", category_id: "drinks" },
  { pt: "Chá", en: "Tea", category_id: "drinks" },
  { pt: "Suco", en: "Juice", category_id: "drinks" },
  { pt: "Leite", en: "Milk", category_id: "drinks" },
  { pt: "Cerveja", en: "Beer", category_id: "drinks" },
  { pt: "Vinho", en: "Wine", category_id: "drinks" },
  { pt: "Refrigerante", en: "Soda", category_id: "drinks" },
  { pt: "Cachaça", en: "Cachaça (sugarcane liquor)", category_id: "drinks" },
  { pt: "Caipirinha", en: "Caipirinha", category_id: "drinks" },
  { pt: "Vitamina", en: "Smoothie", category_id: "drinks" },
  { pt: "Água de coco", en: "Coconut water", category_id: "drinks" },
];

module.exports = { categories: [category], cards };
