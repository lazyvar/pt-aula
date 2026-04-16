// A2 Week 7 — Thematic Vocabulary Batch 1
// Domains: trabalho/escritório, saúde/corpo, viagem.

const verbsCategory = {
  id: "a2-w7-verbs",
  label: "A2 W7 — Work / Health / Travel Verbs",
  css_class: "cat-a2-w7-verbs",
  group_name: "A2",
};

const nounsCategory = {
  id: "a2-w7-nouns",
  label: "A2 W7 — Work / Health / Travel Nouns",
  css_class: "cat-a2-w7-nouns",
  group_name: "A2",
};

const phrasesCategory = {
  id: "a2-w7-phrases",
  label: "A2 W7 — Collocations & Idioms I",
  css_class: "cat-a2-w7-phrases",
  group_name: "A2",
};

const verbs = [
  { pt: "Contratar", en: "To hire", category_id: "a2-w7-verbs" },
  { pt: "Demitir", en: "To fire", category_id: "a2-w7-verbs" },
  { pt: "Renunciar", en: "To resign", category_id: "a2-w7-verbs" },
  { pt: "Tratar", en: "To treat (medically)", category_id: "a2-w7-verbs" },
  { pt: "Curar", en: "To cure / heal", category_id: "a2-w7-verbs" },
  { pt: "Receitar", en: "To prescribe", category_id: "a2-w7-verbs" },
  { pt: "Internar", en: "To hospitalize", category_id: "a2-w7-verbs" },
  { pt: "Embarcar", en: "To board (a vehicle)", category_id: "a2-w7-verbs" },
  { pt: "Hospedar", en: "To lodge / host", category_id: "a2-w7-verbs" },
];

const phrases = [
  { pt: "Dar uma olhada", en: "To take a look", category_id: "a2-w7-phrases" },
  { pt: "Fazer as malas", en: "To pack one's bags", category_id: "a2-w7-phrases" },
  { pt: "Tirar férias", en: "To take vacation", category_id: "a2-w7-phrases" },
  { pt: "Pegar um resfriado", en: "To catch a cold", category_id: "a2-w7-phrases" },
  { pt: "Valer a pena", en: "To be worth it", category_id: "a2-w7-phrases" },
  { pt: "Dar certo", en: "To work out / go well", category_id: "a2-w7-phrases" },
  { pt: "Não ter jeito", en: "There's no way / nothing to be done", category_id: "a2-w7-phrases" },
];

const nouns = [
  { pt: "Escritório", en: "Office", category_id: "a2-w7-nouns" },
  { pt: "Currículo", en: "Resume", category_id: "a2-w7-nouns" },
  { pt: "Entrevista", en: "Interview", category_id: "a2-w7-nouns" },
  { pt: "Empresa", en: "Company", category_id: "a2-w7-nouns" },
  { pt: "Contrato", en: "Contract", category_id: "a2-w7-nouns" },
  { pt: "Cargo", en: "Position / role", category_id: "a2-w7-nouns" },
  { pt: "Folga", en: "Day off", category_id: "a2-w7-nouns" },
  { pt: "Consulta", en: "Medical appointment", category_id: "a2-w7-nouns" },
  { pt: "Sintoma", en: "Symptom", category_id: "a2-w7-nouns" },
  { pt: "Doença", en: "Illness / disease", category_id: "a2-w7-nouns" },
  { pt: "Remédio", en: "Medicine", category_id: "a2-w7-nouns" },
  { pt: "Ferida", en: "Wound", category_id: "a2-w7-nouns" },
  { pt: "Exame", en: "Exam (medical)", category_id: "a2-w7-nouns" },
  { pt: "Passaporte", en: "Passport", category_id: "a2-w7-nouns" },
  { pt: "Bagagem", en: "Luggage", category_id: "a2-w7-nouns" },
  { pt: "Voo", en: "Flight", category_id: "a2-w7-nouns" },
  { pt: "Hospedagem", en: "Lodging", category_id: "a2-w7-nouns" },
  { pt: "Embarque", en: "Boarding", category_id: "a2-w7-nouns" },
  { pt: "Alfândega", en: "Customs (border)", category_id: "a2-w7-nouns" },
  { pt: "Destino", en: "Destination", category_id: "a2-w7-nouns" },
];

module.exports = {
  categories: [verbsCategory, nounsCategory, phrasesCategory],
  cards: [...verbs, ...nouns, ...phrases],
};
