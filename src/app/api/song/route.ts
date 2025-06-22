import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: List all songs or filter by user email
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  let query = supabase
    .from("songs")
    .select("id, title, wav_data, email, status")
    .order("created_at", { ascending: false });

  if (email) {
    query = query.eq("email", email);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}


// POST: Create a new song entry
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const {
      id,
      title,
      email,
      wav_data,
      status = "processing",
    } = body;

    if (!id || !title || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("songs")
      .insert([
        {
          id,
          title,
          email,
          wav_data,
          status,
        },
      ])
      .select("id, created_at, title, email, wav_data, status")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const { id, file_url, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing song id" }, { status: 400 });
    }

    const updateData: any = {};
    if (file_url !== undefined) updateData.file_url = file_url;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabase
      .from("songs")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}