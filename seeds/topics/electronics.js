const category = { id: "electronics", label: "Electronics", css_class: "cat-electronics", group_name: "Topics" };

const cards = [
  { pt: "Celular", en: "Cell phone", category_id: "electronics" },
  { pt: "Computador", en: "Computer", category_id: "electronics" },
  { pt: "Televisão", en: "Television", category_id: "electronics" },
  { pt: "Fone de ouvido", en: "Headphones", category_id: "electronics" },
  { pt: "Carregador", en: "Charger", category_id: "electronics" },
  { pt: "Teclado", en: "Keyboard", category_id: "electronics" },
  { pt: "Mouse", en: "Mouse", category_id: "electronics" },
  { pt: "Tela", en: "Screen", category_id: "electronics" },
  { pt: "Câmera", en: "Camera", category_id: "electronics" },
  { pt: "Caixa de som", en: "Speaker", category_id: "electronics" },
  { pt: "Impressora", en: "Printer", category_id: "electronics" },
  { pt: "Notebook", en: "Laptop", category_id: "electronics" },
];

module.exports = { categories: [category], cards };
