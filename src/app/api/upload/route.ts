import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("audio") as unknown as File;
    const songId = data.get("songId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file received" }, { status: 400 });
    }

    if (!songId) {
      return NextResponse.json({ error: "No song ID provided" }, { status: 400 });
    }

    const supabase = await createClient();
    
    // Convert file to array buffer
    const bytes = await file.arrayBuffer();
    
    // Generate filename
    const filename = `${songId}.wav`;
    const filePath = `songs/${filename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('songs')
      .upload(filePath, bytes, {
        contentType: 'audio/wav',
        upsert: true // Allow overwriting existing files
      });

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
      return NextResponse.json(
        { error: `Failed to upload to storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('songs')
      .getPublicUrl(filePath);

    const fileUrl = publicUrlData.publicUrl;

    return NextResponse.json({ 
      success: true, 
      fileUrl,
      path: uploadData.path
    });

  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
