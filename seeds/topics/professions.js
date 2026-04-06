const category = { id: "professions", label: "Professions", css_class: "cat-professions", group_name: "Topics" };

const cards = [
  { pt: "Médico", en: "Doctor", category_id: "professions" },
  { pt: "Professor", en: "Teacher", category_id: "professions" },
  { pt: "Advogado", en: "Lawyer", category_id: "professions" },
  { pt: "Engenheiro", en: "Engineer", category_id: "professions" },
  { pt: "Enfermeiro", en: "Nurse", category_id: "professions" },
  { pt: "Cozinheiro", en: "Cook / Chef", category_id: "professions" },
  { pt: "Motorista", en: "Driver", category_id: "professions" },
  { pt: "Dentista", en: "Dentist", category_id: "professions" },
  { pt: "Programador", en: "Programmer", category_id: "professions" },
  { pt: "Jornalista", en: "Journalist", category_id: "professions" },
  { pt: "Vendedor", en: "Salesperson", category_id: "professions" },
  { pt: "Bombeiro", en: "Firefighter", category_id: "professions" },
  { pt: "Policial", en: "Police officer", category_id: "professions" },
  { pt: "Padeiro", en: "Baker", category_id: "professions" },
];

module.exports = { categories: [category], cards };
