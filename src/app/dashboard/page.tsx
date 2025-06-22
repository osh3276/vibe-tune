"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Music,
  LogOut,
  Video,
  Plus,
  User,
  Calendar,
  Mail,
  Zap,
  TrendingUp,
  Clock,
  Play,
  MoreHorizontal,
  AlertCircle,
  Trash2,
} from "lucide-react";
import Link from "next/link";

interface Song {
  id: string;
  title: string;
  description?: string;
  status: "processing" | "completed" | "failed";
  created_at: string;
  user_id: string;
}

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchUserSongs();
    }
  }, [user]);

  // Separate effect for polling
  useEffect(() => {
    const hasProcessingSongs = songs.some(song => song.status === "processing");
    if (hasProcessingSongs && user) {
      const interval = setInterval(fetchUserSongs, 5000); // Poll every 5 seconds
      return () => clearInterval(interval);
    }
  }, [songs, user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUserSongs = async () => {
    try {
      setLoadingSongs(true);
      const response = await fetch("/api/song");
      if (response.ok) {
        const allSongs = await response.json();
        // Filter songs for current user (RLS should handle this, but double-check)
        const userSongs = allSongs.filter((song: Song) => song.user_id === user?.id);
        setSongs(userSongs);
      }
    } catch (error) {
      console.error("Error fetching songs:", error);
    } finally {
      setLoadingSongs(false);
    }
  };

  const handleDeleteSong = async (songId: string, songTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${songTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/song/${songId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete song");
      }

      // Remove the song from the local state
      setSongs(songs.filter(song => song.id !== songId));
    } catch (err) {
      console.error("Error deleting song:", err);
      alert("Failed to delete song");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcf8f2] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#3fd342] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-[#030c03]/60 text-lg animate-pulse">
            Loading your workspace...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  const completedSongs = songs.filter(song => song.status === "completed").length;
  const processingSongs = songs.filter(song => song.status === "processing").length;
  const thisMonthSongs = songs.filter(song => {
    const songDate = new Date(song.created_at);
    const now = new Date();
    return songDate.getMonth() === now.getMonth() && songDate.getFullYear() === now.getFullYear();
  }).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-100";
      case "processing":
        return "text-yellow-600 bg-yellow-100";
      case "failed":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return "✓";
      case "processing":
        return "⏳";
      case "failed":
        return "✗";
      default:
        return "?";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9f9f7] to-[#f4f3ef] animate-in fade-in duration-500">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-[#8fd1e3]/20 px-6 py-4 animate-in slide-in-from-top duration-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-[#3fd342] rounded-lg flex items-center justify-center">
              <Music className="h-6 w-6 text-[#030c03]" />
            </div>
            <div className="flex items-center">
              <span className="text-2xl font-inter font-semibold">Vibe{"  "}</span>
              <span className="text-2xl font-semibold font-inter bg-gradient-to-r from-[#3fd342] to-[#668bd9] bg-clip-text text-transparent">
                Tune
              </span>
            </div>
          </div>

          {/* Account Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-12 w-12 hover:bg-[#030c03]/10 transition-all"
              >
                <User className="h-8 w-8 text-[#030c03]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-80 bg-white/95 backdrop-blur-xl border border-[#8fd1e3]/30"
              align="end"
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-3 p-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#3fd342] to-[#668bd9] rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium text-[#030c03]">
                        {user.user_metadata?.first_name ||
                          user.user_metadata?.full_name ||
                          user.email?.split("@")[0]}
                      </p>
                      <p className="text-xs text-[#030c03]/60 font-normal">
                        Creator
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-xs text-[#030c03]/60">
                    <div className="flex items-center space-x-2">
                      <Mail className="h-3 w-3" />
                      <span>{user.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Member since{" "}
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#8fd1e3]/30" />
              <DropdownMenuItem
                onClick={signOut}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 animate-in slide-in-from-bottom duration-500 delay-100">
        <div className="mb-12">
          <h1 className="text-7xl font-bold text-[#030c03] mb-4 font-display">
            Dashboard
          </h1>
          <p className="text-[#030c03]/60 text-[18px] max-w-3xl">
            Transform your creative vision into unforgettable music
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/80 border border-[#8fd1e3]/30 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#3fd342] text-sm font-medium">
                    Total Songs
                  </p>
                  <p className="text-3xl font-bold text-[#030c03]">{songs.length}</p>
                </div>
                <div className="w-12 h-12 bg-[#3fd342]/20 rounded-lg flex items-center justify-center">
                  <Music className="h-6 w-6 text-[#3fd342]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border border-[#8fd1e3]/30 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#668bd9] text-sm font-medium">
                    This Month
                  </p>
                  <p className="text-3xl font-bold text-[#030c03]">{thisMonthSongs}</p>
                </div>
                <div className="w-12 h-12 bg-[#668bd9]/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-[#668bd9]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 border border-[#8fd1e3]/30 backdrop-blur-sm hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#8fd1e3] text-sm font-medium">
                    Processing
                  </p>
                  <p className="text-3xl font-bold text-[#030c03]">{processingSongs}</p>
                </div>
                <div className="w-12 h-12 bg-[#8fd1e3]/20 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-[#8fd1e3]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create New Song - Featured */}
          <div className="lg:col-span-1">
            <Card className="bg-white/80 border border-[#8fd1e3]/30 hover:border-[#3fd342]/50 hover:shadow-lg transition-all duration-300 group cursor-pointer h-full">
              <CardHeader className="pb-4">
                <div className="w-16 h-16 bg-[#3fd342] rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Video className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-[#030c03] group-hover:text-[#3fd342] transition-colors">
                  Create New Song
                </CardTitle>
                <CardDescription className="text-[#030c03]/60 text-base">
                  Upload a video and let AI transform it into a unique musical
                  masterpiece
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/create">
                  <Button className="w-full bg-[#3fd342] hover:bg-[#3fd342]/80 text-white font-semibold py-3 text-base group-hover:shadow-lg transition-all">
                    <Plus className="h-5 w-5 mr-2" />
                    Start Creating
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card className="bg-white/80 border border-[#8fd1e3]/30 backdrop-blur-sm h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-[#030c03] flex items-center">
                      <Zap className="h-6 w-6 text-[#668bd9] mr-3" />
                      Your Songs
                    </CardTitle>
                    <CardDescription className="text-[#030c03]/60 text-base mt-2">
                      Your latest creations and projects
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingSongs ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-[#3fd342] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-[#030c03]/60">Loading songs...</p>
                  </div>
                ) : songs.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-[#8fd1e3]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Music className="h-10 w-10 text-[#8fd1e3]" />
                    </div>
                    <h3 className="text-xl font-semibold text-[#030c03] mb-2">
                      Ready to create your first song?
                    </h3>
                    <p className="text-[#030c03]/60 mb-6 max-w-md mx-auto">
                      Upload a video and watch as AI transforms it into an
                      incredible musical experience.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {songs.slice(0, 6).map((song) => (
                      <div
                        key={song.id}
                        className="flex items-center justify-between p-4 bg-white/50 rounded-lg border border-[#8fd1e3]/20 hover:border-[#3fd342]/30 transition-all group cursor-pointer"
                        onClick={() => router.push(`/song/${song.id}`)}
                      >
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-[#3fd342] to-[#668bd9] rounded-lg flex items-center justify-center flex-shrink-0">
                            <Music className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-[#030c03] group-hover:text-[#3fd342] transition-colors">
                              {song.title}
                            </h4>
                            <div className="flex items-center space-x-2 mt-1">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  song.status
                                )}`}
                              >
                                {getStatusIcon(song.status)} {song.status}
                              </span>
                              <span className="text-[#030c03]/60 text-sm">
                                {new Date(song.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {song.status === "completed" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/song/${song.id}`);
                              }}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/song/${song.id}`);
                                }}
                              >
                                <Play className="h-4 w-4 mr-2" />
                                View Song
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSong(song.id, song.title);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Song
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                    {songs.length > 6 && (
                      <div className="text-center pt-4">
                        <Button variant="outline" size="sm">
                          View All Songs ({songs.length})
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Floating Demo Button */}
      <Link href="/demo">
        <div className="fixed bottom-6 right-6 group cursor-pointer z-50">
          <div className="relative">
            {/* Tooltip */}
            <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-[#030c03] text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
              Try our demo
              <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#030c03]"></div>
            </div>

            {/* Button */}
            <div className="w-14 h-14 bg-gradient-to-br from-[#3fd342] to-[#668bd9] rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200 group-hover:from-[#3fd342]/90 group-hover:to-[#668bd9]/90">
              <Play className="h-6 w-6 text-white ml-0.5" />
            </div>

            {/* Pulse animation ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#3fd342] to-[#668bd9] opacity-30 animate-ping"></div>
          </div>
        </div>
      </Link>
    </div>
  );
}
