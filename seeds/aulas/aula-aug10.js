const category = { id: "aula-aug10", label: "Aula Aug 10", css_class: "cat-aula-aug10", group_name: "Aulas" };

const words = [
  { pt: "Calçadão", en: "Boardwalk / Promenade (masc.)" },
  { pt: "Período", en: "Period / Time frame" },
  { pt: "Saúde", en: "Health" },
  { pt: "Idade", en: "Age" },
  { pt: "Por cento", en: "Percent (%)" },
  { pt: "Fora de temporada", en: "Off-season" },
  { pt: "Mais ou menos", en: "More or less" },
  { pt: "Você que sabe", en: "It's up to you / You know best" },
  { pt: "Houve", en: "There was / There were (past of haver)" },
  { pt: "Diferença", en: "Difference" },
  { pt: "Cadeira", en: "Chair" },
  { pt: "Sentido", en: "Sense, meaning / Direction" },
  { pt: "Sentimentos", en: "Feelings" },
  { pt: "Carteira de motorista", en: "Driver's license" },
  { pt: "Eu vi", en: "I saw" },
  { pt: "Você, ele, ela viu", en: "You, he, she saw" },
  { pt: "Envergonhado", en: "Embarrassed / Ashamed" },
  { pt: "Calçada // Casada (o)", en: "Sidewalk // Married (fem. / masc.)" },
  { pt: "Equilibrada (o)", en: "Balanced (fem. / masc.)" }
];

const cards = words.map(w => ({ ...w, category_id: category.id }));

module.exports = { categories: [category], cards };
