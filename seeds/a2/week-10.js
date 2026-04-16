// A2 Week 10 — Consolidation II
// More test-register phrases, continued advanced verb forms, review nouns.

const verbsCategory = {
  id: "a2-w10-verbs",
  label: "A2 W10 — Advanced Verb Forms II",
  css_class: "cat-a2-w10-verbs",
  group_name: "A2",
};

const nounsCategory = {
  id: "a2-w10-nouns",
  label: "A2 W10 — Review Nouns II",
  css_class: "cat-a2-w10-nouns",
  group_name: "A2",
};

const phrasesCategory = {
  id: "a2-w10-phrases",
  label: "A2 W10 — Formal Register",
  css_class: "cat-a2-w10-phrases",
  group_name: "A2",
};

const verbs = [
  { pt: "Logo que eu puder", en: "As soon as I can (future subj.)", category_id: "a2-w10-verbs" },
  { pt: "Se ele fizer", en: "If he does (future subj.)", category_id: "a2-w10-verbs" },
  { pt: "Quando tivermos", en: "When we have (future subj.)", category_id: "a2-w10-verbs" },
  { pt: "Para eles entenderem", en: "For them to understand (personal inf.)", category_id: "a2-w10-verbs" },
  { pt: "Antes de irmos", en: "Before we go (personal inf.)", category_id: "a2-w10-verbs" },
  { pt: "Ele já tinha saído", en: "He had already left (pluperfect)", category_id: "a2-w10-verbs" },
  { pt: "Nós tínhamos feito", en: "We had done (pluperfect)", category_id: "a2-w10-verbs" },
  { pt: "Se tivesse visto", en: "If had seen (pluperfect subj.)", category_id: "a2-w10-verbs" },
];

const phrases = [
  { pt: "De modo geral", en: "Generally speaking", category_id: "a2-w10-phrases" },
  { pt: "É preciso considerar", en: "We need to consider", category_id: "a2-w10-phrases" },
  { pt: "Vale lembrar que", en: "It's worth remembering that", category_id: "a2-w10-phrases" },
  { pt: "Não posso deixar de", en: "I can't help but", category_id: "a2-w10-phrases" },
  { pt: "Tenho dúvidas se", en: "I have doubts whether", category_id: "a2-w10-phrases" },
  { pt: "O fato é que", en: "The fact is that", category_id: "a2-w10-phrases" },
  { pt: "Concordo em parte", en: "I partially agree", category_id: "a2-w10-phrases" },
  { pt: "Discordo porque", en: "I disagree because", category_id: "a2-w10-phrases" },
  { pt: "Depende de", en: "It depends on", category_id: "a2-w10-phrases" },
  { pt: "De certa forma", en: "In a way / to some extent", category_id: "a2-w10-phrases" },
  { pt: "Pode ser que", en: "It may be that (+ subj.)", category_id: "a2-w10-phrases" },
  { pt: "Para ser sincero", en: "To be honest", category_id: "a2-w10-phrases" },
];

const nouns = [
  { pt: "Propósito", en: "Purpose", category_id: "a2-w10-nouns" },
  { pt: "Objetivo", en: "Goal / objective", category_id: "a2-w10-nouns" },
  { pt: "Plano", en: "Plan", category_id: "a2-w10-nouns" },
  { pt: "Progresso", en: "Progress", category_id: "a2-w10-nouns" },
  { pt: "Avanço", en: "Advance / progress", category_id: "a2-w10-nouns" },
  { pt: "Perda", en: "Loss", category_id: "a2-w10-nouns" },
  { pt: "Ganho", en: "Gain", category_id: "a2-w10-nouns" },
  { pt: "Risco", en: "Risk", category_id: "a2-w10-nouns" },
  { pt: "Benefício", en: "Benefit", category_id: "a2-w10-nouns" },
  { pt: "Preferência", en: "Preference", category_id: "a2-w10-nouns" },
];

module.exports = {
  categories: [verbsCategory, nounsCategory, phrasesCategory],
  cards: [...verbs, ...nouns, ...phrases],
};
