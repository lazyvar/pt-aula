// A2 Week 9 — Consolidation I
// Test-register phrases (hedging, opinion), less-practiced verb forms
// (future subjunctive, personal infinitive, pluperfect), review nouns.

const verbsCategory = {
  id: "a2-w9-verbs",
  label: "A2 W9 — Future Subj. / Personal Inf. / Pluperfect",
  css_class: "cat-a2-w9-verbs",
  group_name: "A2",
};

const nounsCategory = {
  id: "a2-w9-nouns",
  label: "A2 W9 — Review Nouns I",
  css_class: "cat-a2-w9-nouns",
  group_name: "A2",
};

const phrasesCategory = {
  id: "a2-w9-phrases",
  label: "A2 W9 — Opinion & Hedging",
  css_class: "cat-a2-w9-phrases",
  group_name: "A2",
};

const verbs = [
  { pt: "Quando eu chegar", en: "When I arrive (future subj.)", category_id: "a2-w9-verbs" },
  { pt: "Se você quiser", en: "If you want (future subj.)", category_id: "a2-w9-verbs" },
  { pt: "Assim que ele puder", en: "As soon as he can (future subj.)", category_id: "a2-w9-verbs" },
  { pt: "Para nós sabermos", en: "For us to know (personal infinitive)", category_id: "a2-w9-verbs" },
  { pt: "Antes de você chegar", en: "Before you arrive (personal inf.)", category_id: "a2-w9-verbs" },
  { pt: "Eu tinha comido", en: "I had eaten (pluperfect)", category_id: "a2-w9-verbs" },
  { pt: "Ele tinha chegado", en: "He had arrived (pluperfect)", category_id: "a2-w9-verbs" },
  { pt: "Se eu tivesse sabido", en: "If I had known (pluperfect subj.)", category_id: "a2-w9-verbs" },
];

const phrases = [
  { pt: "Na minha opinião", en: "In my opinion", category_id: "a2-w9-phrases" },
  { pt: "Acho que", en: "I think that", category_id: "a2-w9-phrases" },
  { pt: "Me parece que", en: "It seems to me that", category_id: "a2-w9-phrases" },
  { pt: "Seria melhor", en: "It would be better", category_id: "a2-w9-phrases" },
  { pt: "Tenho a impressão de que", en: "I have the impression that", category_id: "a2-w9-phrases" },
  { pt: "Não tenho certeza se", en: "I'm not sure if / whether", category_id: "a2-w9-phrases" },
  { pt: "Do meu ponto de vista", en: "From my point of view", category_id: "a2-w9-phrases" },
  { pt: "Por um lado", en: "On one hand", category_id: "a2-w9-phrases" },
  { pt: "Por outro lado", en: "On the other hand", category_id: "a2-w9-phrases" },
  { pt: "Vale destacar", en: "It's worth highlighting", category_id: "a2-w9-phrases" },
  { pt: "Em primeiro lugar", en: "In the first place", category_id: "a2-w9-phrases" },
  { pt: "Dito isso", en: "That said", category_id: "a2-w9-phrases" },
  { pt: "Em suma", en: "In short / in summary", category_id: "a2-w9-phrases" },
];

const nouns = [
  { pt: "Escolha", en: "Choice", category_id: "a2-w9-nouns" },
  { pt: "Preocupação", en: "Worry / concern", category_id: "a2-w9-nouns" },
  { pt: "Desafio", en: "Challenge", category_id: "a2-w9-nouns" },
  { pt: "Resultado", en: "Result", category_id: "a2-w9-nouns" },
  { pt: "Impacto", en: "Impact", category_id: "a2-w9-nouns" },
  { pt: "Diferença", en: "Difference", category_id: "a2-w9-nouns" },
  { pt: "Vantagem", en: "Advantage", category_id: "a2-w9-nouns" },
  { pt: "Desvantagem", en: "Disadvantage", category_id: "a2-w9-nouns" },
  { pt: "Realidade", en: "Reality", category_id: "a2-w9-nouns" },
  { pt: "Expectativa", en: "Expectation", category_id: "a2-w9-nouns" },
];

module.exports = {
  categories: [verbsCategory, nounsCategory, phrasesCategory],
  cards: [...verbs, ...nouns, ...phrases],
};
