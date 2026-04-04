const category = { id: "weather", label: "Weather", css_class: "cat-weather", group_name: "Topics" };

const cards = [
  { pt: "Chuva", en: "Rain", category_id: "weather" },
  { pt: "Calor", en: "Heat / Hot (weather)", category_id: "weather" },
  { pt: "Frio", en: "Cold", category_id: "weather" },
  { pt: "Gelo", en: "Ice", category_id: "weather" },
  { pt: "Ai que calor", en: "Oh it's so hot", category_id: "weather" },
  { pt: "Muito calor", en: "Very hot", category_id: "weather" },
  { pt: "Quente", en: "Hot (temperature)", category_id: "weather" },
  { pt: "Gelado", en: "Freezing / Ice cold", category_id: "weather" }
];

module.exports = { categories: [category], cards };
