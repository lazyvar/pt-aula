const category = { id: "pedir-conj", label: "Pedir Conjugations", css_class: "cat-pedir-conj", group_name: "Conjugations" };

const cards = [
  { pt: "Eu peço", en: "I ask for (present)", category_id: "pedir-conj" },
  { pt: "Eu peça", en: "I ask for (present subjunctive)", category_id: "pedir-conj" },
  { pt: "Você peça", en: "You ask for (present subjunctive)", category_id: "pedir-conj" },
  { pt: "Ele/Ela peça", en: "He/She asks for (present subjunctive)", category_id: "pedir-conj" },
  { pt: "Nós peçamos", en: "We ask for (present subjunctive)", category_id: "pedir-conj" },
  { pt: "Vocês peçam", en: "You all ask for (present subjunctive)", category_id: "pedir-conj" },
  { pt: "Eles/Elas peçam", en: "They ask for (present subjunctive)", category_id: "pedir-conj" }
];

module.exports = { categories: [category], cards };
