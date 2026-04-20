const category = { id: "poder-conj", label: "Poder Conjugations", css_class: "cat-poder-conj", group_name: "Conjugations" };

const cards = [
  { pt: "Eu posso", en: "I can (present)", category_id: "poder-conj" },
  { pt: "Eu pude", en: "I was able to (preterite)", category_id: "poder-conj" },
  { pt: "Você pôde", en: "You were able to (preterite)", category_id: "poder-conj" },
  { pt: "Ele/Ela pôde", en: "He/She was able to (preterite)", category_id: "poder-conj" },
  { pt: "Nós pudemos", en: "We were able to (preterite)", category_id: "poder-conj" },
  { pt: "Vocês puderam", en: "You all were able to (preterite)", category_id: "poder-conj" },
  { pt: "Eles/Elas puderam", en: "They were able to (preterite)", category_id: "poder-conj" }
];

module.exports = { categories: [category], cards };
