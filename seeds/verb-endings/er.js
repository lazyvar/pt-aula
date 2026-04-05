const category = { id: "end-er", label: "-ER Endings", css_class: "cat-end-er", group_name: "Verb Endings" };

// English side uses "eat" (comer) as the placeholder -ER verb.
const cards = [
  { pt: "-o (eu)", en: "I eat", category_id: "end-er" },
  { pt: "-e (você)", en: "you eat", category_id: "end-er" },
  { pt: "-e (ele/ela)", en: "he/she eats", category_id: "end-er" },
  { pt: "-emos (nós)", en: "we eat", category_id: "end-er" },
  { pt: "-em (vocês)", en: "you all eat", category_id: "end-er" },
  { pt: "-em (eles/elas)", en: "they eat", category_id: "end-er" },
  { pt: "-i (eu)", en: "I ate", category_id: "end-er" },
  { pt: "-eu (você)", en: "you ate", category_id: "end-er" },
  { pt: "-eu (ele/ela)", en: "he/she ate", category_id: "end-er" },
  { pt: "-emos (nós)", en: "we ate", category_id: "end-er" },
  { pt: "-eram (vocês)", en: "you all ate", category_id: "end-er" },
  { pt: "-eram (eles/elas)", en: "they ate", category_id: "end-er" }
];

module.exports = { categories: [category], cards };
