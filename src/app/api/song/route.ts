import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: List all songs (id, title, user_id)
export async function GET() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("songs")
    .select("id, title, user_id, created_at, status, description")
    .order("created_at", { ascending: false });

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
    const { title, description, user_id, parameters, status = "processing" } = body;

    if (!title || !user_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("songs")
      .insert([
        {
          title,
          description,
          user_id,
          parameters,
          status,
        },
      ])
      .select("id, title, user_id, status, created_at")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

// PUT: Update song with file URL and status
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
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
