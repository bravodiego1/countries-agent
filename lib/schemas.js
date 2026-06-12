export const ComparisonAnswerSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    livingRecommendation: { type: "string" },
    tourismRecommendation: { type: "string" },
  },
  required: ["summary", "livingRecommendation", "tourismRecommendation"],
};

export const SingleCountryAnswerSchema = {
  type: "object",
  properties: {
    countryName: { type: "string" },
    demographics: { type: "string" },
    languagesAndCulture: { type: "string" },
    economyAndInsight: { type: "string" },
  },
  required: ["countryName", "demographics", "languagesAndCulture", "economyAndInsight"],
};