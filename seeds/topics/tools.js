const category = { id: "tools", label: "Tools", css_class: "cat-tools", group_name: "Topics" };

const cards = [
  { pt: "Martelo", en: "Hammer", category_id: "tools" },
  { pt: "Chave de fenda", en: "Screwdriver", category_id: "tools" },
  { pt: "Parafuso", en: "Screw", category_id: "tools" },
  { pt: "Prego", en: "Nail", category_id: "tools" },
  { pt: "Serra", en: "Saw", category_id: "tools" },
  { pt: "Alicate", en: "Pliers", category_id: "tools" },
  { pt: "Furadeira", en: "Drill", category_id: "tools" },
  { pt: "Chave inglesa", en: "Wrench", category_id: "tools" },
  { pt: "Fita adesiva", en: "Tape", category_id: "tools" },
  { pt: "Escada", en: "Ladder", category_id: "tools" },
  { pt: "Balde", en: "Bucket", category_id: "tools" },
  { pt: "Vassoura", en: "Broom", category_id: "tools" },
];

module.exports = { categories: [category], cards };
