const category = { id: "shops", label: "Stores & Shops", css_class: "cat-shops", group_name: "Topics" };

const cards = [
  { pt: "Supermercado", en: "Supermarket", category_id: "shops" },
  { pt: "Padaria", en: "Bakery", category_id: "shops" },
  { pt: "Farmácia", en: "Pharmacy", category_id: "shops" },
  { pt: "Livraria", en: "Bookstore", category_id: "shops" },
  { pt: "Loja", en: "Store / Shop", category_id: "shops" },
  { pt: "Shopping", en: "Shopping mall", category_id: "shops" },
  { pt: "Feira", en: "Open-air market", category_id: "shops" },
  { pt: "Açougue", en: "Butcher shop", category_id: "shops" },
  { pt: "Floricultura", en: "Flower shop", category_id: "shops" },
  { pt: "Sapataria", en: "Shoe store", category_id: "shops" },
  { pt: "Banca de jornal", en: "Newsstand", category_id: "shops" },
  { pt: "Pet shop", en: "Pet store", category_id: "shops" },
];

module.exports = { categories: [category], cards };
