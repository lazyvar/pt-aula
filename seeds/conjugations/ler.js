const category = { id: "ler-conj", label: "Ler Conjugations", css_class: "cat-ler-conj", group_name: "Conjugations" };

const cards = [
  { pt: "Eu leio", en: "I read (present)", category_id: "ler-conj" },
  { pt: "Você lê", en: "You read (present)", category_id: "ler-conj" },
  { pt: "Ele/Ela lê", en: "He/She reads (present)", category_id: "ler-conj" },
  { pt: "Vocês leem", en: "You all read (present)", category_id: "ler-conj" },
  { pt: "Eles/Elas leem", en: "They read (present)", category_id: "ler-conj" },
  { pt: "Eu leia", en: "I read (present subjunctive)", category_id: "ler-conj" },
  { pt: "Você leia", en: "You read (present subjunctive)", category_id: "ler-conj" },
  { pt: "Ele/Ela leia", en: "He/She reads (present subjunctive)", category_id: "ler-conj" },
  { pt: "Nós leiamos", en: "We read (present subjunctive)", category_id: "ler-conj" },
  { pt: "Vocês leiam", en: "You all read (present subjunctive)", category_id: "ler-conj" },
  { pt: "Eles/Elas leiam", en: "They read (present subjunctive)", category_id: "ler-conj" }
];

module.exports = { categories: [category], cards };
