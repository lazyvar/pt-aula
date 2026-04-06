const category = { id: "school", label: "School Supplies", css_class: "cat-school", group_name: "Topics" };

const cards = [
  { pt: "Caderno", en: "Notebook", category_id: "school" },
  { pt: "Caneta", en: "Pen", category_id: "school" },
  { pt: "Lápis", en: "Pencil", category_id: "school" },
  { pt: "Borracha", en: "Eraser", category_id: "school" },
  { pt: "Régua", en: "Ruler", category_id: "school" },
  { pt: "Tesoura", en: "Scissors", category_id: "school" },
  { pt: "Cola", en: "Glue", category_id: "school" },
  { pt: "Mochila", en: "Backpack", category_id: "school" },
  { pt: "Livro", en: "Book", category_id: "school" },
  { pt: "Quadro", en: "Blackboard / Whiteboard", category_id: "school" },
  { pt: "Prova", en: "Test / Exam", category_id: "school" },
  { pt: "Apontador", en: "Pencil sharpener", category_id: "school" },
];

module.exports = { categories: [category], cards };
