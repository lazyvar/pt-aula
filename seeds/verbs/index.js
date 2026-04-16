const parts = [
  require("./essential"),
  require("./common"),
  require("./everyday"),
  require("./practical"),
  require("./expanding"),
  require("./advanced"),
  require("./extra"),
  require("./irregulars"),
];

const categories = parts.flatMap(p => p.categories);
const cards = parts.flatMap(p => p.cards);

module.exports = { categories, cards };
