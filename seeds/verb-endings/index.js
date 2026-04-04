const parts = [
  require("./ar"),
  require("./er"),
  require("./ir"),
];

const categories = parts.flatMap(p => p.categories);
const cards = parts.flatMap(p => p.cards);

module.exports = { categories, cards };
