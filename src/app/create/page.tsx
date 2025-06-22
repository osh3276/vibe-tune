"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Music,
  Video,
  Camera,
  Mic,
  ArrowLeft,
  Play,
  Square,
  X,
  Sparkles,
  Settings,
  ChevronDown,
  RefreshCw,
} from "lucide-react";

function CreatePage() {
  // Recording states
  const [recordingState, setRecordingState] = useState<
    "idle" | "countdown" | "recording" | "playback"
  >("idle");
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(
    null,
  );
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [recordingTime, setRecordingTime] = useState(0);
  const [maxRecordingTime] = useState(30); // 30 seconds max
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [showCameraSelector, setShowCameraSelector] = useState(false);
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Initialize camera on component mount
  useEffect(() => {
    let isMounted = true;

    const initializeCamera = async () => {
      try {
        // Get available cameras first
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        if (isMounted) {
          setAvailableCameras(videoDevices);
          
          // Set default camera (prefer back camera if available)
          if (videoDevices.length > 0 && !selectedCameraId) {
            const backCamera = videoDevices.find(device =>
              device.label.toLowerCase().includes('back') ||
              device.label.toLowerCase().includes('rear')
            );
            const defaultCamera = backCamera || videoDevices[0];
            setSelectedCameraId(defaultCamera.deviceId);
          }
        }

        if (recordingState === "idle" && !streamRef.current) {
          const constraints = {
            video: {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
            },
            audio: true,
          };

          const stream = await navigator.mediaDevices.getUserMedia(constraints);

          if (isMounted) {
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          }
        }
      } catch (error) {
        console.error("Error initializing camera:", error);
      }
    };

    initializeCamera();

    return () => {
      isMounted = false;
      // Cleanup intervals on unmount
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      // Cleanup stream on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [selectedCameraId, recordingState]);

  // Handle video display based on recording state
  useEffect(() => {
    if (recordingState === "playback" && recordedVideo && playbackVideoRef.current) {
      const video = playbackVideoRef.current;
      video.src = recordedVideo;
      video.load();
      video.play().catch((error) => {
        console.warn("Auto-play failed:", error);
      });
    } else if (recordingState !== "playback" && videoRef.current && streamRef.current) {
      // Ensure live camera feed is displayed in all non-playback states (idle, countdown, recording)
      videoRef.current.srcObject = streamRef.current;
      // Force the video to play to ensure it's visible
      videoRef.current.play().catch((error) => {
        console.warn("Video play failed:", error);
      });
    }
  }, [recordingState, recordedVideo]);

  // Close camera selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCameraSelector) {
        const target = event.target as Element;
        if (!target.closest('.camera-selector')) {
          setShowCameraSelector(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCameraSelector]);

  const switchCamera = useCallback(async (deviceId: string) => {
    try {
      // Stop current stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // Get new stream with selected camera
      const constraints = {
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          deviceId: { exact: deviceId },
        },
        audio: true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setSelectedCameraId(deviceId);
      setShowCameraSelector(false);
    } catch (error) {
      console.error("Error switching camera:", error);
      alert("Unable to switch camera. Please try again.");
    }
  }, []);

  const refreshCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      
      // If current camera is no longer available, switch to first available
      if (selectedCameraId && !videoDevices.find(d => d.deviceId === selectedCameraId)) {
        if (videoDevices.length > 0) {
          await switchCamera(videoDevices[0].deviceId);
        }
      }
    } catch (error) {
      console.error("Error refreshing cameras:", error);
    }
  }, [selectedCameraId, switchCamera]);

  const startActualRecording = useCallback(() => {
    if (!streamRef.current) {
      console.error("No stream available for recording");
      return;
    }

    console.log("Starting actual recording...");

    // Reset recorded chunks
    chunksRef.current = [];
    setRecordedChunks([]);

    // Ensure video element continues to show live feed during recording
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      // Make sure the video is playing and visible
      videoRef.current.play().catch((error) => {
        console.warn("Video play failed during recording start:", error);
      });
    }

    // Detect best mimeType for browser compatibility
    function getSupportedMimeType() {
      const possibleTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm",
        "video/mp4",
      ];
      for (const type of possibleTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          return type;
        }
      }
      return ""; // No supported type
    }

    const mimeType = getSupportedMimeType();
    if (!mimeType) {
      alert(
        "Your browser does not support video recording. Please use Chrome or a browser with MediaRecorder support.",
      );
      return;
    }

    const recorder = new MediaRecorder(streamRef.current, {
      mimeType: mimeType,
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
        setRecordedChunks([...chunksRef.current]);
      }
    };

    recorder.onstop = () => {
      console.log("Recording stopped, chunks:", chunksRef.current.length);

      // Clear the recording timer FIRST
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      console.log("Created URL:", url);

      // Set the recorded video and switch to playback
      setRecordedVideo(url);
      setRecordingState("playback");
    };

    mediaRecorderRef.current = recorder;
    setMediaRecorder(recorder);
    recorder.start();
    setRecordingState("recording");
    setRecordingTime(0);

    console.log("Starting recording timer...");

    // Clear any existing recording timer before starting a new one
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    // Start recording timer
    let currentTime = 0;
    recordingIntervalRef.current = setInterval(() => {
      currentTime++;
      setRecordingTime(currentTime);
      console.log("Timer tick:", currentTime, "seconds");

      // Auto-stop at max time
      if (currentTime >= 30) {
        console.log("Max recording time reached, stopping...");
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
        }
      }
    }, 1000);
  }, []);

  const startCountdown = useCallback(() => {
    console.log("Starting countdown...");
    setRecordingState("countdown");
    setCountdown(3);

    // Clear any existing countdown interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    let currentCount = 3;
    countdownIntervalRef.current = setInterval(() => {
      currentCount--;
      setCountdown(currentCount);
      console.log("Countdown:", currentCount);
      
      if (currentCount <= 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        // Start actual recording immediately after countdown
        startActualRecording();
      }
    }, 1000);
  }, [startActualRecording]);

  const stopRecording = useCallback(() => {
    console.log("Stop recording called");

    // Clear recording timer first
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    // Stop the media recorder
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      console.log("Stopping MediaRecorder...");
      mediaRecorderRef.current.stop();
    }
  }, []);

  const exitTheatreMode = useCallback(() => {
    console.log("Exiting theatre mode, current state:", recordingState);

    // Clear any running intervals first
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    // Stop any ongoing recording
    if (mediaRecorder && recordingState === "recording") {
      mediaRecorder.stop();
    }

    // Only exit if we have a recorded video, otherwise reset everything
    if (recordedVideo && recordingState === "playback") {
      setRecordingState("idle");
      // Reinitialize camera for idle state
      const reinitializeCamera = async () => {
        try {
          if (!streamRef.current) {
            const constraints = {
              video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
              },
              audio: true,
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          }
        } catch (error) {
          console.error("Error reinitializing camera:", error);
        }
      };
      reinitializeCamera();
    } else {
      // Reset everything if exiting during recording/countdown
      setRecordingState("idle");
      setRecordedVideo(null);
      setRecordedChunks([]);
      setRecordingTime(0);
      setCountdown(3);
      
      // Reinitialize camera
      const reinitializeCamera = async () => {
        try {
          if (!streamRef.current) {
            const constraints = {
              video: {
                width: { ideal: 1920 },
                height: { ideal: 1080 },
                deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
              },
              audio: true,
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          }
        } catch (error) {
          console.error("Error reinitializing camera:", error);
        }
      };
      reinitializeCamera();
    }
  }, [recordedVideo, recordingState, mediaRecorder, selectedCameraId]);

  const startRecording = useCallback(async () => {
    try {
      console.log("Starting recording process...");

      // Reset all recording states first
      setRecordedVideo(null);
      setRecordedChunks([]);
      setRecordingTime(0);
      setCountdown(3);
      chunksRef.current = [];

      // Clear any existing intervals
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      // Ensure we have camera access - reuse existing stream if available
      if (!streamRef.current) {
        const constraints = {
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
          },
          audio: true,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        streamRef.current = stream;
      }

      // Make sure video element has the stream
      if (videoRef.current && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }

      // Start countdown
      startCountdown();
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert("Unable to access camera. Please check permissions.");
    }
  }, [startCountdown, selectedCameraId]);

  const handleSubmit = async () => {
    if (!recordedVideo) {
      alert("Please record a video first!");
      return;
    }

    if (!user) {
      alert("Please log in to create songs!");
      return;
    }

    setIsGenerating(true);

    try {
      // First, create a song record in the database
      const songTitle =
        description.trim() || `Song ${new Date().toLocaleDateString()}`;
      const songResponse = await fetch("/api/song", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: songTitle,
          description: description.trim() || undefined,
          user_id: user.id,
          status: "processing",
          parameters: {
            prompt: description,
            originalVideoUrl: recordedVideo,
          },
        }),
      });

      if (!songResponse.ok) {
        throw new Error("Failed to create song record");
      }

      const songData = await songResponse.json();
      console.log("Created song record:", songData);

      // Redirect to dashboard to show the processing song
      router.push("/dashboard");

      // Continue with generation in the background
      setTimeout(async () => {
        try {
          // Convert video URL back to blob
          const response = await fetch(recordedVideo);
          const videoBlob = await response.blob();

          // Prepare FormData for binary upload
          const formData = new FormData();
          formData.append("video", videoBlob, "video.webm");
          formData.append("userText", description);
          formData.append("title", songTitle);

          // Call the song generation API
          console.log("Submitting video for song generation...");
          const apiResponse = await fetch("/api/generate", {
            method: "POST",
            body: formData,
          });

          const contentType = apiResponse.headers.get("content-type") || "";

          if (contentType.includes("application/json")) {
            const errorData = await apiResponse.json();
            throw new Error(errorData.error || "Failed to generate song");
          } else if (contentType.includes("audio/wav")) {
            const audioBlob = await apiResponse.blob();

            // Upload the audio file to get a persistent URL
            const uploadFormData = new FormData();
            uploadFormData.append("audio", audioBlob, `${songData.id}.wav`);
            uploadFormData.append("songId", songData.id);

            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: uploadFormData,
            });

            if (!uploadResponse.ok) {
              throw new Error("Failed to upload audio file");
            }

            const uploadData = await uploadResponse.json();

            // Update the song record with the file URL and completed status
            await fetch("/api/song", {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                id: songData.id,
                file_url: uploadData.fileUrl,
                status: "completed",
              }),
            });

            console.log("Song generation completed successfully!");
          } else {
            throw new Error("Unexpected response from server");
          }
        } catch (error) {
          console.error("Song generation error:", error);

          // Update the song record to failed status
          await fetch("/api/song", {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              id: songData.id,
              status: "failed",
            }),
          });
        }
      }, 1000);
    } catch (error) {
      console.error("Song creation error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to create song. Please try again.",
      );
      setIsGenerating(false);
    }
  };

  // Calculate progress percentage for recording (ensure it doesn't exceed 100%)
  const recordingProgress = Math.min(
    (recordingTime / maxRecordingTime) * 100,
    100,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f9f9f7] to-[#f4f3ef]">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 bg-white/90 backdrop-blur-sm border-b border-[#8fd1e3]/20">
        <Link
          href="/"
          className="flex items-center space-x-2 text-[#030c03]/70 hover:text-[#030c03] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center space-x-2">
          <Music className="h-8 w-8 text-[#3fd342]" />
          <span className="text-2xl font-bold text-[#030c03]">VibeTune</span>
        </div>
      </nav>
      {/* Theatre Mode Overlay */}
      {recordingState !== "idle" && (
        <div className="fixed inset-0 bg-black/95 z-50 flex">
          {/* Main Theatre Content */}
          <div className="flex-1 flex items-center justify-center relative">
            {/* Video Display */}
            <div className="relative w-full max-w-6xl aspect-video">
              {recordingState === "playback" && recordedVideo ? (
                <video
                  ref={playbackVideoRef}
                  src={recordedVideo}
                  controls
                  autoPlay
                  preload="auto"
                  className="w-full h-full object-cover rounded-lg bg-black"
                  onLoadedData={() => {
                    console.log("Video loaded successfully");
                  }}
                  onError={(e) => {
                    console.error("Video error:", e);
                  }}
                />
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover rounded-lg"
                />
              )}

              {/* Countdown Overlay */}
              {recordingState === "countdown" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                  <div className="text-white text-8xl font-bold animate-pulse">
                    {countdown}
                  </div>
                </div>
              )}

              {/* Recording Progress Bar */}
              {recordingState === "recording" && (
                <>
                  {/* Progress Bar at Top */}
                  <div className="absolute top-6 left-6 right-6 bg-black/30 rounded-full h-1">
                    <div
                      className="bg-red-500 h-full rounded-full transition-all duration-100"
                      style={{ width: `${recordingProgress}%` }}
                    />
                  </div>

                  {/* Recording Indicator - Minimal */}
                  <div className="absolute top-8 right-8 flex items-center space-x-2 bg-red-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">
                      {Math.floor(recordingTime)}s / {maxRecordingTime}s
                    </span>
                  </div>

                  {/* Stop Recording Button - Icon Only */}
                  <div className="absolute bottom-8 right-8">
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      className="bg-red-500/90 hover:bg-red-600 backdrop-blur-sm text-white p-4 rounded-full shadow-lg border-2 border-white/20"
                    >
                      <Square className="h-6 w-6" fill="currentColor" />
                    </Button>
                  </div>
                </>
              )}

              {/* Exit Theatre Mode Button */}
              <div className="absolute top-8 left-8">
                <Button
                  onClick={exitTheatreMode}
                  variant="ghost"
                  size="lg"
                  className="bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full p-3 border border-white/20"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Playback Controls */}
              {recordingState === "playback" && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
                  <Button
                    onClick={exitTheatreMode}
                    size="lg"
                    className="bg-[#3fd342]/90 hover:bg-[#3fd342] backdrop-blur-sm text-[#030c03] px-6 py-3 rounded-full shadow-lg font-medium"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Use This
                  </Button>
                  <Button
                    onClick={async () => {
                      setRecordedVideo(null);
                      setRecordedChunks([]);
                      setRecordingState("idle");
                      // Reinitialize camera for new recording
                      try {
                        if (!streamRef.current) {
                          const constraints = {
                            video: {
                              width: { ideal: 1920 },
                              height: { ideal: 1080 },
                              deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
                            },
                            audio: true,
                          };
                          const stream = await navigator.mediaDevices.getUserMedia(constraints);
                          streamRef.current = stream;
                          if (videoRef.current) {
                            videoRef.current.srcObject = stream;
                          }
                        }
                      } catch (error) {
                        console.error("Error reinitializing camera:", error);
                        alert("Unable to access camera. Please check permissions.");
                      }
                    }}
                    variant="outline"
                    size="lg"
                    className="border-white/50 bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-full"
                  >
                    <Video className="h-5 w-5 mr-2" />
                    Record Again
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar in Theatre Mode */}
          <div className="w-96 bg-black/80 backdrop-blur-sm border-l border-white/10 p-6 flex flex-col">
            <div className="flex-1">
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm shadow-lg h-full">
                <CardHeader>
                  <CardTitle className="text-white flex items-center text-xl">
                    <Mic className="h-6 w-6 mr-3 text-[#3fd342]" />
                    Add Context
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Describe the mood, style, or story you want in your song
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-3">
                    <Label
                      htmlFor="description-theatre"
                      className="text-white font-medium"
                    >
                      Song Description
                    </Label>
                    <textarea
                      id="description-theatre"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., A happy summer day at the beach, upbeat pop with acoustic guitar, dreamy and nostalgic..."
                      className="w-full h-80 bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder:text-white/50 focus:border-[#3fd342] focus:outline-none resize-none"
                    />
                    <div className="text-sm text-white/50 text-right">
                      {description.length}/500 characters
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Generate Button in Theatre Mode */}
            {recordingState === "playback" && (
              <div className="mt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={!recordedVideo || isGenerating}
                  size="lg"
                  className="w-full bg-gradient-to-r from-[#3fd342] to-[#668bd9] hover:from-[#3fd342]/80 hover:to-[#668bd9]/80 text-white py-4 text-lg font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="h-6 w-6 mr-3 animate-spin" />
                      Generating Your Song...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-6 w-6 mr-3" />
                      Generate Song
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      )}{" "}
      {/* Normal Mode Layout */}
      {recordingState === "idle" && (
        <div className="flex h-[calc(100vh-88px)]">
          {/* Main Camera Section */}
          <div className="flex-1 p-6 flex flex-col">
            <div className="text-center mb-6">
              <h1 className="text-4xl font-bold text-[#030c03] mb-2">
                Create Your Song
              </h1>
              <p className="text-[#030c03]/70">
                Record a video to capture your mood and let AI generate your
                unique song
              </p>
            </div>

            {/* Large Camera/Video Display */}
            <div className="flex-1 flex items-center justify-center">
              <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
                {recordedVideo ? (
                  <video
                    src={recordedVideo}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                    {/* Fallback message if camera is not available */}
                    {!streamRef.current && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                        <div className="text-center text-white">
                          <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                          <p className="text-lg mb-2">Camera not available</p>
                          <p className="text-sm opacity-70">
                            Please allow camera access to record your video
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Camera Selector - More Prominent */}
                {availableCameras.length > 1 && !recordedVideo && (
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-white text-sm">
                      <Camera className="h-4 w-4" />
                      <span>
                        {availableCameras.find(c => c.deviceId === selectedCameraId)?.label || 'Camera'}
                      </span>
                    </div>
                    <div className="relative camera-selector">
                      <Button
                        onClick={() => setShowCameraSelector(!showCameraSelector)}
                        variant="outline"
                        size="sm"
                        className="border-white/50 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Switch Camera
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                      
                      {showCameraSelector && (
                        <div className="absolute top-full right-0 mt-2 w-72 bg-white/95 backdrop-blur-sm rounded-lg shadow-xl border border-white/20 max-h-64 overflow-y-auto z-10">
                          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                            <div>
                              <h3 className="font-medium text-[#030c03] text-sm">Select Camera</h3>
                              <p className="text-xs text-[#030c03]/70 mt-1">Choose your preferred camera source</p>
                            </div>
                            <Button
                              onClick={refreshCameras}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-gray-100"
                              title="Refresh cameras"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                          {availableCameras.map((camera, index) => (
                            <button
                              key={camera.deviceId}
                              onClick={() => switchCamera(camera.deviceId)}
                              className={`w-full px-4 py-3 text-left hover:bg-black/10 transition-colors border-b border-gray-100 last:border-b-0 ${
                                selectedCameraId === camera.deviceId
                                  ? 'bg-[#3fd342]/20 text-[#030c03] font-medium'
                                  : 'text-[#030c03]/80'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <Camera className="h-4 w-4 mr-3" />
                                  <div>
                                    <div className="text-sm font-medium">
                                      {camera.label || `Camera ${index + 1}`}
                                    </div>
                                    <div className="text-xs text-[#030c03]/60">
                                      {camera.deviceId.slice(0, 20)}...
                                    </div>
                                  </div>
                                </div>
                                {selectedCameraId === camera.deviceId && (
                                  <div className="w-2 h-2 bg-[#3fd342] rounded-full"></div>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Start Recording Button */}
                {!recordedVideo && (
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <Button
                      onClick={startRecording}
                      size="lg"
                      className="bg-[#3fd342] hover:bg-[#3fd342]/80 text-[#030c03] px-8 py-4 text-lg shadow-lg rounded-full"
                    >
                      <Video className="h-6 w-6 mr-3" />
                      Start Recording
                    </Button>
                  </div>
                )}

                {/* Re-record Button for recorded video */}
                {recordedVideo && (
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
                    <Button
                      onClick={async () => {
                        setRecordedVideo(null);
                        setRecordedChunks([]);
                        // Reinitialize camera for new recording
                        try {
                          if (!streamRef.current) {
                            const constraints = {
                              video: {
                                width: { ideal: 1920 },
                                height: { ideal: 1080 },
                                deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
                              },
                              audio: true,
                            };
                            const stream = await navigator.mediaDevices.getUserMedia(constraints);
                            streamRef.current = stream;
                            if (videoRef.current) {
                              videoRef.current.srcObject = stream;
                            }
                          }
                        } catch (error) {
                          console.error("Error reinitializing camera:", error);
                          alert("Unable to access camera. Please check permissions.");
                        }
                      }}
                      size="lg"
                      variant="outline"
                      className="border-white/50 bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm px-6 py-3 rounded-full"
                    >
                      <Video className="h-5 w-5 mr-2" />
                      Record New Video
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar for Context */}
          <div className="w-96 bg-white/80 backdrop-blur-sm border-l border-[#8fd1e3]/30 p-6 flex flex-col">
            <div className="flex-1">
              <Card className="bg-white/60 border-[#8fd1e3]/30 backdrop-blur-sm shadow-lg h-full">
                <CardHeader>
                  <CardTitle className="text-[#030c03] flex items-center text-xl">
                    <Mic className="h-6 w-6 mr-3 text-[#3fd342]" />
                    Add Context
                  </CardTitle>
                  <CardDescription className="text-[#030c03]/70">
                    Describe the mood, style, or story you want in your song
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    {/* Camera Selection in Sidebar */}
                    {availableCameras.length > 1 && !recordedVideo && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[#030c03] font-medium flex items-center">
                            <Camera className="h-4 w-4 mr-2" />
                            Camera Source
                          </Label>
                          <Button
                            onClick={refreshCameras}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-gray-100"
                            title="Refresh cameras"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                        </div>
                        <select
                          value={selectedCameraId}
                          onChange={(e) => switchCamera(e.target.value)}
                          className="w-full bg-white/80 border border-[#8fd1e3]/40 rounded-lg p-3 text-[#030c03] focus:border-[#3fd342] focus:outline-none shadow-sm"
                        >
                          {availableCameras.map((camera, index) => (
                            <option key={camera.deviceId} value={camera.deviceId}>
                              {camera.label || `Camera ${index + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <Label
                        htmlFor="description"
                        className="text-[#030c03] font-medium"
                      >
                        Song Description
                      </Label>
                      <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., A happy summer day at the beach, upbeat pop with acoustic guitar, dreamy and nostalgic..."
                        className={`w-full bg-white/80 border border-[#8fd1e3]/40 rounded-lg p-4 text-[#030c03] placeholder:text-[#030c03]/50 focus:border-[#3fd342] focus:outline-none resize-none shadow-sm ${
                          availableCameras.length > 1 && !recordedVideo ? 'h-64' : 'h-80'
                        }`}
                      />
                      <div className="text-sm text-[#030c03]/50 text-right">
                        {description.length}/500 characters
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Generate Button */}
            {recordedVideo && (
              <div className="mt-6">
                <Button
                  onClick={handleSubmit}
                  disabled={!recordedVideo || isGenerating}
                  size="lg"
                  className="w-full bg-gradient-to-r from-[#3fd342] to-[#668bd9] hover:from-[#3fd342]/80 hover:to-[#668bd9]/80 text-white py-4 text-lg font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Sparkles className="h-6 w-6 mr-3 animate-spin" />
                      Generating Your Song...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-6 w-6 mr-3" />
                      Generate Song
                    </>
                  )}
                </Button>

                <p className="text-[#030c03]/60 text-sm text-center mt-3">
                  Ready to create your unique song!
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default CreatePage;
