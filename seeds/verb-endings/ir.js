const category = { id: "end-ir", label: "-IR Endings", css_class: "cat-end-ir", group_name: "Verb Endings" };

// English side uses "leave" (partir) as the placeholder -IR verb.
const cards = [
  { pt: "-o (eu)", en: "I leave", category_id: "end-ir" },
  { pt: "-e (você)", en: "you leave", category_id: "end-ir" },
  { pt: "-e (ele/ela)", en: "he/she leaves", category_id: "end-ir" },
  { pt: "-imos (nós)", en: "we leave", category_id: "end-ir" },
  { pt: "-em (vocês)", en: "you all leave", category_id: "end-ir" },
  { pt: "-em (eles/elas)", en: "they leave", category_id: "end-ir" },
  { pt: "-i (eu)", en: "I left", category_id: "end-ir" },
  { pt: "-iu (você)", en: "you left", category_id: "end-ir" },
  { pt: "-iu (ele/ela)", en: "he/she left", category_id: "end-ir" },
  { pt: "-imos (nós)", en: "we left", category_id: "end-ir" },
  { pt: "-iram (vocês)", en: "you all left", category_id: "end-ir" },
  { pt: "-iram (eles/elas)", en: "they left", category_id: "end-ir" }
];

module.exports = { categories: [category], cards };
