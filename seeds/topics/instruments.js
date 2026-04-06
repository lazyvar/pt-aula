const category = { id: "instruments", label: "Musical Instruments", css_class: "cat-instruments", group_name: "Topics" };

const cards = [
  { pt: "Violão", en: "Acoustic guitar", category_id: "instruments" },
  { pt: "Guitarra", en: "Electric guitar", category_id: "instruments" },
  { pt: "Piano", en: "Piano", category_id: "instruments" },
  { pt: "Bateria", en: "Drums", category_id: "instruments" },
  { pt: "Flauta", en: "Flute", category_id: "instruments" },
  { pt: "Violino", en: "Violin", category_id: "instruments" },
  { pt: "Saxofone", en: "Saxophone", category_id: "instruments" },
  { pt: "Trompete", en: "Trumpet", category_id: "instruments" },
  { pt: "Pandeiro", en: "Tambourine (Brazilian)", category_id: "instruments" },
  { pt: "Cavaquinho", en: "Cavaquinho (small guitar)", category_id: "instruments" },
  { pt: "Sanfona", en: "Accordion", category_id: "instruments" },
  { pt: "Berimbau", en: "Berimbau", category_id: "instruments" },
];

module.exports = { categories: [category], cards };
