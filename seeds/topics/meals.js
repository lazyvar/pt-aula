const category = { id: "meals", label: "Meals & Dishes", css_class: "cat-meals", group_name: "Topics" };

const cards = [
  { pt: "Café da manhã", en: "Breakfast", category_id: "meals" },
  { pt: "Almoço", en: "Lunch", category_id: "meals" },
  { pt: "Jantar", en: "Dinner", category_id: "meals" },
  { pt: "Lanche", en: "Snack", category_id: "meals" },
  { pt: "Arroz", en: "Rice", category_id: "meals" },
  { pt: "Feijão", en: "Beans", category_id: "meals" },
  { pt: "Pão", en: "Bread", category_id: "meals" },
  { pt: "Queijo", en: "Cheese", category_id: "meals" },
  { pt: "Ovo", en: "Egg", category_id: "meals" },
  { pt: "Frango", en: "Chicken", category_id: "meals" },
  { pt: "Carne", en: "Meat / Beef", category_id: "meals" },
  { pt: "Peixe", en: "Fish", category_id: "meals" },
  { pt: "Salada", en: "Salad", category_id: "meals" },
  { pt: "Sopa", en: "Soup", category_id: "meals" },
  { pt: "Bolo", en: "Cake", category_id: "meals" },
  { pt: "Sorvete", en: "Ice cream", category_id: "meals" },
];

module.exports = { categories: [category], cards };
