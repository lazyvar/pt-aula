const verbs = [
  require("./ser"),
  require("./estar"),
  require("./ter"),
  require("./fazer"),
  require("./poder"),
  require("./querer"),
  require("./saber"),
  require("./dar"),
  require("./ver"),
  require("./vir"),
  require("./dizer"),
  require("./ler"),
  require("./por"),
  require("./trazer"),
  require("./ouvir"),
  require("./pedir"),
  require("./perder"),
  require("./dormir"),
  require("./sair"),
  require("./cair"),
];

const categories = verbs.flatMap(v => v.categories);
const cards = verbs.flatMap(v => v.cards);

module.exports = { categories, cards };
