import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// DELETE: Delete a song by id
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const songId = params.id;
  if (!songId) {
    return NextResponse.json({ error: "Missing song id" }, { status: 400 });
  }

  const { error } = await supabase
    .from("songs")
    .delete()
    .eq("id", songId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ message: "Song deleted" }, { status: 200 });
}
