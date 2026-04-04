const topics = require("./topics");
const phrases = require("./phrases");
const verbs = require("./verbs");
const aulas = require("./aulas");
const ir = require("./ir");
const conjugations = require("./conjugations");
const verbEndings = require("./verb-endings");

const groups = [topics, phrases, verbs, aulas, ir, conjugations, verbEndings];

const categories = groups.flatMap(g => g.categories);
const cards = groups.flatMap(g => g.cards);

module.exports = { categories, cards };
