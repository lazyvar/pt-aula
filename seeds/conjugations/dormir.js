const category = { id: "dormir-conj", label: "Dormir Conjugations", css_class: "cat-dormir-conj", group_name: "Conjugations" };

const cards = [
  { pt: "Eu durmo", en: "I sleep (present)", category_id: "dormir-conj" },
  { pt: "Eu durma", en: "I sleep (present subjunctive)", category_id: "dormir-conj" },
  { pt: "Você durma", en: "You sleep (present subjunctive)", category_id: "dormir-conj" },
  { pt: "Ele/Ela durma", en: "He/She sleeps (present subjunctive)", category_id: "dormir-conj" },
  { pt: "Nós durmamos", en: "We sleep (present subjunctive)", category_id: "dormir-conj" },
  { pt: "Vocês durmam", en: "You all sleep (present subjunctive)", category_id: "dormir-conj" },
  { pt: "Eles/Elas durmam", en: "They sleep (present subjunctive)", category_id: "dormir-conj" }
];

module.exports = { categories: [category], cards };
