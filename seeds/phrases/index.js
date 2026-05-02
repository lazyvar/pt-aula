const parts = [
  require("./general"),
  require("./bday"),
  require("./reactions"),
  require("./restaurant"),
  require("./routine"),
  require("./smalltalk"),
  require("./shopping"),
  require("./help"),
  require("./health"),
];

const categories = parts.flatMap(p => p.categories);
const cards = parts.flatMap(p => p.cards);

module.exports = { categories, cards };
