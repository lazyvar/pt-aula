const category = { id: "end-ar", label: "-AR Endings", css_class: "cat-end-ar", group_name: "Verb Endings" };

// English side uses "walk" (andar) as the placeholder -AR verb, so the tense
// and person are readable at a glance.
const cards = [
  { pt: "-o (eu)", en: "I walk", category_id: "end-ar" },
  { pt: "-a (você)", en: "you walk", category_id: "end-ar" },
  { pt: "-a (ele/ela)", en: "he/she walks", category_id: "end-ar" },
  { pt: "-amos (nós)", en: "we walk", category_id: "end-ar" },
  { pt: "-am (vocês)", en: "you all walk", category_id: "end-ar" },
  { pt: "-am (eles/elas)", en: "they walk", category_id: "end-ar" },
  { pt: "-ei (eu)", en: "I walked", category_id: "end-ar" },
  { pt: "-ou (você)", en: "you walked", category_id: "end-ar" },
  { pt: "-ou (ele/ela)", en: "he/she walked", category_id: "end-ar" },
  { pt: "-amos (nós)", en: "we walked", category_id: "end-ar" },
  { pt: "-aram (vocês)", en: "you all walked", category_id: "end-ar" },
  { pt: "-aram (eles/elas)", en: "they walked", category_id: "end-ar" }
];

module.exports = { categories: [category], cards };
