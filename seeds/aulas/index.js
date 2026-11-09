const parts = [
  require("./quase"),
  require("./aula-mar27"),
  require("./aula-mar30"),
  require("./april-fools"),
  require("./april2"),
  require("./aula-jun15"),
  require("./aula-jul20"),
  require("./aula-aug6"),
  require("./aula-aug7"),
  require("./aula-aug10"),
  require("./aula-aug11"),
  require("./aula-aug13"),
  require("./aula-aug17"),
  require("./aula-aug18"),
  require("./aula-aug19"),
  require("./aula-nov3"),
  require("./aula-nov4"),
  require("./aula-nov5"),
  require("./aula-nov6"),
  require("./aula-nov9"),
];

const categories = parts.flatMap(p => p.categories);
const cards = parts.flatMap(p => p.cards);

module.exports = { categories, cards };
