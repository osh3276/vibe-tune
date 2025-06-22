"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Video, Camera, Mic, ArrowLeft, Play, Square, X, Sparkles, Settings } from "lucide-react";

function CreatePage() {
	// Recording states
	const [recordingState, setRecordingState] = useState<"idle" | "countdown" | "recording" | "playback">("idle");
	const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
	const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
	const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
	const [description, setDescription] = useState("");
	const [isGenerating, setIsGenerating] = useState(false);
	const [showPreview, setShowPreview] = useState(false);
	const [countdown, setCountdown] = useState(3);
	const [recordingTime, setRecordingTime] = useState(0);
	const [maxRecordingTime] = useState(30); // 30 seconds max
	const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
	const [selectedCamera, setSelectedCamera] = useState<string>("");
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
	
	// Get available cameras when component mounts
	useEffect(() => {
		async function getAvailableCameras() {
			try {
				// First, check if we have permission to access cameras
				const stream = await navigator.mediaDevices.getUserMedia({ video: true });
				
				// After getting permission, list all video devices
				const devices = await navigator.mediaDevices.enumerateDevices();
				const videoDevices = devices.filter(device => device.kind === 'videoinput');
				
				console.log('Available cameras:', videoDevices);
				setAvailableCameras(videoDevices);
				
				// Set first camera as default if available
				if (videoDevices.length > 0 && !selectedCamera) {
					setSelectedCamera(videoDevices[0].deviceId);
				}
				
				// Stop the initial permission stream
				stream.getTracks().forEach(track => track.stop());
			} catch (err) {
				console.error('Error getting camera list:', err);
				alert('Unable to access camera. Please check your camera permissions.');
			}
		}
		
		getAvailableCameras();
	}, [selectedCamera]);

	// Cleanup intervals on unmount
	useEffect(() => {
		return () => {
			if (countdownIntervalRef.current) {
				clearInterval(countdownIntervalRef.current);
			}
			if (recordingIntervalRef.current) {
				clearInterval(recordingIntervalRef.current);
			}
		};
	}, []);

	// Ensure video element is properly showing stream whenever recording state changes
	useEffect(() => {
		// Only run this when we're not in playback and we have an active stream
		if (recordingState !== "playback" && streamRef.current && videoRef.current) {
			console.log("Reconnecting video element to stream...");
			
			// Ensure the video element is connected to the stream
			if (videoRef.current.srcObject !== streamRef.current) {
				videoRef.current.srcObject = streamRef.current;
			}
			
			// Make sure the video is playing
			if (videoRef.current.paused) {
				videoRef.current.play().catch(err => {
					console.error("Error playing video after state change:", err);
				});
			}
		}
	}, [recordingState]);
	
	// Handle playback video loading
	useEffect(() => {
		if (recordingState === "playback" && recordedVideo && playbackVideoRef.current) {
			const video = playbackVideoRef.current;
			video.src = recordedVideo;
			video.load();

			// Try to play the video
			video.play().catch((error) => {
				console.warn("Auto-play failed:", error);
				// Auto-play might be blocked, but user can still click play
			});
		}
	}, [recordingState, recordedVideo]);
	const startActualRecording = useCallback(() => {
		if (!streamRef.current) {
			console.error("No stream available for recording");
			return;
		}
		
		console.log("Starting actual recording with stream:", 
			streamRef.current.active, 
			"video tracks:", 
			streamRef.current.getVideoTracks().length
		);
		
		// Verify video element is still showing the stream
		if (videoRef.current && videoRef.current.srcObject !== streamRef.current) {
			console.log("Re-attaching stream to video element");
			videoRef.current.srcObject = streamRef.current;
			videoRef.current.play().catch(err => {
				console.error("Error playing video at recording start:", err);
			});
		}

		// Reset recorded chunks
		chunksRef.current = [];
		setRecordedChunks([]);
		// Detect best mimeType for browser compatibility (without audio codecs since we disabled audio)
		function getSupportedMimeType() {
			// Use video-only codecs since we're not recording audio
			const possibleTypes = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm", "video/mp4"];
			for (const type of possibleTypes) {
				console.log(`Testing mime type: ${type} - Supported: ${MediaRecorder.isTypeSupported(type)}`);
				if (MediaRecorder.isTypeSupported(type)) {
					return type;
				}
			}
			return ""; // No supported type
		}

		const mimeType = getSupportedMimeType();
		if (!mimeType) {
			alert("Your browser does not support video recording. Please use Chrome or a browser with MediaRecorder support.");
			return;
		}
		
		console.log(`Using mime type for recording: ${mimeType}`);
		// Configure recorder with optimal settings for visibility during recording
		const recorderOptions = {
			mimeType: mimeType,
			videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
		};
		
		console.log("Creating MediaRecorder with options:", recorderOptions);
		const recorder = new MediaRecorder(streamRef.current, recorderOptions);

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

			// Stop the live stream
			if (streamRef.current) {
				streamRef.current.getTracks().forEach((track) => track.stop());
				streamRef.current = null;
			}

			// Clear the live video element
			if (videoRef.current) {
				videoRef.current.srcObject = null;
			}

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

		// Start recording timer with fresh ref
		recordingIntervalRef.current = setInterval(() => {
			setRecordingTime((prevTime) => {
				const newTime = prevTime + 1;
				console.log("Timer tick:", newTime, "seconds");

				// Auto-stop at max time
				if (newTime >= 30) {
					console.log("Max recording time reached, stopping...");
					if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
						mediaRecorderRef.current.stop();
					}
					return 30;
				}
				return newTime;
			});
		}, 1000);
	}, []);

	const startCountdown = useCallback(() => {
		console.log("Starting countdown...");
		setRecordingState("countdown");
		setCountdown(3);

		countdownIntervalRef.current = setInterval(() => {
			setCountdown((prev) => {
				console.log("Countdown:", prev);
				if (prev <= 1) {
					if (countdownIntervalRef.current) {
						clearInterval(countdownIntervalRef.current);
						countdownIntervalRef.current = null;
					}
					// Start actual recording after countdown
					setTimeout(() => {
						startActualRecording();
					}, 100);
					return 0;
				}
				return prev - 1;
			});
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
		if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
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

		// Stop video stream
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop());
			streamRef.current = null;
		}

		// Clear video elements
		if (videoRef.current) {
			videoRef.current.srcObject = null;
		}

		// Only exit if we have a recorded video, otherwise reset everything
		if (recordedVideo && recordingState === "playback") {
			setRecordingState("idle");
			// Keep the recorded video for normal mode
		} else {
			// Reset everything if exiting during recording/countdown
			setRecordingState("idle");
			setRecordedVideo(null);
			setRecordedChunks([]);
			setRecordingTime(0);
			setCountdown(3);
		}
	}, [recordedVideo, recordingState, mediaRecorder]);
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

			// Get camera access with selected camera
			const constraints = {
				video: {
					width: { ideal: 1920 },
					height: { ideal: 1080 },
					deviceId: selectedCamera ? { exact: selectedCamera } : undefined
				},
				audio: false, // Disable audio recording
			};

			console.log('Using camera constraints:', constraints);
			const stream = await navigator.mediaDevices.getUserMedia(constraints);
			console.log('Stream received:', stream.active, 'video tracks:', stream.getVideoTracks().length);
			
			if (stream.getVideoTracks().length === 0) {
				throw new Error("No video track available in the stream");
			}

			streamRef.current = stream;
			if (videoRef.current) {
				videoRef.current.srcObject = stream;
				videoRef.current.onloadedmetadata = () => {
					console.log("Video element metadata loaded");
					videoRef.current?.play().catch(err => {
						console.error("Error playing video:", err);
					});
				};
				
				// Add error handling
				videoRef.current.onerror = (err) => {
					console.error("Video element error:", err);
				};
			} else {
				console.error("Video reference is null");
			}

			// Start countdown
			startCountdown();
		} catch (error) {
			console.error("Error accessing camera:", error);
			alert("Unable to access selected camera. Please try another camera or check permissions.");
		}
	}, [startCountdown, selectedCamera]);

	const handleSubmit = async () => {
		if (!recordedVideo) {
			alert("Please record a video first!");
			return;
		}

		setIsGenerating(true);

		try {
			// Convert video URL back to blob
			const response = await fetch(recordedVideo);
			const videoBlob = await response.blob();			// Prepare FormData for binary upload
			const formData = new FormData();
			formData.append("video", videoBlob, "video.webm"); // or video.mp4 if that's your type
			formData.append("userText", description);
			formData.append("title", "My Generated Song");
			formData.append("isAudioless", "true"); // Indicate this is a video without audio

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
				// You can now play, download, or process the audioBlob as needed
				// For example, to play:
				const audioUrl = URL.createObjectURL(audioBlob);
				const audio = new Audio(audioUrl);
				audio.play();
				alert("🎉 Song generated and playing! Check your downloads or console for the audio file.");
				// Optionally, you could trigger a download here
			} else {
				throw new Error("Unexpected response from server");
			}

			// Reset the form
			setRecordedVideo(null);
			setRecordedChunks([]);
			setDescription("");
		} catch (error) {
			console.error("Song generation error:", error);
			alert(error instanceof Error ? error.message : "Failed to generate song. Please try again.");
		} finally {
			setIsGenerating(false);
		}
	};

	// Calculate progress percentage for recording (ensure it doesn't exceed 100%)
	const recordingProgress = Math.min((recordingTime / maxRecordingTime) * 100, 100);

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#f9f9f7] to-[#f4f3ef]">
			{/* Navigation */}
			<nav className="flex items-center justify-between p-6 bg-white/90 backdrop-blur-sm border-b border-[#8fd1e3]/20">
				<Link href="/" className="flex items-center space-x-2 text-[#030c03]/70 hover:text-[#030c03] transition-colors">
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
						<div className="relative w-full max-w-6xl aspect-video">							{recordingState === "playback" && recordedVideo ? (
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
									className="w-full h-full object-cover rounded-lg bg-black" 
									style={{ display: 'block' }}
									onLoadedMetadata={() => console.log("Live camera metadata loaded")}
									onPlaying={() => console.log("Live camera playing")}
									onError={(e) => console.error("Live camera error:", e)}
								/>
							)}

							{/* Countdown Overlay */}
							{recordingState === "countdown" && (
								<div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
									<div className="text-white text-8xl font-bold animate-pulse">{countdown}</div>
								</div>
							)}

							{/* Recording Progress Bar */}
							{recordingState === "recording" && (
								<>
									{/* Progress Bar at Top */}
									<div className="absolute top-6 left-6 right-6 bg-black/30 rounded-full h-1">
										<div className="bg-red-500 h-full rounded-full transition-all duration-100" style={{ width: `${recordingProgress}%` }} />
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
										<Button onClick={stopRecording} size="lg" className="bg-red-500/90 hover:bg-red-600 backdrop-blur-sm text-white p-4 rounded-full shadow-lg border-2 border-white/20">
											<Square className="h-6 w-6" fill="currentColor" />
										</Button>
									</div>
								</>
							)}							{/* Exit Theatre Mode Button */}
							<div className="absolute top-8 left-8 flex items-center gap-2">
								<Button onClick={exitTheatreMode} variant="ghost" size="lg" className="bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full p-3 border border-white/20">
									<X className="h-5 w-5" />
								</Button>
								
								{recordingState !== "playback" && (
									<div className="relative">
										<Button 
											onClick={() => setShowCameraSelector(!showCameraSelector)} 
											variant="ghost"
											size="lg"
											className="bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white rounded-full p-3 border border-white/20"
										>
											<Camera className="h-5 w-5" />
										</Button>

										{/* Camera Dropdown in Theatre Mode */}
										{showCameraSelector && (
											<div className="absolute top-full mt-2 w-64 bg-black/80 backdrop-blur-sm rounded-lg p-2 border border-white/20 shadow-lg z-10">
												<div className="text-white text-sm font-semibold mb-2 px-2">Select Camera Source</div>
												{availableCameras.length === 0 ? (
													<div className="text-gray-400 text-sm p-2">No cameras detected</div>
												) : (
													<div className="space-y-1 max-h-40 overflow-auto">
														{availableCameras.map((camera) => (
															<button
																key={camera.deviceId}
																className={`w-full text-left px-3 py-2 rounded text-sm ${
																	selectedCamera === camera.deviceId
																		? "bg-[#3fd342]/20 text-white"
																		: "text-gray-300 hover:bg-white/10"
																}`}
																onClick={() => {
																	setSelectedCamera(camera.deviceId);
																	setShowCameraSelector(false);
																}}
															>
																{camera.label || `Camera ${camera.deviceId.substring(0, 5)}...`}
															</button>
														))}
													</div>
												)}
											</div>
										)}
									</div>
								)}
							</div>

							{/* Playback Controls */}
							{recordingState === "playback" && (
								<div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex space-x-4">
									<Button onClick={exitTheatreMode} size="lg" className="bg-[#3fd342]/90 hover:bg-[#3fd342] backdrop-blur-sm text-[#030c03] px-6 py-3 rounded-full shadow-lg font-medium">
										<Play className="h-5 w-5 mr-2" />
										Use This
									</Button>
									<Button
										onClick={() => {
											setRecordedVideo(null);
											setRecordedChunks([]);
											setRecordingState("idle");
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
									<CardDescription className="text-white/70">Describe the mood, style, or story you want in your song</CardDescription>
								</CardHeader>
								<CardContent className="flex-1">
									<div className="space-y-3">
										<Label htmlFor="description-theatre" className="text-white font-medium">
											Song Description
										</Label>
										<textarea id="description-theatre" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., A happy summer day at the beach, upbeat pop with acoustic guitar, dreamy and nostalgic..." className="w-full h-80 bg-white/10 border border-white/30 rounded-lg p-4 text-white placeholder:text-white/50 focus:border-[#3fd342] focus:outline-none resize-none" />
										<div className="text-sm text-white/50 text-right">{description.length}/500 characters</div>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Generate Button in Theatre Mode */}
						{recordingState === "playback" && (
							<div className="mt-6">
								<Button onClick={handleSubmit} disabled={!recordedVideo || isGenerating} size="lg" className="w-full bg-gradient-to-r from-[#3fd342] to-[#668bd9] hover:from-[#3fd342]/80 hover:to-[#668bd9]/80 text-white py-4 text-lg font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
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
						<div className="text-center mb-6">							<h1 className="text-4xl font-bold text-[#030c03] mb-2">Create Your Song</h1>
							<p className="text-[#030c03]/70">Record a video (without audio) to capture your mood and let AI generate your unique song</p>
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
									<video 
										ref={videoRef} 
										autoPlay 
										muted 
										playsInline 
										className="w-full h-full object-cover bg-black" 
										style={{ display: 'block' }}
									/>
								)}								{/* Camera Selection & Start Recording Button */}
								{!recordedVideo && (
									<>
										<div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col gap-4 items-center">
											{/* Camera Selection Button */}
											<div className="relative">
												<Button 
													onClick={() => setShowCameraSelector(!showCameraSelector)} 
													variant="outline" 
													className="bg-white/20 border-white/30 text-white hover:bg-white/30 backdrop-blur-sm flex items-center gap-2"
												>
													<Camera className="h-4 w-4" />
													{availableCameras.find(c => c.deviceId === selectedCamera)?.label || "Select Camera"}
													<Settings className="h-4 w-4 ml-1" />
												</Button>

												{/* Camera Dropdown */}
												{showCameraSelector && (
													<div className="absolute bottom-full mb-2 w-64 bg-black/80 backdrop-blur-sm rounded-lg p-2 border border-white/20 shadow-lg z-10">
														<div className="text-white text-sm font-semibold mb-2 px-2">Select Camera Source</div>
														{availableCameras.length === 0 ? (
															<div className="text-gray-400 text-sm p-2">No cameras detected</div>
														) : (
															<div className="space-y-1 max-h-40 overflow-auto">
																{availableCameras.map((camera) => (
																	<button
																		key={camera.deviceId}
																		className={`w-full text-left px-3 py-2 rounded text-sm ${
																			selectedCamera === camera.deviceId
																				? "bg-[#3fd342]/20 text-white"
																				: "text-gray-300 hover:bg-white/10"
																		}`}
																		onClick={() => {
																			setSelectedCamera(camera.deviceId);
																			setShowCameraSelector(false);
																		}}
																	>
																		{camera.label || `Camera ${camera.deviceId.substring(0, 5)}...`}
																	</button>
																))}
															</div>
														)}
													</div>
												)}
											</div>

											{/* Start Recording Button */}
											<Button onClick={startRecording} size="lg" className="bg-[#3fd342] hover:bg-[#3fd342]/80 text-[#030c03] px-8 py-4 text-lg shadow-lg rounded-full">
												<Video className="h-6 w-6 mr-3" />
												Start Recording
											</Button>
										</div>
									</>
								)}

								{/* Re-record Button for recorded video */}
								{recordedVideo && (
									<div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
										<Button
											onClick={() => {
												setRecordedVideo(null);
												setRecordedChunks([]);
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
									<CardDescription className="text-[#030c03]/70">Describe the mood, style, or story you want in your song</CardDescription>
								</CardHeader>
								<CardContent className="flex-1">
									<div className="space-y-3">
										<Label htmlFor="description" className="text-[#030c03] font-medium">
											Song Description
										</Label>
										<textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., A happy summer day at the beach, upbeat pop with acoustic guitar, dreamy and nostalgic..." className="w-full h-80 bg-white/80 border border-[#8fd1e3]/40 rounded-lg p-4 text-[#030c03] placeholder:text-[#030c03]/50 focus:border-[#3fd342] focus:outline-none resize-none shadow-sm" />
										<div className="text-sm text-[#030c03]/50 text-right">{description.length}/500 characters</div>
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Generate Button */}
						{recordedVideo && (
							<div className="mt-6">
								<Button onClick={handleSubmit} disabled={!recordedVideo || isGenerating} size="lg" className="w-full bg-gradient-to-r from-[#3fd342] to-[#668bd9] hover:from-[#3fd342]/80 hover:to-[#668bd9]/80 text-white py-4 text-lg font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
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

								<p className="text-[#030c03]/60 text-sm text-center mt-3">Ready to create your unique song!</p>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

export default CreatePage;
