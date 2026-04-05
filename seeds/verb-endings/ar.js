const category = { id: "end-ar", label: "-AR Endings", css_class: "cat-end-ar", group_name: "Verb Endings" };

const cards = [
  { pt: "-o (eu)", en: "eu (present)", category_id: "end-ar" },
  { pt: "-a (você)", en: "você (present)", category_id: "end-ar" },
  { pt: "-a (ele/ela)", en: "ele/ela (present)", category_id: "end-ar" },
  { pt: "-amos (nós)", en: "nós (present)", category_id: "end-ar" },
  { pt: "-am (vocês)", en: "vocês (present)", category_id: "end-ar" },
  { pt: "-am (eles/elas)", en: "eles/elas (present)", category_id: "end-ar" },
  { pt: "-ei (eu)", en: "eu (past)", category_id: "end-ar" },
  { pt: "-ou (você)", en: "você (past)", category_id: "end-ar" },
  { pt: "-ou (ele/ela)", en: "ele/ela (past)", category_id: "end-ar" },
  { pt: "-amos (nós)", en: "nós (past)", category_id: "end-ar" },
  { pt: "-aram (vocês)", en: "vocês (past)", category_id: "end-ar" },
  { pt: "-aram (eles/elas)", en: "eles/elas (past)", category_id: "end-ar" }
];

module.exports = { categories: [category], cards };
