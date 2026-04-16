const parts = [
  require("./week-1"),
  require("./week-2"),
  require("./week-3"),
  require("./week-4"),
  require("./week-5"),
  require("./week-6"),
  require("./week-7"),
  require("./week-8"),
  require("./week-9"),
  require("./week-10"),
];

const categories = parts.flatMap(p => p.categories);
const cards = parts.flatMap(p => p.cards);

module.exports = { categories, cards };
