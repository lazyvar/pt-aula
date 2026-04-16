// A2 Week 4 — Imperfect Subjunctive
// Hypotheticals after "se"; triggering expressions; abstract nouns.

const verbsCategory = {
  id: "a2-w4-verbs",
  label: "A2 W4 — Imperfect Subjunctive",
  css_class: "cat-a2-w4-verbs",
  group_name: "A2",
};

const nounsCategory = {
  id: "a2-w4-nouns",
  label: "A2 W4 — Abstract Nouns II",
  css_class: "cat-a2-w4-nouns",
  group_name: "A2",
};

const phrasesCategory = {
  id: "a2-w4-phrases",
  label: "A2 W4 — Subjunctive Triggers II",
  css_class: "cat-a2-w4-phrases",
  group_name: "A2",
};

const verbs = [
  { pt: "Se eu fosse", en: "If I were (imperfect subj. of ser/ir)", category_id: "a2-w4-verbs" },
  { pt: "Se você tivesse", en: "If you had (imperfect subj. of ter)", category_id: "a2-w4-verbs" },
  { pt: "Se ele estivesse", en: "If he were (imperfect subj. of estar)", category_id: "a2-w4-verbs" },
  { pt: "Se nós fôssemos", en: "If we went/were (imperfect subj.)", category_id: "a2-w4-verbs" },
  { pt: "Se eles pudessem", en: "If they could (imperfect subj. of poder)", category_id: "a2-w4-verbs" },
  { pt: "Se eu fizesse", en: "If I did/made (imperfect subj. of fazer)", category_id: "a2-w4-verbs" },
  { pt: "Se houvesse", en: "If there were (imperfect subj. of haver)", category_id: "a2-w4-verbs" },
  { pt: "Se você visse", en: "If you saw (imperfect subj. of ver)", category_id: "a2-w4-verbs" },
  { pt: "Se eu soubesse", en: "If I knew (imperfect subj. of saber)", category_id: "a2-w4-verbs" },
  { pt: "Se ele desse", en: "If he gave (imperfect subj. of dar)", category_id: "a2-w4-verbs" },
  { pt: "Se eu quisesse", en: "If I wanted (imperfect subj. of querer)", category_id: "a2-w4-verbs" },
  { pt: "Se vocês viessem", en: "If you all came (imperfect subj. of vir)", category_id: "a2-w4-verbs" },
  { pt: "Se eu dissesse", en: "If I said (imperfect subj. of dizer)", category_id: "a2-w4-verbs" },
  { pt: "Se ele trouxesse", en: "If he brought (imperfect subj. of trazer)", category_id: "a2-w4-verbs" },
  { pt: "Se nós pudéssemos", en: "If we could (imperfect subj. of poder)", category_id: "a2-w4-verbs" },
];

const phrases = [
  { pt: "Se eu pudesse", en: "If I could", category_id: "a2-w4-phrases" },
  { pt: "Se eu fosse você", en: "If I were you", category_id: "a2-w4-phrases" },
  { pt: "Como se", en: "As if (+ imperfect subj.)", category_id: "a2-w4-phrases" },
  { pt: "Ainda que", en: "Even though (+ subj.)", category_id: "a2-w4-phrases" },
  { pt: "Mesmo que", en: "Even if (+ subj.)", category_id: "a2-w4-phrases" },
  { pt: "A menos que", en: "Unless (+ subj.)", category_id: "a2-w4-phrases" },
  { pt: "Desde que", en: "Provided that (+ subj.)", category_id: "a2-w4-phrases" },
  { pt: "Até que", en: "Until (+ subj.)", category_id: "a2-w4-phrases" },
  { pt: "Nem que", en: "Even if (+ subj.)", category_id: "a2-w4-phrases" },
  { pt: "Seria bom se", en: "It would be good if (+ imperfect subj.)", category_id: "a2-w4-phrases" },
];

const nouns = [
  { pt: "Possibilidade", en: "Possibility", category_id: "a2-w4-nouns" },
  { pt: "Necessidade", en: "Necessity", category_id: "a2-w4-nouns" },
  { pt: "Oportunidade", en: "Opportunity", category_id: "a2-w4-nouns" },
  { pt: "Decisão", en: "Decision", category_id: "a2-w4-nouns" },
  { pt: "Opinião", en: "Opinion", category_id: "a2-w4-nouns" },
];

module.exports = {
  categories: [verbsCategory, nounsCategory, phrasesCategory],
  cards: [...verbs, ...nouns, ...phrases],
};
