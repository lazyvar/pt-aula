// A2 Week 8 — Thematic Vocabulary Batch 2
// Domains: emoções, comida/restaurante, tecnologia.

const verbsCategory = {
  id: "a2-w8-verbs",
  label: "A2 W8 — Emotion / Food / Tech Verbs",
  css_class: "cat-a2-w8-verbs",
  group_name: "A2",
};

const nounsCategory = {
  id: "a2-w8-nouns",
  label: "A2 W8 — Emotion / Food / Tech Nouns",
  css_class: "cat-a2-w8-nouns",
  group_name: "A2",
};

const phrasesCategory = {
  id: "a2-w8-phrases",
  label: "A2 W8 — Collocations & Idioms II",
  css_class: "cat-a2-w8-phrases",
  group_name: "A2",
};

const verbs = [
  { pt: "Emocionar", en: "To move (emotionally)", category_id: "a2-w8-verbs" },
  { pt: "Sentir", en: "To feel", category_id: "a2-w8-verbs" },
  { pt: "Temperar", en: "To season (food)", category_id: "a2-w8-verbs" },
  { pt: "Pedir", en: "To order / ask for", category_id: "a2-w8-verbs" },
  { pt: "Servir", en: "To serve", category_id: "a2-w8-verbs" },
  { pt: "Baixar", en: "To download", category_id: "a2-w8-verbs" },
  { pt: "Atualizar", en: "To update", category_id: "a2-w8-verbs" },
  { pt: "Compartilhar", en: "To share", category_id: "a2-w8-verbs" },
  { pt: "Clicar", en: "To click", category_id: "a2-w8-verbs" },
];

const phrases = [
  { pt: "Estar com pressa", en: "To be in a hurry", category_id: "a2-w8-phrases" },
  { pt: "Dar um jeito", en: "To figure out / find a way", category_id: "a2-w8-phrases" },
  { pt: "Pegar leve", en: "Take it easy / go easy", category_id: "a2-w8-phrases" },
  { pt: "Matar a fome", en: "To satisfy hunger", category_id: "a2-w8-phrases" },
  { pt: "Ficar de cara", en: "To be shocked / taken aback", category_id: "a2-w8-phrases" },
  { pt: "Cair na real", en: "To face reality", category_id: "a2-w8-phrases" },
  { pt: "Passar batido", en: "To go unnoticed", category_id: "a2-w8-phrases" },
];

const nouns = [
  { pt: "Alegria", en: "Joy", category_id: "a2-w8-nouns" },
  { pt: "Tristeza", en: "Sadness", category_id: "a2-w8-nouns" },
  { pt: "Angústia", en: "Anguish", category_id: "a2-w8-nouns" },
  { pt: "Orgulho", en: "Pride", category_id: "a2-w8-nouns" },
  { pt: "Vergonha", en: "Shame / embarrassment", category_id: "a2-w8-nouns" },
  { pt: "Solidão", en: "Loneliness", category_id: "a2-w8-nouns" },
  { pt: "Paixão", en: "Passion", category_id: "a2-w8-nouns" },
  { pt: "Cardápio", en: "Menu", category_id: "a2-w8-nouns" },
  { pt: "Garçom", en: "Waiter", category_id: "a2-w8-nouns" },
  { pt: "Gorjeta", en: "Tip (gratuity)", category_id: "a2-w8-nouns" },
  { pt: "Sobremesa", en: "Dessert", category_id: "a2-w8-nouns" },
  { pt: "Entrada", en: "Appetizer / entrance", category_id: "a2-w8-nouns" },
  { pt: "Prato principal", en: "Main dish", category_id: "a2-w8-nouns" },
  { pt: "Conta", en: "Bill / check", category_id: "a2-w8-nouns" },
  { pt: "Tela", en: "Screen", category_id: "a2-w8-nouns" },
  { pt: "Senha", en: "Password", category_id: "a2-w8-nouns" },
  { pt: "Aplicativo", en: "App", category_id: "a2-w8-nouns" },
  { pt: "Nuvem", en: "Cloud (storage)", category_id: "a2-w8-nouns" },
  { pt: "Rede", en: "Network", category_id: "a2-w8-nouns" },
  { pt: "Dispositivo", en: "Device", category_id: "a2-w8-nouns" },
];

module.exports = {
  categories: [verbsCategory, nounsCategory, phrasesCategory],
  cards: [...verbs, ...nouns, ...phrases],
};
