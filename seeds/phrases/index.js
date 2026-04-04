const parts = [
  require("./general"),
  require("./bday"),
];

const categories = parts.flatMap(p => p.categories);
const cards = parts.flatMap(p => p.cards);

module.exports = { categories, cards };
