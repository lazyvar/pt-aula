const category = { id: "dar-conj", label: "Dar Conjugations", css_class: "cat-dar-conj", group_name: "Conjugations" };

const cards = [
  { pt: "Eu dou", en: "I give (present)", category_id: "dar-conj" },
  { pt: "Você dá", en: "You give (present)", category_id: "dar-conj" },
  { pt: "Ele/Ela dá", en: "He/She gives (present)", category_id: "dar-conj" },
  { pt: "Vocês dão", en: "You all give (present)", category_id: "dar-conj" },
  { pt: "Eles/Elas dão", en: "They give (present)", category_id: "dar-conj" },
  { pt: "Você deu", en: "You gave (preterite)", category_id: "dar-conj" },
  { pt: "Ele/Ela deu", en: "He/She gave (preterite)", category_id: "dar-conj" },
  { pt: "Nós demos", en: "We gave (preterite)", category_id: "dar-conj" },
  { pt: "Vocês deram", en: "You all gave (preterite)", category_id: "dar-conj" },
  { pt: "Eles/Elas deram", en: "They gave (preterite)", category_id: "dar-conj" }
];

module.exports = { categories: [category], cards };
