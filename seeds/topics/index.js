const parts = [
  require("./fitness"),
  require("./vocab"),
  require("./traits"),
  require("./weather"),
  require("./daily"),
  require("./time"),
  require("./time-adverbs"),
  require("./places"),
  require("./random"),
];

const categories = parts.flatMap(p => p.categories);
const cards = parts.flatMap(p => p.cards);

module.exports = { categories, cards };
