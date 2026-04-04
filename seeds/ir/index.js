const parts = [
  require("./phrases"),
  require("./conj"),
];

const categories = parts.flatMap(p => p.categories);
const cards = parts.flatMap(p => p.cards);

module.exports = { categories, cards };
