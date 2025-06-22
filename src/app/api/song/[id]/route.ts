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
    const { title, description, status, file_url, id } = body;

    // If we're updating status/file_url (from generation process), don't require title
    const isStatusUpdate = status !== undefined || file_url !== undefined;

    if (!isStatusUpdate && !title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    // Only update title if provided
    if (title !== undefined) {
      updates.title = title.trim();
    }

    // Only update description if provided
    if (description !== undefined) {
      updates.description = description?.trim() || null;
    }

    // Update status if provided (for generation process)
    if (status !== undefined) {
      updates.status = status;
    }

    // Update file_url if provided (for generation process)
    if (file_url !== undefined) {
      updates.file_url = file_url;
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

  try {
    // First, get the song to check if it has a file
    const { data: song, error: fetchError } = await supabase
      .from("songs")
      .select("file_url")
      .eq("id", songId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching song:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Delete the song record from database
    const { error: deleteError } = await supabase
      .from("songs")
      .delete()
      .eq("id", songId);

    if (deleteError) {
      console.error("Supabase delete error:", deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // If song had a file, try to delete it from storage
    if (song?.file_url) {
      const filePath = `songs/${songId}.wav`;
      const { error: storageError } = await supabase.storage
        .from('songs')
        .remove([filePath]);

      if (storageError) {
        console.warn("Warning: Failed to delete file from storage:", storageError);
        // Don't fail the request if storage deletion fails
      }
    }

    return NextResponse.json({ message: "Song deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting song:", error);
    return NextResponse.json({ error: "Failed to delete song" }, { status: 500 });
  }
}
