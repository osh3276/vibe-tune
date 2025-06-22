"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import MusicPlayer from "@/components/MusicPlayer";
import {
  ArrowLeft,
  Music,
  Calendar,
  Clock,
  Download,
  Share2,
  Trash2,
  AlertCircle,
  Edit,
  Save,
  X,
} from "lucide-react";

interface Song {
  id: string;
  title: string;
  description?: string;
  file_url?: string;
  status: "processing" | "completed" | "failed";
  created_at: string;
  parameters?: {
    prompt?: string;
    negativeTags?: string;
    originalVideoUrl?: string;
  };
}

export default function SongPage({ params }: { params: Promise<{ id: string }> }) {
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [songId, setSongId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const getParams = async () => {
      const { id } = await params;
      setSongId(id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user && songId) {
      fetchSong();
    }
  }, [user, authLoading, songId, router]);

  // Polling effect for processing songs
  useEffect(() => {
    if (song?.status === "processing" && user) {
      const interval = setInterval(fetchSong, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [song?.status, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSong = async () => {
    if (!songId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/song/${songId}`);

      if (!response.ok) {
        if (response.status === 404) {
          setError("Song not found");
        } else {
          throw new Error("Failed to fetch song");
        }
        return;
      }

      const songData = await response.json();
      setSong(songData);
    } catch (err) {
      console.error("Error fetching song:", err);
      setError("Failed to load song");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!song?.file_url) return;

    const link = document.createElement("a");
    link.href = song.file_url;
    link.download = `${song.title}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: song?.title || "Generated Song",
          text: "Check out this AI-generated song from VibeTune!",
          url: window.location.href,
        });
      } catch (err) {
        console.log("Share cancelled or failed");
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const handleDelete = async () => {
    if (
      !song ||
      !confirm("Are you sure you want to delete this song? This action cannot be undone.")
    ) {
      return;
    }

    try {
      setDeleting(true);
      const response = await fetch(`/api/song/${song.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete song");
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Error deleting song:", err);
      alert("Failed to delete song");
    } finally {
      setDeleting(false);
    }
  };

  const startEditing = () => {
    if (song) {
      setEditTitle(song.title);
      setEditDescription(song.description || "");
      setIsEditing(true);
    }
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditTitle("");
    setEditDescription("");
  };

  const saveChanges = async () => {
    if (!song || !editTitle.trim()) return;

    try {
      setSaving(true);
      const response = await fetch(`/api/song/${song.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update song");
      }

      const updatedSong = await response.json();
      setSong(updatedSong);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating song:", err);
      alert("Failed to update song");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f9f9f7] to-[#f4f3ef] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3fd342] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-[#030c03]/60 text-lg animate-pulse">
            Loading song...
          </p>
        </div>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f9f9f7] to-[#f4f3ef]">
        {/* Navigation */}
        <nav className="bg-white/80 backdrop-blur-xl border-b border-[#8fd1e3]/20 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/dashboard">
              <Button variant="ghost" className="flex items-center space-x-2">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Button>
            </Link>
          </div>
        </nav>

        <main className="max-w-4xl mx-auto px-6 py-12">
          <Card className="bg-white/80 border border-red-200 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-[#030c03] mb-2">
                {error === "Song not found" ? "Song Not Found" : "Error Loading Song"}
              </h1>
              <p className="text-[#030c03]/60 mb-6">
                {error === "Song not found"
                  ? "The song you're looking for doesn't exist or you don't have permission to view it."
                  : "There was an error loading the song. Please try again later."}
              </p>
              <Link href="/dashboard">
                <Button className="bg-[#3fd342] hover:bg-[#3fd342]/80 text-white">
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9f9f7] to-[#f4f3ef]">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-[#8fd1e3]/20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" className="flex items-center space-x-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
          </Link>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleDownload}
              disabled={song.status !== "completed" || !song.file_url}
              className="flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleShare}
              className="flex items-center space-x-2"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center space-x-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle>Delete Song</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete "{song.title}"? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    {deleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Song
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Song Header */}
        <div className="mb-8 group">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3 flex-1">
              <div className="w-12 h-12 bg-[#3fd342] rounded-lg flex items-center justify-center">
                <Music className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="edit-title" className="text-sm font-medium text-[#030c03]">
                        Title
                      </Label>
                      <Input
                        id="edit-title"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="text-2xl font-bold bg-white/50 border-[#8fd1e3]/30"
                        placeholder="Enter song title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-description" className="text-sm font-medium text-[#030c03]">
                        Description
                      </Label>
                      <Input
                        id="edit-description"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="bg-white/50 border-[#8fd1e3]/30"
                        placeholder="Enter song description (optional)"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={saveChanges}
                        disabled={saving || !editTitle.trim()}
                        className="bg-[#3fd342] hover:bg-[#3fd342]/80 text-white"
                        size="sm"
                      >
                        {saving ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={cancelEditing}
                        disabled={saving}
                        variant="outline"
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center space-x-2">
                      <h1 className="text-4xl font-bold text-[#030c03]">{song.title}</h1>
                      <Button
                        onClick={startEditing}
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 hover:bg-[#030c03]/10 transition-opacity"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-[#030c03]/60">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(song.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(song.created_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            {!isEditing && (
              <Button
                onClick={startEditing}
                variant="outline"
                className="ml-4"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          {/* Status Badge */}
          <div className="mb-6">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                song.status === "completed"
                  ? "bg-green-100 text-green-800"
                  : song.status === "processing"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {song.status === "completed" && "✓ Completed"}
              {song.status === "processing" && "⏳ Processing"}
              {song.status === "failed" && "✗ Failed"}
            </span>
          </div>
        </div>

        {/* Music Player */}
        {song.status === "completed" && song.file_url ? (
          <MusicPlayer
            audioUrl={song.file_url}
            title={song.title}
            description={song.description}
            onDownload={handleDownload}
            onShare={handleShare}
            className="mb-8"
          />
        ) : song.status === "processing" ? (
          <Card className="bg-white/80 border border-[#8fd1e3]/30 backdrop-blur-sm mb-8">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-[#668bd9]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="w-8 h-8 border-4 border-[#668bd9] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-semibold text-[#030c03] mb-2">
                Song is Processing
              </h3>
              <p className="text-[#030c03]/60">
                Your song is being generated by our AI. This usually takes a few
                minutes. The page will automatically update when it's ready.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white/80 border border-red-200 backdrop-blur-sm mb-8">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[#030c03] mb-2">
                Generation Failed
              </h3>
              <p className="text-[#030c03]/60">
                There was an error generating your song. You can try creating a new
                one.
              </p>
              <Link href="/create">
                <Button className="mt-4 bg-[#3fd342] hover:bg-[#3fd342]/80 text-white">
                  Create New Song
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Song Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Description */}
          {song.description && (
            <Card className="bg-white/80 border border-[#8fd1e3]/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-[#030c03]">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[#030c03]/80">{song.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Generation Parameters */}
          {song.parameters && (
            <Card className="bg-white/80 border border-[#8fd1e3]/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-xl text-[#030c03]">Generation Details</CardTitle>
                <CardDescription>Parameters used to create this song</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {song.parameters.prompt && (
                  <div>
                    <h4 className="font-semibold text-[#030c03] mb-1">Prompt</h4>
                    <p className="text-[#030c03]/70 text-sm">
                      {song.parameters.prompt}
                    </p>
                  </div>
                )}
                {song.parameters.negativeTags && (
                  <div>
                    <h4 className="font-semibold text-[#030c03] mb-1">
                      Excluded Elements
                    </h4>
                    <p className="text-[#030c03]/70 text-sm">
                      {song.parameters.negativeTags}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
