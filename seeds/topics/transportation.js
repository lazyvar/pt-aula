const category = { id: "transportation", label: "Transportation", css_class: "cat-transportation", group_name: "Topics" };

const cards = [
  { pt: "Carro", en: "Car", category_id: "transportation" },
  { pt: "Ônibus", en: "Bus", category_id: "transportation" },
  { pt: "Trem", en: "Train", category_id: "transportation" },
  { pt: "Metrô", en: "Subway / Metro", category_id: "transportation" },
  { pt: "Avião", en: "Airplane", category_id: "transportation" },
  { pt: "Bicicleta", en: "Bicycle", category_id: "transportation" },
  { pt: "Moto", en: "Motorcycle", category_id: "transportation" },
  { pt: "Barco", en: "Boat", category_id: "transportation" },
  { pt: "Táxi", en: "Taxi", category_id: "transportation" },
  { pt: "Caminhão", en: "Truck", category_id: "transportation" },
  { pt: "Helicóptero", en: "Helicopter", category_id: "transportation" },
  { pt: "Patinete", en: "Scooter", category_id: "transportation" },
];

module.exports = { categories: [category], cards };
