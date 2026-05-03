const category = { id: "ouvir-conj", label: "Ouvir Conjugations", css_class: "cat-ouvir-conj", group_name: "Conjugations" };

const cards = [
  { pt: "Eu ouço", en: "I hear (present)", category_id: "ouvir-conj" },
  { pt: "Eu ouça", en: "I hear (present subjunctive)", category_id: "ouvir-conj" },
  { pt: "Você ouça", en: "You hear (present subjunctive)", category_id: "ouvir-conj" },
  { pt: "Ele/Ela ouça", en: "He/She hears (present subjunctive)", category_id: "ouvir-conj" },
  { pt: "Nós ouçamos", en: "We hear (present subjunctive)", category_id: "ouvir-conj" },
  { pt: "Vocês ouçam", en: "You all hear (present subjunctive)", category_id: "ouvir-conj" },
  { pt: "Eles/Elas ouçam", en: "They hear (present subjunctive)", category_id: "ouvir-conj" }
];

module.exports = { categories: [category], cards };
