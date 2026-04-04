const category = { id: "daily", label: "Daily Life", css_class: "cat-daily", group_name: "Topics" };

const cards = [
  { pt: "Pai", en: "Dad / Father", category_id: "daily" },
  { pt: "Avô", en: "Grandpa", category_id: "daily" },
  { pt: "Avó", en: "Grandma", category_id: "daily" },
  { pt: "Hambúrguer", en: "Hamburger", category_id: "daily" },
  { pt: "Chá quente", en: "Hot tea", category_id: "daily" }
];

module.exports = { categories: [category], cards };
