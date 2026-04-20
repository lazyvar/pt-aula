const category = { id: "saber-conj", label: "Saber Conjugations", css_class: "cat-saber-conj", group_name: "Conjugations" };

const cards = [
  { pt: "Eu sei", en: "I know (present)", category_id: "saber-conj" },
  { pt: "Eu soube", en: "I found out (preterite)", category_id: "saber-conj" },
  { pt: "Você soube", en: "You found out (preterite)", category_id: "saber-conj" },
  { pt: "Ele/Ela soube", en: "He/She found out (preterite)", category_id: "saber-conj" },
  { pt: "Nós soubemos", en: "We found out (preterite)", category_id: "saber-conj" },
  { pt: "Vocês souberam", en: "You all found out (preterite)", category_id: "saber-conj" },
  { pt: "Eles/Elas souberam", en: "They found out (preterite)", category_id: "saber-conj" }
];

module.exports = { categories: [category], cards };
