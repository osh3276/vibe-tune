import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: List all songs (id, title, user_id)
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("songs")
    .select("id, title, wav_data, email, status")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}