import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import { supabase } from "@/lib/supabase"; 
import { tools } from "@/lib/tools"; 
import { SYSTEM_PROMPTS } from "@/lib/agents"; 
import { generateCountryReport, compareCountries, safeGetCountry, sanitizeCountryName } from "@/lib/chatUtils";
import { ComparisonAnswerSchema, SingleCountryAnswerSchema } from "@/lib/schemas";

const client = new OpenAI({apiKey: process.env.OPENAI_API_KEY});

const ChatInputSchema = z.object({
  message: z.string().min(1),
  sessionId: z.string().optional(),
});

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
        { role: "system", content: SYSTEM_PROMPTS.ROUTER },
        { role: "user", content: message },
      ],
      tools: tools,
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
          { role: "system", content: SYSTEM_PROMPTS.SINGLE_REPORT }, 
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
        { role: "system", content: SYSTEM_PROMPTS.COMPARISON }, 
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

