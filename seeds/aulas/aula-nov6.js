const category = { id: "aula-nov6", label: "Aula Nov 6", css_class: "cat-aula-nov6", group_name: "Aulas" };

const words = [
  { pt: "Reagir", en: "To react" },
  { pt: "Perseguir", en: "To chase / To pursue" },
  { pt: "Besteira", en: "Nonsense / Silly thing" },
  { pt: "Embalagem", en: "Packaging" },
  { pt: "Ingressos", en: "Tickets (for events)" },
  { pt: "Palco", en: "Stage" },
  { pt: "Resolver", en: "To solve / To sort out" },
  { pt: "Problema", en: "Problem" },
  { pt: "Passar a noite em claro", en: "To stay up all night / To pull an all-nighter" },
  { pt: "Enxergar", en: "To see (be able to see)" },
  { pt: "Nem", en: "Not even / Neither / Nor" }
];

const cards = words.map(w => ({ ...w, category_id: category.id }));

module.exports = { categories: [category], cards };
