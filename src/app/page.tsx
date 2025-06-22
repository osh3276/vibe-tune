"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Music, Video, Sparkles, Play, ArrowRight, LogOut } from "lucide-react";
import AlbumGrid from "@/components/AlbumGrid";
import { useAuth } from "@/lib/auth";
import { musicApi, handleApiError } from "@/lib/axios";

export default function Home() {
	const [prompt, setPrompt] = useState("");
	const [negativeTags, setNegativeTags] = useState("");
	const [generating, setGenerating] = useState(false);
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
	const [audioUrl, setAudioUrl] = useState<string>("");
	const [audioMetadata, setAudioMetadata] = useState<{
		duration: number;
		sampleRate: number;
		channels: number;
	} | null>(null);
	const [showMainContent, setShowMainContent] = useState(false);
	const { user, loading, signOut } = useAuth();
	const router = useRouter();
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 0);
		window.addEventListener("scroll", onScroll);
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	const generateMusic = async (e: React.FormEvent) => {
		e.preventDefault();
		setGenerating(true);
		setAudioBlob(null);
		setAudioUrl("");
		setAudioMetadata(null);

		try {
			const result = await musicApi.generateMusic({
				prompt: prompt.trim(),
				negativeTags: negativeTags.trim() || undefined,
			});

			const url = URL.createObjectURL(result.audioBlob);

			setAudioBlob(result.audioBlob);
			setAudioUrl(url);
			setAudioMetadata({
				duration: result.duration,
				sampleRate: result.sampleRate,
				channels: result.channels,
			});

			alert("Song generated successfully!");
		} catch (err) {
			console.error("Generation error:", err);
			const errorMessage = handleApiError(err);
			alert(`Error: ${errorMessage}`);
		} finally {
			setGenerating(false);
		}
	};
	// Redirect authenticated users to dashboard
	useEffect(() => {
		if (!loading && user) {
			router.push("/dashboard");
		}
	}, [user, loading, router]);

	// Optimized callback to prevent unnecessary re-renders
	const handleAnimationComplete = useCallback(() => {
		setShowMainContent(true);
	}, []);

	// Show loading state while checking auth
	if (loading) {
		return (
			<div className="min-h-screen bg-[#fcf8f2] flex items-center justify-center">
				<div className="text-center">
					<div className="w-8 h-8 border-4 border-[#3fd342] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-[#030c03]/60">Loading...</p>
				</div>
			</div>
		);
	}

	// Don't render landing page for authenticated users
	if (user) {
		return null; // Will redirect in useEffect
	}

	const downloadAudio = () => {
		if (audioBlob) {
			const link = document.createElement("a");
			link.href = audioUrl;
			link.download = `generated-song-${Date.now()}.wav`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		}
	};

	return (
		<div className="min-h-screen bg-[#fcf8f2] relative font-inter">
			{/* Animated Album Grid Background - Always visible initially */}
			<AlbumGrid onAnimationComplete={handleAnimationComplete} />

			{/* Main Content - Only show after animation is complete */}
			{showMainContent && (
				<div className="relative z-10 border-black">
					{/* Hero Section - First to appear */}
					<motion.section
						className="px-6 py-20 pt-32 text-center"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.6,
							delay: 0.1,
							ease: "easeOut",
						}}
					>
						<div className="max-w-4xl mt-10 mx-auto flex flex-col items-center self-stretch">
							<h1 className="text-8xl mb-6 text-[#030c03] tracking-tight font-semibold font-display">
								Turn Moments into{" "}
								<span className="bg-gradient-to-r from-[#3fd342] to-[#668bd9] bg-clip-text text-transparent">
									{" "}
									Unforgettable Songs
								</span>
							</h1>
							<p className="pt-3 text-lg mb-8 max-w-4xl mx-auto">
								Record a short video and let AI generate a
								unique song just fit for your vibe.
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<Link href="/create">
									<Button
										size="lg"
										className="bg-[#3fd342] hover:bg-[#3fd342]/80 text-[#030c03] px-8 py-3 text-lg"
									>
										<Video className="mr-2 h-5 w-5" />
										Start Creating
									</Button>
								</Link>
								<Link href="/demo">
									<Button
										size="lg"
										variant="outline"
										className="border-transparent text-[#fcf8f2] hover:text-[#030c03] hover:bg-[#8fd1e3] px-8 py-3 text-lg bg-[#668bd9]"
									>
										<Play className="mr-2 h-5 w-5" />
										Watch Demo
									</Button>
								</Link>
							</div>
						</div>
					</motion.section>

					{/* Features Section - Second to appear */}
					<motion.section
						className="px-6 py-10"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.6,
							delay: 0.4,
							ease: "easeOut",
						}}
					>
						<div className="max-w-6xl mx-auto">
							<h2 className="text-6xl md:text-6xl font-bold text-[#030c03] text-center mb-12 font-display">
								How It Works
							</h2>
							<div className="grid md:grid-cols-3 gap-8">
								<Card className="bg-white/80 border-[#8fd1e3]/30 backdrop-blur-sm shadow-lg hover:transform hover:translate-y-2 transition-transform duration-300">
									<CardHeader>
										<div className="w-12 h-12 bg-[#3fd342] rounded-lg flex items-center justify-center mb-4">
											<Video className="h-6 w-6 text-[#030c03]" />
										</div>
										<CardTitle className="text-[#030c03] my-3">
											1. Record Video
										</CardTitle>
										<CardDescription className="text-[#030c03]/70 mt-2">
											Capture a short video using your
											camera. Express your mood, tell a
											story, or be yourself.
										</CardDescription>
									</CardHeader>
								</Card>

								<Card className="bg-white/80 border-[#8fd1e3]/30 backdrop-blur-sm shadow-lg hover:transform hover:translate-y-2 transition-transform duration-300">
									<CardHeader>
										<div className="w-12 h-12 bg-[#668bd9] rounded-lg flex items-center justify-center mb-4">
											<Sparkles className="h-6 w-6 text-white" />
										</div>
										<CardTitle className="text-[#030c03] my-3">
											2. Add Context
										</CardTitle>
										<CardDescription className="text-[#030c03]/70 mt-2">
											Optionally add text descriptions to
											give the AI more context about your
											vision.
										</CardDescription>
									</CardHeader>
								</Card>

								<Card className="bg-white/80 border-[#8fd1e3]/30 backdrop-blur-sm shadow-lg hover:transform hover:translate-y-2 transition-transform duration-300">
									<CardHeader>
										<div className="w-12 h-12 bg-[#8fd1e3] rounded-lg flex items-center justify-center mb-4">
											<Music className="h-6 w-6 text-[#030c03]" />
										</div>
										<CardTitle className="text-[#030c03] my-3">
											3. Get Your Song
										</CardTitle>
										<CardDescription className="text-[#030c03]/70 mt-2">
											Our AI analyzes your content and
											generates a unique song that matches
											your vibe and style.
										</CardDescription>
									</CardHeader>
								</Card>
							</div>
						</div>
					</motion.section>

				{audioUrl && (
					<div className="bg-white p-6 rounded-lg shadow-md">
						<h3 className="text-xl font-semibold mb-4 text-gray-800">
							Your Generated Song
						</h3>
						<div className="space-y-4">
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700">
								<div>
									<strong>Duration:</strong>{" "}
									{audioMetadata?.duration
										? `${audioMetadata.duration.toFixed(1)}s`
										: "Unknown"}
								</div>
								<div>
									<strong>Sample Rate:</strong>{" "}
									{audioMetadata?.sampleRate
										? `${audioMetadata.sampleRate} Hz`
										: "Unknown"}
								</div>
								<div>
									<strong>Channels:</strong>{" "}
									{audioMetadata?.channels === 1
										? "Mono"
										: audioMetadata?.channels === 2
											? "Stereo"
											: audioMetadata?.channels ||
												"Unknown"}
								</div>
							</div>

							<div className="border-t pt-4">
								<div className="mb-3">
									<strong className="text-gray-800">
										Prompt:
									</strong>
									<p className="text-gray-600 mt-1">
										{prompt}
									</p>
								</div>
								{negativeTags && (
									<div className="mb-3">
										<strong className="text-gray-800">
											Negative Prompt:
										</strong>
										<p className="text-gray-600 mt-1">
											{negativeTags}
										</p>
									</div>
								)}
							</div>

							<div className="flex items-center gap-3">
								<audio controls className="flex-1">
									<source src={audioUrl} type="audio/wav" />
									Your browser does not support audio
									playback.
								</audio>
								<button
									onClick={downloadAudio}
									className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 text-sm whitespace-nowrap"
								>
									Download WAV
								</button>
							</div>
						</div>
					</div>
				)}

					{/* CTA Section - Third to appear */}
					<motion.section
						className="px-6 pt-10 pb-20"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.6,
							delay: 0.7,
							ease: "easeOut",
						}}
					>
						<div className="max-w-4xl mx-auto text-center">
							<Card className="bg-gradient-to-r from-[#3fd342]/20 to-[#668bd9]/20 border-[#8fd1e3]/30 backdrop-blur-sm">
								<CardContent className="p-12">
									<h2 className="text-5xl md:text-5xl font-bold text-[#030c03] mb-4 font-display">
										Ready to Create Your First Song?
									</h2>
									<p className="text-xl text-[#030c03]/70 mb-8 mt-6">
										Join thousands of creators who are
										turning their moments into music.
									</p>
									<Link href="/create">
										<Button
											size="lg"
											className="bg-[#3fd342] text-[#030c03] hover:bg-[#3fd342]/80 px-8 py-3 text-lg"
										>
											Start Creating Now
											<ArrowRight className="ml-2 h-5 w-5" />
										</Button>
									</Link>
								</CardContent>
							</Card>
						</div>
					</motion.section>

					{/* Footer - Fourth to appear */}
					<motion.footer
						className="px-6 py-12 border-t border-black/30"
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.6,
							delay: 1.0,
							ease: "easeOut",
						}}
					>
						<div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center">
							<div className="flex items-center space-x-2 mb-4 md:mb-0">
								<Music className="h-6 w-6 text-[#3fd342]" />
								<span className="text-xl font-semibold text-[#030c03]">
									VibeTune
								</span>
							</div>
							<div className="flex space-x-6 text-[#030c03]/70">
								<Link
									href="/privacy"
									className="hover:text-[#3fd342] transition-colors"
								>
									Privacy
								</Link>
								<Link
									href="/terms"
									className="hover:text-[#3fd342] transition-colors"
								>
									Terms
								</Link>
								<Link
									href="/contact"
									className="hover:text-[#3fd342] transition-colors"
								>
									Contact
								</Link>
							</div>
						</div>
					</motion.footer>

					{/* Navigation - Last to appear */}
					<motion.nav
						className={`fixed top-0 left-0 right-0 z-50 p-6 bg-[#fcf8f2]/90 backdrop-blur-sm transition-all duration-200 ${
							scrolled
								? " border-b border-black/20"
								: "border-transparent"
						}`}
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.6,
							delay: 1.3,
							ease: "easeOut",
						}}
					>
						<div className="flex justify-between items-center max-w-5xl mx-auto">
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
							<div className="flex items-center space-x-4">
								<Link href="/login">
									<Button
										variant="ghost"
										className="text-[#030c03] hover:bg-[#030c03]/10"
									>
										Login
									</Button>
								</Link>
								<Link href="/signup">
									<Button className="bg-[#3fd342] hover:bg-[#3fd342]/80 text-black">
										Get Started
									</Button>
								</Link>
							</div>
						</div>
					</motion.nav>
				</div>
			)}
		</div>
	);
}
