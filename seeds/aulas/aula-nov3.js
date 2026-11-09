const category = { id: "aula-nov3", label: "Aula Nov 3", css_class: "cat-aula-nov3", group_name: "Aulas" };

const words = [
  { pt: "Idoso", en: "Elderly person / Elderly" },
  { pt: "Catarata", en: "Cataract / Waterfall" },
  { pt: "Chorar", en: "To cry" },
  { pt: "Limpeza", en: "Cleaning / Cleanliness" },
  { pt: "Atualização", en: "Update" },
  { pt: "Aparência", en: "Appearance" },
  { pt: "Suficiente", en: "Enough / Sufficient" },
  { pt: "Conceito", en: "Concept" },
  { pt: "Compartilhar", en: "To share" },
  { pt: "Concordar", en: "To agree" },
  { pt: "Eu não estou com certeza", en: "I'm not sure (right now)" }
];

const cards = words.map(w => ({ ...w, category_id: category.id }));

module.exports = { categories: [category], cards };
