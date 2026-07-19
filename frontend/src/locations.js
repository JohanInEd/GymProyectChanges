// Paises y ciudades para el registro de gimnasios.
// Deliberadamente acotado a los mercados donde tiene sentido vender esto (Latinoamerica, mas
// Espana y Estados Unidos), con las ciudades principales de cada uno. No pretende ser exhaustivo:
// el campo permite escribir para filtrar, y siempre puede ampliarse aqui sin tocar componentes.

export const COUNTRIES = [
  {
    code: "CO",
    name: "Colombia",
    flag: "🇨🇴",
    cities: [
      "Armenia", "Barranquilla", "Bello", "Bogota", "Bucaramanga", "Cali", "Cartagena", "Cucuta",
      "Dosquebradas", "Envigado", "Florencia", "Ibague", "Itagui", "Manizales", "Medellin",
      "Monteria", "Neiva", "Palmira", "Pasto", "Pereira", "Popayan", "Riohacha", "Santa Marta",
      "Sincelejo", "Soacha", "Soledad", "Tulua", "Tunja", "Valledupar", "Villavicencio",
    ],
  },
  {
    code: "MX",
    name: "Mexico",
    flag: "🇲🇽",
    cities: [
      "Acapulco", "Aguascalientes", "Cancun", "Chihuahua", "Ciudad Juarez", "Ciudad de Mexico",
      "Culiacan", "Durango", "Guadalajara", "Hermosillo", "Leon", "Merida", "Mexicali", "Monterrey",
      "Morelia", "Oaxaca", "Puebla", "Queretaro", "San Luis Potosi", "Saltillo", "Tampico",
      "Tijuana", "Toluca", "Torreon", "Veracruz", "Villahermosa", "Zapopan",
    ],
  },
  {
    code: "AR",
    name: "Argentina",
    flag: "🇦🇷",
    cities: [
      "Bahia Blanca", "Buenos Aires", "Cordoba", "Corrientes", "Formosa", "La Plata", "Mar del Plata",
      "Mendoza", "Neuquen", "Parana", "Posadas", "Resistencia", "Rosario", "Salta", "San Juan",
      "San Miguel de Tucuman", "Santa Fe", "Santiago del Estero", "Ushuaia",
    ],
  },
  {
    code: "CL",
    name: "Chile",
    flag: "🇨🇱",
    cities: [
      "Antofagasta", "Arica", "Calama", "Chillan", "Concepcion", "Copiapo", "Coquimbo", "Iquique",
      "La Serena", "Osorno", "Puerto Montt", "Punta Arenas", "Rancagua", "Santiago", "Talca",
      "Temuco", "Valdivia", "Valparaiso", "Vina del Mar",
    ],
  },
  {
    code: "PE",
    name: "Peru",
    flag: "🇵🇪",
    cities: [
      "Arequipa", "Ayacucho", "Cajamarca", "Callao", "Chiclayo", "Chimbote", "Cusco", "Huancayo",
      "Ica", "Iquitos", "Lima", "Piura", "Pucallpa", "Puno", "Tacna", "Trujillo", "Tumbes",
    ],
  },
  {
    code: "EC",
    name: "Ecuador",
    flag: "🇪🇨",
    cities: [
      "Ambato", "Cuenca", "Duran", "Esmeraldas", "Guayaquil", "Ibarra", "Loja", "Machala",
      "Manta", "Portoviejo", "Quevedo", "Quito", "Riobamba", "Santo Domingo",
    ],
  },
  {
    code: "VE",
    name: "Venezuela",
    flag: "🇻🇪",
    cities: [
      "Barcelona", "Barquisimeto", "Barinas", "Caracas", "Ciudad Guayana", "Cumana", "Maracaibo",
      "Maracay", "Maturin", "Merida", "Petare", "Puerto La Cruz", "San Cristobal", "Valencia",
    ],
  },
  {
    code: "PA",
    name: "Panama",
    flag: "🇵🇦",
    cities: [
      "Arraijan", "Chitre", "Ciudad de Panama", "Colon", "David", "La Chorrera", "Penonome",
      "Santiago", "Tocumen",
    ],
  },
  {
    code: "CR",
    name: "Costa Rica",
    flag: "🇨🇷",
    cities: [
      "Alajuela", "Cartago", "Desamparados", "Heredia", "Liberia", "Limon", "Puntarenas",
      "San Jose", "San Vicente",
    ],
  },
  {
    code: "GT",
    name: "Guatemala",
    flag: "🇬🇹",
    cities: [
      "Antigua Guatemala", "Chimaltenango", "Ciudad de Guatemala", "Coban", "Escuintla",
      "Huehuetenango", "Mixco", "Quetzaltenango", "Villa Nueva",
    ],
  },
  {
    code: "DO",
    name: "Republica Dominicana",
    flag: "🇩🇴",
    cities: [
      "Bavaro", "La Romana", "La Vega", "Puerto Plata", "San Cristobal", "San Francisco de Macoris",
      "San Pedro de Macoris", "Santiago de los Caballeros", "Santo Domingo",
    ],
  },
  {
    code: "UY",
    name: "Uruguay",
    flag: "🇺🇾",
    cities: [
      "Canelones", "Colonia del Sacramento", "Durazno", "Las Piedras", "Maldonado", "Melo",
      "Mercedes", "Montevideo", "Paysandu", "Punta del Este", "Rivera", "Salto", "Tacuarembo",
    ],
  },
  {
    code: "PY",
    name: "Paraguay",
    flag: "🇵🇾",
    cities: [
      "Asuncion", "Capiata", "Ciudad del Este", "Encarnacion", "Fernando de la Mora", "Lambare",
      "Luque", "Nemby", "Pedro Juan Caballero", "San Lorenzo",
    ],
  },
  {
    code: "BO",
    name: "Bolivia",
    flag: "🇧🇴",
    cities: [
      "Cochabamba", "El Alto", "La Paz", "Montero", "Oruro", "Potosi", "Quillacollo", "Sacaba",
      "Santa Cruz de la Sierra", "Sucre", "Tarija", "Trinidad",
    ],
  },
  {
    code: "ES",
    name: "Espana",
    flag: "🇪🇸",
    cities: [
      "Alicante", "Barcelona", "Bilbao", "Cordoba", "Gijon", "Granada", "Las Palmas", "Madrid",
      "Malaga", "Murcia", "Palma", "Pamplona", "Sevilla", "Valencia", "Valladolid", "Vigo",
      "Vitoria", "Zaragoza",
    ],
  },
  {
    code: "US",
    name: "Estados Unidos",
    flag: "🇺🇸",
    cities: [
      "Atlanta", "Austin", "Boston", "Charlotte", "Chicago", "Dallas", "Denver", "Houston",
      "Las Vegas", "Los Angeles", "Miami", "New York", "Orlando", "Philadelphia", "Phoenix",
      "San Antonio", "San Diego", "San Francisco", "San Juan", "Seattle", "Tampa", "Washington",
    ],
  },
];

export const COUNTRY_OPTIONS = COUNTRIES.map((country) => ({
  value: country.name,
  label: country.name,
  icon: country.flag,
}));

export function getCitiesForCountry(countryName) {
  const country = COUNTRIES.find((item) => item.name === countryName);
  if (!country) {
    return [];
  }

  return country.cities.map((city) => ({ value: city, label: city }));
}
