import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("audio") as unknown as File;
    const songId = data.get("songId") as string;
    const title = data.get("title") as string;
    const email = data.get("email") as string;

    if (!file) {
      return NextResponse.json({ error: "No file received" }, { status: 400 });
    }

    if (!songId) {
      return NextResponse.json({ error: "No song ID provided" }, { status: 400 });
    }

    if (!title) {
      return NextResponse.json({ error: "No title provided" }, { status: 400 });
    }

    if (!email) {
      return NextResponse.json({ error: "No email provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Insert/update song in Supabase
    const supabase = await createServerSupabaseClient();
    const { error: dbError } = await supabase
      .from("songs")
      .update({
        wav_data: buffer,
        created_at: new Date().toISOString(),
        title,
        email,
        status: "completed",
      })
      .eq("id", songId);

    if (dbError) {
      return NextResponse.json({ error: "Failed to update song in database" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
    });

  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
