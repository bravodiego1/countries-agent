import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { supabase } from "@/lib/supabase"; 

const ComparisonAnswerSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    livingRecommendation: { type: "string" },
    tourismRecommendation: { type: "string" },
  },
  required: ["summary", "livingRecommendation", "tourismRecommendation"],
};

const SingleCountryAnswerSchema = {
  type: "object",
  properties: {
    countryName: { type: "string" },
    demographics: { type: "string" },
    languagesAndCulture: { type: "string" },
    economyAndInsight: { type: "string" },
  },
  required: ["countryName", "demographics", "languagesAndCulture", "economyAndInsight"],
};

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ChatInputSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
});

function generateCountryReport(countryData) {
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

function compareCountries(countryA, countryB) {
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

function sanitizeCountryName(country) {
  if (!country) return "";
  return country
    .trim()
    .replace(/([^a-zA-ZáéíóúÁÉÍÓÚñÑ ])/g, "") 
    .replace(/([a-zA-Z])\1+/g, '$1'); 
}

async function safeGetCountry(country) {
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

function getMockCountry(country) {
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

export async function POST(req) {
  try {
    const bodyData = await req.json();
    const parsedData = ChatInputSchema.parse(bodyData);
    
    let sessionId = parsedData.sessionId;
    if (!sessionId || sessionId === "default") {
      sessionId = "session_" + Math.random().toString(36).substring(2, 12);
    }

    const message = parsedData.message;

    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "user",
      content: message,
    });

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres un agente experto en análisis geopolítico y macroeconómico de países.
              Tu único objetivo es determinar qué herramienta (tool) necesitas invocar para responder a la solicitud del usuario.
              REGLAS DE OBLIGATORIO CUMPLIMIENTO:
              1. Si el usuario te pide información, reportes o datos de UN solo país, debes invocar la herramienta 'get_country_report'.
              2. Si el usuario te pide comparar, elegir o evaluar dos países (ya sea para vivir, emigrar, turismo o cultura), debes invocar la herramienta 'compare_countries_recommendation'.
              3. NO inventes texto ni simules el pensamiento en la respuesta final si necesitas una herramienta. Invoca la función directamente a través del mecanismo de tools de OpenAI.`
        },
        { role: "user", content: message },
      ],
      tools: [
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
      ],
    });

    const assistantMessageObj = response.choices?.[0]?.message;
    const toolCalls = assistantMessageObj?.tool_calls || [];
    const toolLogs = [];
    const toolResults = [];
    let comparisonArgs = null;
    let reportArgs = null;

    for (const toolCall of toolCalls) {
      const args = JSON.parse(toolCall.function.arguments);
      let result = null;

      if (toolCall.function.name === "get_country_report") {
        const baseData = await safeGetCountry(args.country);
        result = generateCountryReport(baseData);
        reportArgs = args;
      }

      if (toolCall.function.name === "compare_countries_recommendation") {
        const countryA = await safeGetCountry(args.countryA);
        const countryB = await safeGetCountry(args.countryB);

        result = compareCountries(countryA, countryB);
        comparisonArgs = args; 
      }

      toolResults.push({
        tool_call_id: toolCall.id,   
        role: "tool",
        name: toolCall.function.name,
        content: JSON.stringify(result),
      });

      toolLogs.push({
        tool: toolCall.function.name,
        input: args,
        output: result,
      });

      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        role: "tool",
        content: `Tool executed: ${toolCall.function.name}`,
        tool_name: toolCall.function.name,
        tool_input: args,
        tool_output: result,
      });
    }

    if (toolCalls.length === 0) {
      const assistantMessage = response.choices[0].message.content;

      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        role: "assistant",
        content: assistantMessage,
      });

      return NextResponse.json({
        answer: assistantMessage,
        tools: [],
        sessionId,
      });
    }

    if (reportArgs && !comparisonArgs) {
      const singleCountryResponse = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Eres un analista geopolítico senior. Recibiste datos crudos de una API externa. 
            Tu objetivo es generar un reporte enriquecido, completo y perfectamente estructurado en el JSON Schema solicitado.

            CRITERIO DE INGENIERÍA ANTI-PROXY:
            1. Escribe SIEMPRE en ESPAÑOL y traduce los nombres geográficos.
            2. ENRIQUECIMIENTO REAL: Si notas que los datos crudos de la API omitieron información cultural básica o de lenguajes conocidos mundialmente (como el idioma Español en Venezuela, Colombia, Argentina, etc., o detalles demográficos), utiliza tu base de conocimiento para complementar y ENRIQUECER de manera fluida las propiedades 'languagesAndCulture' y 'economyAndInsight'. No te limites a decir "no disponible".
            3. Redacta párrafos completos de al menos 2 o 3 oraciones en cada propiedad del JSON.`
          },
          { role: "user", content: message },
          assistantMessageObj, 
          ...toolResults       
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "single_country_answer",
            schema: SingleCountryAnswerSchema,
          },
        },
      });

      const reportAnswerText = singleCountryResponse.choices[0].message.content;
      let reportAnswer = JSON.parse(reportAnswerText);
      const jsonReportStringToPersist = JSON.stringify(reportAnswer);

      await supabase.from("chat_messages").insert({
        session_id: sessionId,
        role: "assistant",
        content: jsonReportStringToPersist, 
      });

      try {
        const cleanReportCountry = String(sanitizeCountryName(reportArgs.country));
        await supabase.from("country_reports").insert([
          {
            session_id: sessionId,
            country_name: cleanReportCountry,
            demographics: reportAnswer.demographics,
            languages_culture: reportAnswer.languagesAndCulture,
            economy_insight: reportAnswer.economyAndInsight
          }
        ]);
      } catch (dbReportErr) {
        console.log("SUPABASE: Omitiendo guardado en tabla country_reports.");
      }

      return NextResponse.json({
        answer: jsonReportStringToPersist,
        tools: toolLogs,
        sessionId,
      });
    }

    const secondResponse = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `Eres un consultor experto en relocalización internacional y turismo. Tu objetivo es procesar los datos de las herramientas y armar un informe exhaustivo, analítico y redactado con excelente prosa.
          
          REGLAS CRUCIALES DE REDACCIÓN:
          1. Escribe EXCLUSIVAMENTE en ESPAÑOL.
          2. Traduce SIEMPRE los nombres de los países a su versión en español (ej. "Norway" -> "Noruega").
          3. SÉ DETALLADO Y EXPLAYATE: En cada campo del JSON debes elaborar al menos 2 o 3 oraciones completas y profundas utilizando tu conocimiento general del país para complementar los datos crudos.
          4. COHERENCIA: No inventes que comparten idioma o región a menos que los datos crudos explícitamente lo demuestren.`
        },
        assistantMessageObj, 
        ...toolResults,              
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "comparison_answer",
          schema: ComparisonAnswerSchema,
        },
      },
    });

    const answerText = secondResponse.choices[0].message.content;
    let answer = JSON.parse(answerText);

    const jsonStringToPersist = JSON.stringify(answer);

    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role: "assistant",
      content: jsonStringToPersist, 
    });

    if (comparisonArgs) {
      try {
        const checkCountryA = comparisonArgs.countryA || comparisonArgs.countrya || "";
        const checkCountryB = comparisonArgs.countryB || comparisonArgs.countryb || "";

        const finalCountryA = String(sanitizeCountryName(checkCountryA));
        const finalCountryB = String(sanitizeCountryName(checkCountryB));

        console.log(`Intentando guardar en country_comparisons para la sesión: ${sessionId}`);

        const { error: compError } = await supabase
          .from("country_comparisons")
          .insert([
            {
              session_id: sessionId, 
              country_a: finalCountryA,
              country_b: finalCountryB,
              summary: String(answer.summary || ""),
              living_recommendation: String(answer.livingRecommendation || ""),
              tourism_recommendation: String(answer.tourismRecommendation || ""),
            },
          ]);

        if (compError) {
          console.error("Falló la inserción en 'country_comparisons'.", {
            message: compError.message,
            details: compError.details,
            hint: compError.hint,
            code: compError.code
          });
        } else {
          console.log("Datos guardados con éxito en la tabla 'country_comparisons'.");
        }
      } catch (innerDbError) {
        console.error("ERROR CRITICO AL INSERTAR EN BD:", innerDbError.message || innerDbError);
      }
    }

    return NextResponse.json({
      answer: jsonStringToPersist, 
      tools: toolLogs,
      sessionId,
    });

  } catch (error) {
    console.error("CHAT ERROR:", error);
    return NextResponse.json(
      {
        error: "Error en el servidor",
        details: error?.message || "error desconocido",
      },
      { status: 500 }
    );
  }
}

