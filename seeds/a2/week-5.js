// A2 Week 5 — Object Pronouns (formal vs. spoken Brazilian)
// Direct object pronoun placement in both registers; connectors; storytelling nouns.

const verbsCategory = {
  id: "a2-w5-verbs",
  label: "A2 W5 — Object Pronouns (formal/spoken)",
  css_class: "cat-a2-w5-verbs",
  group_name: "A2",
};

const nounsCategory = {
  id: "a2-w5-nouns",
  label: "A2 W5 — Narrative Nouns",
  css_class: "cat-a2-w5-nouns",
  group_name: "A2",
};

const phrasesCategory = {
  id: "a2-w5-phrases",
  label: "A2 W5 — Connectors I",
  css_class: "cat-a2-w5-phrases",
  group_name: "A2",
};

const verbs = [
  { pt: "Eu o vi", en: "I saw him (formal register)", category_id: "a2-w5-verbs" },
  { pt: "Eu vi ele", en: "I saw him (spoken Brazilian)", category_id: "a2-w5-verbs" },
  { pt: "Eu a conheci", en: "I met her (formal register)", category_id: "a2-w5-verbs" },
  { pt: "Eu conheci ela", en: "I met her (spoken Brazilian)", category_id: "a2-w5-verbs" },
  { pt: "Ele me ajudou", en: "He helped me", category_id: "a2-w5-verbs" },
  { pt: "Ela te chamou", en: "She called you", category_id: "a2-w5-verbs" },
  { pt: "Nós os encontramos", en: "We met them (formal)", category_id: "a2-w5-verbs" },
  { pt: "Nós encontramos eles", en: "We met them (spoken)", category_id: "a2-w5-verbs" },
];

const phrases = [
  { pt: "No entanto", en: "However", category_id: "a2-w5-phrases" },
  { pt: "Apesar de", en: "Despite / in spite of", category_id: "a2-w5-phrases" },
  { pt: "Portanto", en: "Therefore", category_id: "a2-w5-phrases" },
  { pt: "Por isso", en: "That's why / for that reason", category_id: "a2-w5-phrases" },
  { pt: "Além disso", en: "Besides / in addition", category_id: "a2-w5-phrases" },
  { pt: "Enquanto isso", en: "Meanwhile", category_id: "a2-w5-phrases" },
  { pt: "A pessoa que", en: "The person who (relative)", category_id: "a2-w5-phrases" },
  { pt: "O lugar onde", en: "The place where (relative)", category_id: "a2-w5-phrases" },
  { pt: "A razão pela qual", en: "The reason why (relative)", category_id: "a2-w5-phrases" },
  { pt: "Faz dois anos que", en: "It's been two years since", category_id: "a2-w5-phrases" },
];

const nouns = [
  { pt: "Motivo", en: "Reason / motive", category_id: "a2-w5-nouns" },
  { pt: "Causa", en: "Cause", category_id: "a2-w5-nouns" },
  { pt: "Consequência", en: "Consequence", category_id: "a2-w5-nouns" },
  { pt: "Razão", en: "Reason", category_id: "a2-w5-nouns" },
  { pt: "Ponto", en: "Point", category_id: "a2-w5-nouns" },
  { pt: "Exemplo", en: "Example", category_id: "a2-w5-nouns" },
  { pt: "Detalhe", en: "Detail", category_id: "a2-w5-nouns" },
  { pt: "Resumo", en: "Summary", category_id: "a2-w5-nouns" },
];

module.exports = {
  categories: [verbsCategory, nounsCategory, phrasesCategory],
  cards: [...verbs, ...nouns, ...phrases],
};
