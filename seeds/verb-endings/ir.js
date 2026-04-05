const category = { id: "end-ir", label: "-IR Endings", css_class: "cat-end-ir", group_name: "Verb Endings" };

const cards = [
  { pt: "-o (eu)", en: "eu (present)", category_id: "end-ir" },
  { pt: "-e (você)", en: "você (present)", category_id: "end-ir" },
  { pt: "-e (ele/ela)", en: "ele/ela (present)", category_id: "end-ir" },
  { pt: "-imos (nós)", en: "nós (present)", category_id: "end-ir" },
  { pt: "-em (vocês)", en: "vocês (present)", category_id: "end-ir" },
  { pt: "-em (eles/elas)", en: "eles/elas (present)", category_id: "end-ir" },
  { pt: "-i (eu)", en: "eu (past)", category_id: "end-ir" },
  { pt: "-iu (você)", en: "você (past)", category_id: "end-ir" },
  { pt: "-iu (ele/ela)", en: "ele/ela (past)", category_id: "end-ir" },
  { pt: "-imos (nós)", en: "nós (past)", category_id: "end-ir" },
  { pt: "-iram (vocês)", en: "vocês (past)", category_id: "end-ir" },
  { pt: "-iram (eles/elas)", en: "eles/elas (past)", category_id: "end-ir" }
];

module.exports = { categories: [category], cards };
