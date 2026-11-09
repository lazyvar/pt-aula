const category = { id: "aula-nov5", label: "Aula Nov 5", css_class: "cat-aula-nov5", group_name: "Aulas" };

const words = [
  { pt: "Brilho", en: "Shine / Brightness" },
  { pt: "Cortinas", en: "Curtains" },
  { pt: "Ir embora", en: "To leave / To go away" },
  { pt: "Vegetariano", en: "Vegetarian" },
  { pt: "Nada a ver com isso", en: "Nothing to do with that" },
  { pt: "Gênio", en: "Genius / Genie" },
  { pt: "Desejos", en: "Wishes / Desires" },
  { pt: "Ilimitado", en: "Unlimited" },
  { pt: "Palavrão", en: "Swear word" }
];

const cards = words.map(w => ({ ...w, category_id: category.id }));

module.exports = { categories: [category], cards };
