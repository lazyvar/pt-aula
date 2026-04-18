// A2 Week 2 — Preterite vs. Imperfect (continued)
// Second verb batch, new time markers, storytelling nouns.

const verbsCategory = {
  id: "a2-w2-verbs",
  label: "A2 W2 — Preterite / Imperfect",
  css_class: "cat-a2-w2-verbs",
  group_name: "A2",
};

const nounsCategory = {
  id: "a2-w2-nouns",
  label: "A2 W2 — Storytelling & Memory",
  css_class: "cat-a2-w2-nouns",
  group_name: "A2",
};

const phrasesCategory = {
  id: "a2-w2-phrases",
  label: "A2 W2 — Time Markers II",
  css_class: "cat-a2-w2-phrases",
  group_name: "A2",
};

const verbs = [
  { pt: "Eu disse", en: "I said (preterite)", category_id: "a2-w2-verbs" },
  { pt: "Eu dizia", en: "I used to say (imperfect)", category_id: "a2-w2-verbs" },
  { pt: "Você viu", en: "You saw (preterite)", category_id: "a2-w2-verbs" },
  { pt: "Você via", en: "You used to see (imperfect)", category_id: "a2-w2-verbs" },
  { pt: "Nós viemos", en: "We came (preterite)", category_id: "a2-w2-verbs" },
  { pt: "Nós vínhamos", en: "We used to come (imperfect)", category_id: "a2-w2-verbs" },
  { pt: "Eu dei", en: "I gave (preterite)", category_id: "a2-w2-verbs" },
  { pt: "Eu dava", en: "I used to give (imperfect)", category_id: "a2-w2-verbs" },
  { pt: "Você pôde", en: "You could / was able to (preterite)", category_id: "a2-w2-verbs" },
  { pt: "Você podia", en: "You used to be able (imperfect)", category_id: "a2-w2-verbs" },
  { pt: "Eu quis", en: "I wanted (preterite — one-time decision)", category_id: "a2-w2-verbs" },
  { pt: "Eu queria", en: "I wanted / used to want (imperfect — polite or ongoing)", category_id: "a2-w2-verbs" },
  { pt: "Nós soubemos", en: "We found out (preterite of saber)", category_id: "a2-w2-verbs" },
  { pt: "Nós sabíamos", en: "We knew / used to know (imperfect of saber)", category_id: "a2-w2-verbs" },
  { pt: "Eu saí", en: "I left / went out (preterite)", category_id: "a2-w2-verbs" },
  { pt: "Eu saía", en: "I used to go out (imperfect)", category_id: "a2-w2-verbs" },
  { pt: "Você dormiu", en: "You slept (preterite)", category_id: "a2-w2-verbs" },
  { pt: "Você dormia", en: "You used to sleep (imperfect)", category_id: "a2-w2-verbs" },
  { pt: "Eu bebi", en: "I drank (preterite)", category_id: "a2-w2-verbs" },
  { pt: "Eu bebia", en: "I used to drink (imperfect)", category_id: "a2-w2-verbs" },
];

const phrases = [
  { pt: "Há muito tempo", en: "A long time ago", category_id: "a2-w2-phrases" },
  { pt: "Desde criança", en: "Since childhood", category_id: "a2-w2-phrases" },
  { pt: "Naquele tempo", en: "Back then / In those days", category_id: "a2-w2-phrases" },
  { pt: "Durante a infância", en: "During childhood", category_id: "a2-w2-phrases" },
  { pt: "Nos fins de semana", en: "On weekends (habitual)", category_id: "a2-w2-phrases" },
  { pt: "Toda noite", en: "Every night", category_id: "a2-w2-phrases" },
  { pt: "Toda manhã", en: "Every morning", category_id: "a2-w2-phrases" },
  { pt: "Nunca mais", en: "Never again", category_id: "a2-w2-phrases" },
  { pt: "Uma vez", en: "Once / One time", category_id: "a2-w2-phrases" },
  { pt: "Várias vezes", en: "Several times", category_id: "a2-w2-phrases" },
  { pt: "Raramente", en: "Rarely", category_id: "a2-w2-phrases" },
  { pt: "Frequentemente", en: "Frequently", category_id: "a2-w2-phrases" },
  { pt: "Por um momento", en: "For a moment", category_id: "a2-w2-phrases" },
  { pt: "Na época", en: "At the time", category_id: "a2-w2-phrases" },
  { pt: "De uma só vez", en: "All at once", category_id: "a2-w2-phrases" },
];

const nouns = [
  { pt: "Passado", en: "The past", category_id: "a2-w2-nouns" },
  { pt: "Adolescência", en: "Adolescence", category_id: "a2-w2-nouns" },
  { pt: "Juventude", en: "Youth", category_id: "a2-w2-nouns" },
  { pt: "Aventura", en: "Adventure", category_id: "a2-w2-nouns" },
  { pt: "Viagem", en: "Trip / journey", category_id: "a2-w2-nouns" },
  { pt: "Brincadeira", en: "Game / joke / play", category_id: "a2-w2-nouns" },
  { pt: "História", en: "Story / history", category_id: "a2-w2-nouns" },
  { pt: "Recreio", en: "Recess (at school)", category_id: "a2-w2-nouns" },
  { pt: "Castigo", en: "Punishment", category_id: "a2-w2-nouns" },
  { pt: "Travessura", en: "Mischief / prank", category_id: "a2-w2-nouns" },
  { pt: "Sonho", en: "Dream", category_id: "a2-w2-nouns" },
  { pt: "Segredo", en: "Secret", category_id: "a2-w2-nouns" },
  { pt: "Susto", en: "Scare / fright", category_id: "a2-w2-nouns" },
  { pt: "Mudança", en: "Move / change", category_id: "a2-w2-nouns" },
  { pt: "Despedida", en: "Farewell / goodbye", category_id: "a2-w2-nouns" },
];

module.exports = {
  categories: [verbsCategory, nounsCategory, phrasesCategory],
  cards: [...verbs, ...nouns, ...phrases],
};
