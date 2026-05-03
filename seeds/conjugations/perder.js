const category = { id: "perder-conj", label: "Perder Conjugations", css_class: "cat-perder-conj", group_name: "Conjugations" };

const cards = [
  { pt: "Eu perco", en: "I lose (present)", category_id: "perder-conj" },
  { pt: "Eu perca", en: "I lose (present subjunctive)", category_id: "perder-conj" },
  { pt: "Você perca", en: "You lose (present subjunctive)", category_id: "perder-conj" },
  { pt: "Ele/Ela perca", en: "He/She loses (present subjunctive)", category_id: "perder-conj" },
  { pt: "Nós percamos", en: "We lose (present subjunctive)", category_id: "perder-conj" },
  { pt: "Vocês percam", en: "You all lose (present subjunctive)", category_id: "perder-conj" },
  { pt: "Eles/Elas percam", en: "They lose (present subjunctive)", category_id: "perder-conj" }
];

module.exports = { categories: [category], cards };
