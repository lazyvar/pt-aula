const category = { id: "places", label: "Places & Location", css_class: "cat-places", group_name: "Topics" };

const cards = [
  { pt: "Perto", en: "Close / Nearby", category_id: "places" },
  { pt: "Fora", en: "Outside", category_id: "places" },
  { pt: "Lá fora", en: "Out there / Outside", category_id: "places" },
  { pt: "Dentro", en: "Inside", category_id: "places" },
  { pt: "Aí / Ali / Daí", en: "There / There (farther) / From there", category_id: "places" },
  { pt: "Aqui / Cá / Para cá", en: "Here / Here / Over here", category_id: "places" }
];

module.exports = { categories: [category], cards };
