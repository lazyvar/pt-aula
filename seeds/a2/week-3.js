// A2 Week 3 — Present Subjunctive
// Subjunctive after "que", "espero que", "talvez"; triggering expressions; abstract nouns.

const verbsCategory = {
  id: "a2-w3-verbs",
  label: "A2 W3 — Present Subjunctive",
  css_class: "cat-a2-w3-verbs",
  group_name: "A2",
};

const nounsCategory = {
  id: "a2-w3-nouns",
  label: "A2 W3 — Abstract Nouns I",
  css_class: "cat-a2-w3-nouns",
  group_name: "A2",
};

const phrasesCategory = {
  id: "a2-w3-phrases",
  label: "A2 W3 — Subjunctive Triggers I",
  css_class: "cat-a2-w3-phrases",
  group_name: "A2",
};

const verbs = [
  { pt: "Que eu seja", en: "That I be (present subj. of ser)", category_id: "a2-w3-verbs" },
  { pt: "Que você tenha", en: "That you have (present subj. of ter)", category_id: "a2-w3-verbs" },
  { pt: "Que ele esteja", en: "That he be (present subj. of estar)", category_id: "a2-w3-verbs" },
  { pt: "Que nós vamos", en: "That we go (present subj. of ir)", category_id: "a2-w3-verbs" },
  { pt: "Que eles possam", en: "That they can (present subj. of poder)", category_id: "a2-w3-verbs" },
  { pt: "Que eu faça", en: "That I do/make (present subj. of fazer)", category_id: "a2-w3-verbs" },
  { pt: "Que haja", en: "That there be (present subj. of haver)", category_id: "a2-w3-verbs" },
  { pt: "Que você veja", en: "That you see (present subj. of ver)", category_id: "a2-w3-verbs" },
  { pt: "Que eu saiba", en: "That I know (present subj. of saber)", category_id: "a2-w3-verbs" },
  { pt: "Que nós demos", en: "That we give (present subj. of dar)", category_id: "a2-w3-verbs" },
  { pt: "Que ele queira", en: "That he want (present subj. of querer)", category_id: "a2-w3-verbs" },
  { pt: "Que vocês venham", en: "That you all come (present subj. of vir)", category_id: "a2-w3-verbs" },
  { pt: "Que eu diga", en: "That I say (present subj. of dizer)", category_id: "a2-w3-verbs" },
  { pt: "Que ele traga", en: "That he bring (present subj. of trazer)", category_id: "a2-w3-verbs" },
  { pt: "Que nós possamos", en: "That we can (present subj. of poder)", category_id: "a2-w3-verbs" },
];

const phrases = [
  { pt: "Espero que", en: "I hope that (+ subj.)", category_id: "a2-w3-phrases" },
  { pt: "É importante que", en: "It's important that (+ subj.)", category_id: "a2-w3-phrases" },
  { pt: "Duvido que", en: "I doubt that (+ subj.)", category_id: "a2-w3-phrases" },
  { pt: "Talvez", en: "Maybe (+ subj.)", category_id: "a2-w3-phrases" },
  { pt: "Para que", en: "So that (+ subj.)", category_id: "a2-w3-phrases" },
  { pt: "A não ser que", en: "Unless (+ subj.)", category_id: "a2-w3-phrases" },
  { pt: "Antes que", en: "Before (+ subj.)", category_id: "a2-w3-phrases" },
  { pt: "Embora", en: "Although / even though (+ subj.)", category_id: "a2-w3-phrases" },
  { pt: "Caso você precise", en: "In case you need (+ subj.)", category_id: "a2-w3-phrases" },
  { pt: "Contanto que", en: "As long as (+ subj.)", category_id: "a2-w3-phrases" },
];

const nouns = [
  { pt: "Esperança", en: "Hope", category_id: "a2-w3-nouns" },
  { pt: "Dúvida", en: "Doubt", category_id: "a2-w3-nouns" },
  { pt: "Medo", en: "Fear", category_id: "a2-w3-nouns" },
  { pt: "Vontade", en: "Will / desire", category_id: "a2-w3-nouns" },
  { pt: "Chance", en: "Chance", category_id: "a2-w3-nouns" },
];

module.exports = {
  categories: [verbsCategory, nounsCategory, phrasesCategory],
  cards: [...verbs, ...nouns, ...phrases],
};
