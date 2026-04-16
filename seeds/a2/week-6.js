// A2 Week 6 — Relative Pronouns & Connectors II
// More object-pronoun practice, relative constructions, idea-linking nouns.

const verbsCategory = {
  id: "a2-w6-verbs",
  label: "A2 W6 — Object Pronouns II",
  css_class: "cat-a2-w6-verbs",
  group_name: "A2",
};

const nounsCategory = {
  id: "a2-w6-nouns",
  label: "A2 W6 — Structure Nouns",
  css_class: "cat-a2-w6-nouns",
  group_name: "A2",
};

const phrasesCategory = {
  id: "a2-w6-phrases",
  label: "A2 W6 — Connectors II",
  css_class: "cat-a2-w6-phrases",
  group_name: "A2",
};

const verbs = [
  { pt: "Eu o visitei", en: "I visited him (formal)", category_id: "a2-w6-verbs" },
  { pt: "Ele me trouxe", en: "He brought me / brought it to me", category_id: "a2-w6-verbs" },
  { pt: "Me dá isso", en: "Give me that (spoken imperative)", category_id: "a2-w6-verbs" },
  { pt: "Ela o ajudou", en: "She helped him (formal)", category_id: "a2-w6-verbs" },
  { pt: "Te avisaram", en: "They let you know", category_id: "a2-w6-verbs" },
  { pt: "Eu a vi ontem", en: "I saw her yesterday (formal)", category_id: "a2-w6-verbs" },
  { pt: "Eles nos levaram", en: "They took us", category_id: "a2-w6-verbs" },
];

const phrases = [
  { pt: "Contudo", en: "Nevertheless / however", category_id: "a2-w6-phrases" },
  { pt: "Assim que", en: "As soon as", category_id: "a2-w6-phrases" },
  { pt: "Logo que", en: "As soon as", category_id: "a2-w6-phrases" },
  { pt: "Tudo o que", en: "Everything that (relative)", category_id: "a2-w6-phrases" },
  { pt: "Quem quiser", en: "Whoever wants (relative + subj.)", category_id: "a2-w6-phrases" },
  { pt: "Cujo", en: "Whose (relative)", category_id: "a2-w6-phrases" },
  { pt: "Já que", en: "Since / given that", category_id: "a2-w6-phrases" },
  { pt: "Aquilo que eu disse", en: "That which I said", category_id: "a2-w6-phrases" },
  { pt: "Por conseguinte", en: "Consequently", category_id: "a2-w6-phrases" },
  { pt: "Há dez anos", en: "Ten years ago", category_id: "a2-w6-phrases" },
];

const nouns = [
  { pt: "Acontecimento", en: "Event / happening", category_id: "a2-w6-nouns" },
  { pt: "Situação", en: "Situation", category_id: "a2-w6-nouns" },
  { pt: "Conclusão", en: "Conclusion", category_id: "a2-w6-nouns" },
  { pt: "Começo", en: "Beginning", category_id: "a2-w6-nouns" },
  { pt: "Etapa", en: "Stage / step", category_id: "a2-w6-nouns" },
  { pt: "Solução", en: "Solution", category_id: "a2-w6-nouns" },
  { pt: "Trecho", en: "Excerpt / stretch", category_id: "a2-w6-nouns" },
];

module.exports = {
  categories: [verbsCategory, nounsCategory, phrasesCategory],
  cards: [...verbs, ...nouns, ...phrases],
};
