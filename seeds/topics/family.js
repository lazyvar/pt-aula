const category = { id: "family", label: "Family", css_class: "cat-family", group_name: "Topics" };

const cards = [
  { pt: "Mãe", en: "Mother", category_id: "family" },
  { pt: "Pai", en: "Father", category_id: "family" },
  { pt: "Filho", en: "Son", category_id: "family" },
  { pt: "Filha", en: "Daughter", category_id: "family" },
  { pt: "Irmão", en: "Brother", category_id: "family" },
  { pt: "Irmã", en: "Sister", category_id: "family" },
  { pt: "Avô", en: "Grandfather", category_id: "family" },
  { pt: "Avó", en: "Grandmother", category_id: "family" },
  { pt: "Tio", en: "Uncle", category_id: "family" },
  { pt: "Tia", en: "Aunt", category_id: "family" },
  { pt: "Primo", en: "Cousin (male)", category_id: "family" },
  { pt: "Prima", en: "Cousin (female)", category_id: "family" },
  { pt: "Sobrinho", en: "Nephew", category_id: "family" },
  { pt: "Sobrinha", en: "Niece", category_id: "family" },
  { pt: "Marido", en: "Husband", category_id: "family" },
  { pt: "Esposa", en: "Wife", category_id: "family" },
];

module.exports = { categories: [category], cards };
