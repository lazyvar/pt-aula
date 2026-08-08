const category = { id: "aula-aug7", label: "Aula Aug 7", css_class: "cat-aula-aug7", group_name: "Aulas" };

const words = [
  { pt: "Super-herói", en: "Superhero" },
  { pt: "Homem-Formiga", en: "Ant-Man" },
  { pt: "Homem-Aranha", en: "Spider-Man" },
  { pt: "Super-Homem", en: "Superman" },
  { pt: "Homem de Ferro", en: "Iron Man" },
  { pt: "Homem de Gelo", en: "Iceman" },
  { pt: "Cavaleiro das Trevas", en: "The Dark Knight" },
  { pt: "Coringa", en: "The Joker" },
  { pt: "Assustador / Susto", en: "Scary / Fright, scare" },
  { pt: "Da aula", en: "Of the class / From the class" },
  { pt: "Loteria", en: "Lottery" },
  { pt: "Assinar / Assinatura", en: "To sign, to subscribe / Signature, subscription" },
  { pt: "Pelo / Pela", en: "By/through the (por + o) / (por + a)" },
  { pt: "Pelo qual", en: "For which / Through which" },
  { pt: "Tecnicamente", en: "Technically" },
  { pt: "Ser dono", en: "To own / To be the owner" },
  { pt: "Doar / Dar", en: "To donate / To give" },
  { pt: "Gordura", en: "Fat / Grease" },
  { pt: "Pintado / Pintura", en: "Painted / Painting" },
  { pt: "Enganar / Enganado", en: "To deceive, to trick / Deceived, mistaken" }
];

const cards = words.map(w => ({ ...w, category_id: category.id }));

module.exports = { categories: [category], cards };
