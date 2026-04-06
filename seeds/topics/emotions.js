const category = { id: "emotions", label: "Emotions", css_class: "cat-emotions", group_name: "Topics" };

const cards = [
  { pt: "Feliz", en: "Happy", category_id: "emotions" },
  { pt: "Triste", en: "Sad", category_id: "emotions" },
  { pt: "Raiva", en: "Anger", category_id: "emotions" },
  { pt: "Medo", en: "Fear", category_id: "emotions" },
  { pt: "Surpresa", en: "Surprise", category_id: "emotions" },
  { pt: "Ansiedade", en: "Anxiety", category_id: "emotions" },
  { pt: "Alegria", en: "Joy", category_id: "emotions" },
  { pt: "Saudade", en: "Longing / Missing someone", category_id: "emotions" },
  { pt: "Vergonha", en: "Shame / Embarrassment", category_id: "emotions" },
  { pt: "Orgulho", en: "Pride", category_id: "emotions" },
  { pt: "Ciúme", en: "Jealousy", category_id: "emotions" },
  { pt: "Preguiça", en: "Laziness", category_id: "emotions" },
  { pt: "Esperança", en: "Hope", category_id: "emotions" },
  { pt: "Carinho", en: "Affection / Tenderness", category_id: "emotions" },
];

module.exports = { categories: [category], cards };
