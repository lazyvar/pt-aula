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
  { pt: "-ava (eu)", en: "I used to walk", category_id: "end-ar" },
  { pt: "-ava (você)", en: "you used to walk", category_id: "end-ar" },
  { pt: "-ava (ele/ela)", en: "he/she used to walk", category_id: "end-ar" },
  { pt: "-ávamos (nós)", en: "we used to walk", category_id: "end-ar" },
  { pt: "-avam (vocês)", en: "you all used to walk", category_id: "end-ar" },
  { pt: "-avam (eles/elas)", en: "they used to walk", category_id: "end-ar" },
  { pt: "-ei (eu)", en: "I walked", category_id: "end-ar" },
  { pt: "-ou (você)", en: "you walked", category_id: "end-ar" },
  { pt: "-ou (ele/ela)", en: "he/she walked", category_id: "end-ar" },
  { pt: "-amos (nós)", en: "we walked", category_id: "end-ar" },
  { pt: "-aram (vocês)", en: "you all walked", category_id: "end-ar" },
  { pt: "-aram (eles/elas)", en: "they walked", category_id: "end-ar" },
  { pt: "-aria (eu)", en: "I would walk", category_id: "end-ar" },
  { pt: "-aria (você)", en: "you would walk", category_id: "end-ar" },
  { pt: "-aria (ele/ela)", en: "he/she would walk", category_id: "end-ar" },
  { pt: "-aríamos (nós)", en: "we would walk", category_id: "end-ar" },
  { pt: "-ariam (vocês)", en: "you all would walk", category_id: "end-ar" },
  { pt: "-ariam (eles/elas)", en: "they would walk", category_id: "end-ar" }
];

module.exports = { categories: [category], cards };
