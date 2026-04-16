// A2 Week 1 — Preterite vs. Imperfect
// Contrastive past-tense pairs, time markers that trigger each tense,
// and nouns tied to daily life, work, and childhood memories.

const verbsCategory = {
  id: "a2-w1-verbs",
  label: "A2 W1 — Preterite / Imperfect",
  css_class: "cat-a2-w1-verbs",
  group_name: "A2",
};

const nounsCategory = {
  id: "a2-w1-nouns",
  label: "A2 W1 — Daily Life & Memory",
  css_class: "cat-a2-w1-nouns",
  group_name: "A2",
};

const phrasesCategory = {
  id: "a2-w1-phrases",
  label: "A2 W1 — Time Markers",
  css_class: "cat-a2-w1-phrases",
  group_name: "A2",
};

const verbs = [
  { pt: "Eu fui", en: "I went (preterite)", category_id: "a2-w1-verbs" },
  { pt: "Eu ia", en: "I used to go / I was going (imperfect)", category_id: "a2-w1-verbs" },
  { pt: "Você foi", en: "You were (preterite of ser)", category_id: "a2-w1-verbs" },
  { pt: "Você era", en: "You used to be (imperfect of ser)", category_id: "a2-w1-verbs" },
  { pt: "Nós estivemos", en: "We were (preterite of estar)", category_id: "a2-w1-verbs" },
  { pt: "Nós estávamos", en: "We were / used to be (imperfect of estar)", category_id: "a2-w1-verbs" },
  { pt: "Eu tive", en: "I had (preterite)", category_id: "a2-w1-verbs" },
  { pt: "Eu tinha", en: "I had / used to have (imperfect)", category_id: "a2-w1-verbs" },
  { pt: "Você fez", en: "You did / made (preterite)", category_id: "a2-w1-verbs" },
  { pt: "Você fazia", en: "You used to do / make (imperfect)", category_id: "a2-w1-verbs" },
  { pt: "Eu cheguei", en: "I arrived (preterite)", category_id: "a2-w1-verbs" },
  { pt: "Eu chegava", en: "I used to arrive (imperfect)", category_id: "a2-w1-verbs" },
  { pt: "Nós comemos", en: "We ate (preterite)", category_id: "a2-w1-verbs" },
  { pt: "Nós comíamos", en: "We used to eat (imperfect)", category_id: "a2-w1-verbs" },
  { pt: "Eu trabalhei", en: "I worked (preterite)", category_id: "a2-w1-verbs" },
  { pt: "Eu trabalhava", en: "I used to work (imperfect)", category_id: "a2-w1-verbs" },
  { pt: "Eu morei", en: "I lived (preterite)", category_id: "a2-w1-verbs" },
  { pt: "Eu morava", en: "I used to live (imperfect)", category_id: "a2-w1-verbs" },
  { pt: "Eu brinquei", en: "I played (preterite, childhood sense)", category_id: "a2-w1-verbs" },
  { pt: "Eu brincava", en: "I used to play (imperfect)", category_id: "a2-w1-verbs" },
];

const phrases = [
  { pt: "Ontem", en: "Yesterday", category_id: "a2-w1-phrases" },
  { pt: "Na semana passada", en: "Last week", category_id: "a2-w1-phrases" },
  { pt: "No mês passado", en: "Last month", category_id: "a2-w1-phrases" },
  { pt: "No ano passado", en: "Last year", category_id: "a2-w1-phrases" },
  { pt: "Há dois anos", en: "Two years ago", category_id: "a2-w1-phrases" },
  { pt: "Quando eu era criança", en: "When I was a child", category_id: "a2-w1-phrases" },
  { pt: "Quando eu era jovem", en: "When I was young", category_id: "a2-w1-phrases" },
  { pt: "Naquela época", en: "Back then / At that time", category_id: "a2-w1-phrases" },
  { pt: "Antigamente", en: "In the old days", category_id: "a2-w1-phrases" },
  { pt: "Todos os dias", en: "Every day", category_id: "a2-w1-phrases" },
  { pt: "De vez em quando", en: "From time to time", category_id: "a2-w1-phrases" },
  { pt: "Sempre que eu podia", en: "Whenever I could", category_id: "a2-w1-phrases" },
  { pt: "De repente", en: "Suddenly", category_id: "a2-w1-phrases" },
  { pt: "De uma hora para outra", en: "All of a sudden", category_id: "a2-w1-phrases" },
  { pt: "Enquanto eu estudava", en: "While I was studying", category_id: "a2-w1-phrases" },
];

const nouns = [
  { pt: "Infância", en: "Childhood", category_id: "a2-w1-nouns" },
  { pt: "Lembrança", en: "Memory (a recollection)", category_id: "a2-w1-nouns" },
  { pt: "Recordação", en: "Memory / keepsake", category_id: "a2-w1-nouns" },
  { pt: "Costume", en: "Custom / habit", category_id: "a2-w1-nouns" },
  { pt: "Rotina", en: "Routine", category_id: "a2-w1-nouns" },
  { pt: "Hábito", en: "Habit", category_id: "a2-w1-nouns" },
  { pt: "Brinquedo", en: "Toy", category_id: "a2-w1-nouns" },
  { pt: "Vizinhança", en: "Neighborhood (community)", category_id: "a2-w1-nouns" },
  { pt: "Bairro", en: "Neighborhood (area)", category_id: "a2-w1-nouns" },
  { pt: "Colega", en: "Colleague / classmate", category_id: "a2-w1-nouns" },
  { pt: "Chefe", en: "Boss", category_id: "a2-w1-nouns" },
  { pt: "Reunião", en: "Meeting", category_id: "a2-w1-nouns" },
  { pt: "Prazo", en: "Deadline", category_id: "a2-w1-nouns" },
  { pt: "Salário", en: "Salary", category_id: "a2-w1-nouns" },
  { pt: "Férias", en: "Vacation (always plural: as férias)", category_id: "a2-w1-nouns" },
];

module.exports = {
  categories: [verbsCategory, nounsCategory, phrasesCategory],
  cards: [...verbs, ...nouns, ...phrases],
};
