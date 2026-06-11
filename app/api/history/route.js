import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    let query = supabase.from("country_comparisons").select("*");

    if (sessionId) {
      query = query.eq("session_id", sessionId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("SUPABASE HISTORY ERROR:", error);

      return NextResponse.json(
        {
          error: "Error fetching history",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      history: data ? [...data].reverse() : [],
    });

  } catch (err) {
    console.error("SERVER ERROR:", err);

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}