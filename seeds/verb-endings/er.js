const category = { id: "end-er", label: "-ER Endings", css_class: "cat-end-er", group_name: "Verb Endings" };

const cards = [
  { pt: "-o (eu)", en: "eu (present)", category_id: "end-er" },
  { pt: "-e (você)", en: "você (present)", category_id: "end-er" },
  { pt: "-e (ele/ela)", en: "ele/ela (present)", category_id: "end-er" },
  { pt: "-emos (nós)", en: "nós (present)", category_id: "end-er" },
  { pt: "-em (vocês)", en: "vocês (present)", category_id: "end-er" },
  { pt: "-em (eles/elas)", en: "eles/elas (present)", category_id: "end-er" },
  { pt: "-i (eu)", en: "eu (past)", category_id: "end-er" },
  { pt: "-eu (você)", en: "você (past)", category_id: "end-er" },
  { pt: "-eu (ele/ela)", en: "ele/ela (past)", category_id: "end-er" },
  { pt: "-emos (nós)", en: "nós (past)", category_id: "end-er" },
  { pt: "-eram (vocês)", en: "vocês (past)", category_id: "end-er" },
  { pt: "-eram (eles/elas)", en: "eles/elas (past)", category_id: "end-er" }
];

module.exports = { categories: [category], cards };
