const category = { id: "end-ir", label: "-IR Endings", css_class: "cat-end-ir", group_name: "Verb Endings" };

// English side uses "leave" (partir) as the placeholder -IR verb.
const cards = [
  { pt: "-o (eu)", en: "I leave", category_id: "end-ir" },
  { pt: "-e (você)", en: "you leave", category_id: "end-ir" },
  { pt: "-e (ele/ela)", en: "he/she leaves", category_id: "end-ir" },
  { pt: "-imos (nós)", en: "we leave", category_id: "end-ir" },
  { pt: "-em (vocês)", en: "you all leave", category_id: "end-ir" },
  { pt: "-em (eles/elas)", en: "they leave", category_id: "end-ir" },
  { pt: "-ia (eu)", en: "I used to leave", category_id: "end-ir" },
  { pt: "-ia (você)", en: "you used to leave", category_id: "end-ir" },
  { pt: "-ia (ele/ela)", en: "he/she used to leave", category_id: "end-ir" },
  { pt: "-íamos (nós)", en: "we used to leave", category_id: "end-ir" },
  { pt: "-iam (vocês)", en: "you all used to leave", category_id: "end-ir" },
  { pt: "-iam (eles/elas)", en: "they used to leave", category_id: "end-ir" },
  { pt: "-i (eu)", en: "I left", category_id: "end-ir" },
  { pt: "-iu (você)", en: "you left", category_id: "end-ir" },
  { pt: "-iu (ele/ela)", en: "he/she left", category_id: "end-ir" },
  { pt: "-imos (nós)", en: "we left", category_id: "end-ir" },
  { pt: "-iram (vocês)", en: "you all left", category_id: "end-ir" },
  { pt: "-iram (eles/elas)", en: "they left", category_id: "end-ir" },
  { pt: "-iria (eu)", en: "I would leave", category_id: "end-ir" },
  { pt: "-iria (você)", en: "you would leave", category_id: "end-ir" },
  { pt: "-iria (ele/ela)", en: "he/she would leave", category_id: "end-ir" },
  { pt: "-iríamos (nós)", en: "we would leave", category_id: "end-ir" },
  { pt: "-iriam (vocês)", en: "you all would leave", category_id: "end-ir" },
  { pt: "-iriam (eles/elas)", en: "they would leave", category_id: "end-ir" }
];

module.exports = { categories: [category], cards };
