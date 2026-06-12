export const tools = [
  {
    type: "function",
    function: {
      name: "get_country_report",
      description: "Genera un reporte analítico de un país a partir de su nombre.",
      parameters: {
        type: "object",
        properties: {
          country: { type: "string", description: "Nombre del país (ej: 'France', 'Spain', 'Argentina')." },
        },
        required: ["country"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_countries_recommendation",
      description: "Compara dos países y recomienda opciones de vida y turismo.",
      parameters: {
        type: "object",
        properties: {
          countryA: { type: "string", description: "Primer país a comparar." },
          countryB: { type: "string", description: "Segundo país a comparar." },
        },
        required: ["countryA", "countryB"],
      },
    },
  },
];