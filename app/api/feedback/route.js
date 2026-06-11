import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

const FeedbackSchema = z.object({
  sessionId: z.string().min(1),
  messageIndex: z.number().int().nonnegative(),
  voteType: z.enum(["thumbs_up", "thumbs_down"]),
});

export async function POST(req) {
  try {
    const body = await req.json();
    
    const { sessionId, messageIndex, voteType } = FeedbackSchema.parse(body);

    const { error } = await supabase
      .from("chat_feedback")
      .insert([
        {
          session_id: sessionId,
          message_index: messageIndex,
          vote_type: voteType,
        },
      ]);

    if (error) {
      console.error("Error al guardar feedback en Supabase:", error);
      return NextResponse.json({ error: "No se pudo registrar el feedback" }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Feedback registrado con éxito" });

  } catch (error) {
    console.error("FEEDBACK ERROR:", error);
    return NextResponse.json(
      { 
        error: "Entrada inválida o error interno", 
        details: error?.message || "unknown" 
      }, 
      { status: 400 }
    );
  }
}