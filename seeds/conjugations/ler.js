const category = { id: "ler-conj", label: "Ler Conjugations", css_class: "cat-ler-conj", group_name: "Conjugations" };

const cards = [
  { pt: "Eu leio", en: "I read (present)", category_id: "ler-conj" },
  { pt: "Você lê", en: "You read (present)", category_id: "ler-conj" },
  { pt: "Ele/Ela lê", en: "He/She reads (present)", category_id: "ler-conj" },
  { pt: "Vocês leem", en: "You all read (present)", category_id: "ler-conj" },
  { pt: "Eles/Elas leem", en: "They read (present)", category_id: "ler-conj" }
];

module.exports = { categories: [category], cards };
