const category = { id: "furniture", label: "Furniture", css_class: "cat-furniture", group_name: "Topics" };

const cards = [
  { pt: "Mesa", en: "Table", category_id: "furniture" },
  { pt: "Cadeira", en: "Chair", category_id: "furniture" },
  { pt: "Sofá", en: "Sofa / Couch", category_id: "furniture" },
  { pt: "Cama", en: "Bed", category_id: "furniture" },
  { pt: "Armário", en: "Wardrobe / Cabinet", category_id: "furniture" },
  { pt: "Estante", en: "Bookshelf", category_id: "furniture" },
  { pt: "Gaveta", en: "Drawer", category_id: "furniture" },
  { pt: "Tapete", en: "Rug / Carpet", category_id: "furniture" },
  { pt: "Cortina", en: "Curtain", category_id: "furniture" },
  { pt: "Espelho", en: "Mirror", category_id: "furniture" },
  { pt: "Travesseiro", en: "Pillow", category_id: "furniture" },
  { pt: "Cobertor", en: "Blanket", category_id: "furniture" },
];

module.exports = { categories: [category], cards };
