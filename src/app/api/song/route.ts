import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// GET: List all songs (id, title, user_id)
export async function GET() {
  const { data, error } = await supabase
    .from("songs")
    .select("id, title, user_id, created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

// POST: Upload a new song (expects multipart/form-data: title, wav (file), user_id)
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const title = formData.get("title") as string;
  const user_id = formData.get("user_id") as string;
  const wavFile = formData.get("wav") as File;

  if (!title || !user_id || !wavFile) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Read wav file as ArrayBuffer
  const wavBuffer = Buffer.from(await wavFile.arrayBuffer());

  const { data, error } = await supabase
    .from("songs")
    .insert([
      {
        title,
        user_id,
        wav_data: wavBuffer,
      },
    ])
    .select("id, title, user_id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data[0], { status: 201 });
}
