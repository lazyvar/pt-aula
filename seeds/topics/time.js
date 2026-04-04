const category = { id: "time", label: "Time & Days", css_class: "cat-time", group_name: "Topics" };

const cards = [
  { pt: "Manhã", en: "Morning", category_id: "time" },
  { pt: "Segunda-feira", en: "Monday", category_id: "time" },
  { pt: "Terça-feira", en: "Tuesday", category_id: "time" },
  { pt: "Quarta-feira", en: "Wednesday", category_id: "time" },
  { pt: "Quinta-feira", en: "Thursday", category_id: "time" },
  { pt: "Sexta-feira", en: "Friday", category_id: "time" },
  { pt: "Sábado", en: "Saturday", category_id: "time" },
  { pt: "Domingo", en: "Sunday", category_id: "time" },
  { pt: "Meio-dia", en: "Noon / Midday", category_id: "time" },
  { pt: "Meia-noite", en: "Midnight", category_id: "time" }
];

module.exports = { categories: [category], cards };
