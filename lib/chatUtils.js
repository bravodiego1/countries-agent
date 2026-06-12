export function generateCountryReport(countryData) {
  const languageCount = Array.isArray(countryData.languages) ? countryData.languages.length : 0;
  const currencyCount = Array.isArray(countryData.currencies) ? countryData.currencies.length : 0;

  const populationLevel =
    countryData.population > 50000000
      ? "high"
      : countryData.population > 10000000
      ? "medium"
      : "low";

  return {
    country: countryData.name,
    region: countryData.region,
    population: countryData.population,
    populationLevel,
    languageCount,
    currencyCount,
    insight:
      `${countryData.name} tiene ${languageCount} idiomas y ` +
      `${currencyCount} monedas. El nivel poblacional es ${populationLevel}.`,
  };
}

export function compareCountries(countryA, countryB) {
  const betterForLiving =
    countryA.population < countryB.population
      ? countryA.name
      : countryB.name;

  const sharedLanguage = Array.isArray(countryA.languages) && Array.isArray(countryB.languages)
    ? countryA.languages.some(lang => countryB.languages.includes(lang))
    : false;

  return {
    countries: [countryA.name, countryB.name],
    comparison: {
      population: {
        [countryA.name]: countryA.population,
        [countryB.name]: countryB.population,
      },
      sameRegion: countryA.region === countryB.region,
      sharedLanguage,
    },
    recommendations: {
      living: betterForLiving,
      tourism:
        countryA.region === countryB.region
          ? "Ambos son buenas opciones de turismo"
          : countryA.name,
    },
  };
}


export function sanitizeCountryName(country) {
  if (!country) return "";
  return country
    .trim()
    .replace(/([^a-zA-ZáéíóúÁÉÍÓÚñÑ ])/g, "") 
    .replace(/([a-zA-Z])\1+/g, '$1'); 
}

export async function safeGetCountry(country) {
  const cleanCountry = sanitizeCountryName(country);
  
  try {
    console.log(`🔍 Buscando país en API Ninjas: '${cleanCountry}' (Original: '${country}')`);
    
    const res = await fetch(`https://api.api-ninjas.com/v1/country?name=${encodeURIComponent(cleanCountry)}`, {
      headers: { 
        'X-Api-Key': process.env.NINJAS_API_KEY || ''
      }
    });

    if (!res.ok) {
      throw new Error(`API Ninjas respondió con status: ${res.status}`);
    }

    const data = await res.json();

    if (!data || data.length === 0) {
      console.log(`⚠️ No se encontraron datos en API Ninjas para: '${cleanCountry}'. Activando Fallback Mock.`);
      return getMockCountry(cleanCountry);
    }

    const rawCountry = data[0];

    console.log("Datos crudos de la API para este país:", rawCountry);
    
    let displayName = rawCountry.name;
    if (displayName && displayName.includes(",")) {
      displayName = displayName.split(",")[0].trim();
    }

    return {
      name: displayName, 
      region: rawCountry.region || "Desconocida",
      population: rawCountry.population ? rawCountry.population * 1000 : 40000000, 
      languages: rawCountry.languages ? Object.values(rawCountry.languages) : [],
      currencies: rawCountry.currency?.code ? [rawCountry.currency.code] : ["USD"],
      error: false,
    };

  } catch (e) {
    console.error("ERROR EN INTEGRACIÓN CON API NINJAS:", e.message || e);
    return getMockCountry(cleanCountry);
  }
}

// no deberia estar aca
export function getMockCountry(country) {
  const lower = country.toLowerCase();

  if (lower.includes("fran") || lower.includes("france")) {
    return { name: "Francia", region: "Europe", population: 67391582, languages: ["Francés"], currencies: ["Euro"], error: false };
  }
  if (lower.includes("ital") || lower.includes("italy")) {
    return { name: "Italia", region: "Europe", population: 59554023, languages: ["Italiano"], currencies: ["Euro"], error: false };
  }
  if (lower.includes("arg") || lower.includes("argent")) {
    return { name: "Argentina", region: "Americas", population: 45195774, languages: ["Español"], currencies: ["Peso Argentino"], error: false };
  }
  if (lower.includes("spa") || lower.includes("esp")) {
    return { name: "España", region: "Europe", population: 47420000, languages: ["Español"], currencies: ["Euro"], error: false };
  }
  if (lower.includes("iran")) {
    return { name: "Irán", region: "Asia", population: 88550000, languages: ["Persa"], currencies: ["Rial Iraní"], error: false };
  }
  if (lower.includes("chil")) {
    return { name: "Chile", region: "Americas", population: 19493184, languages: ["Español"], currencies: ["Peso Chileno"], error: false };
  }
  if (lower.includes("lit") || lower.includes("lith") || lower.includes("lietu")) {
    return { name: "Lituania", region: "Europe", population: 2795680, languages: ["Lituano"], currencies: ["Euro"], error: false };
  }
  if (lower.includes("ing") || lower.includes("eng") || lower.includes("inglaterra")) {
    return { name: "Inglaterra", region: "Europe", population: 56286961, languages: ["Inglés"], currencies: ["Libra Esterlina"], error: false };
  }
  if (lower.includes("bol") || lower.includes("boliv")) {
    return { name: "Bolivia", region: "Americas", population: 12388571, languages: ["Español", "Quechua", "Aymara"], currencies: ["Boliviano"], error: false };
  }
  if (lower.includes("colom") || lower.includes("columb")) {
    return { name: "Colombia", region: "Americas", population: 50882884, languages: ["Español"], currencies: ["Peso Colombiano"], error: false };
  }
  return { name: country, region: "Europa", population: 40000000, languages: ["Inglés"], currencies: ["Euro"], error: false };
}