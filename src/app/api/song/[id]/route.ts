import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: Fetch a specific song by id
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id: songId } = await params;

  if (!songId) {
    return NextResponse.json({ error: "Missing song id" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .eq("id", songId)
    .single();

  if (error) {
    console.error("Supabase error:", error);
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// PUT: Update a song's metadata (title, description)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id: songId } = await params;

  if (!songId) {
    return NextResponse.json({ error: "Missing song id" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { title, description } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const updates: any = {
      title: title.trim(),
      updated_at: new Date().toISOString(),
    };

    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    const { data, error } = await supabase
      .from("songs")
      .update(updates)
      .eq("id", songId)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Song not found" }, { status: 404 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}

// DELETE: Delete a song by id
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { id: songId } = await params;

  if (!songId) {
    return NextResponse.json({ error: "Missing song id" }, { status: 400 });
  }

  const { error } = await supabase.from("songs").delete().eq("id", songId);

  if (error) {
    console.error("Supabase delete error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: "Song deleted" }, { status: 200 });
}
