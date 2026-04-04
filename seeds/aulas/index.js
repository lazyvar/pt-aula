const parts = [
  require("./quase"),
  require("./aula-mar27"),
  require("./aula-mar30"),
  require("./april-fools"),
  require("./april2"),
];

const categories = parts.flatMap(p => p.categories);
const cards = parts.flatMap(p => p.cards);

module.exports = { categories, cards };
