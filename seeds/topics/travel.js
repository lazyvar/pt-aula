const category = { id: "travel", label: "Airport & Hotel", css_class: "cat-travel", group_name: "Topics" };

const cards = [
  { pt: "Aeroporto", en: "Airport", category_id: "travel" },
  { pt: "Passaporte", en: "Passport", category_id: "travel" },
  { pt: "Passagem", en: "Ticket (travel)", category_id: "travel" },
  { pt: "Mala", en: "Suitcase", category_id: "travel" },
  { pt: "Mochila", en: "Backpack", category_id: "travel" },
  { pt: "Hotel", en: "Hotel", category_id: "travel" },
  { pt: "Quarto", en: "Room", category_id: "travel" },
  { pt: "Recepção", en: "Front desk / Reception", category_id: "travel" },
  { pt: "Reserva", en: "Reservation", category_id: "travel" },
  { pt: "Embarque", en: "Boarding", category_id: "travel" },
  { pt: "Desembarque", en: "Arrival / Disembarkation", category_id: "travel" },
  { pt: "Alfândega", en: "Customs", category_id: "travel" },
  { pt: "Voo", en: "Flight", category_id: "travel" },
];

module.exports = { categories: [category], cards };
