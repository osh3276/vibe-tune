"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, Video, ArrowLeft, Play, Sparkles, Users, Clock, Star } from "lucide-react";

export default function DemoPage() {
	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
			{/* Navigation */}
			<nav className="flex items-center justify-between p-6">
				<Link href="/" className="flex items-center space-x-2 text-white hover:text-purple-300 transition-colors">
					<ArrowLeft className="h-4 w-4" />
					<span>Back to Home</span>
				</Link>
				<div className="flex items-center space-x-2">
					<Music className="h-8 w-8 text-purple-400" />
					<span className="text-2xl font-bold text-white">VibeTune</span>
				</div>
			</nav>

			<div className="max-w-6xl mx-auto px-6 py-12">
				{/* Header */}
				<div className="text-center mb-16">
					<h1 className="text-5xl md:text-6xl font-bold text-white mb-6">See VibeTune in Action</h1>
					<p className="text-xl text-gray-300 max-w-3xl mx-auto">Watch how easy it is to create music from your videos. See real examples and learn how our AI transforms your moments into beautiful songs.</p>
				</div>

				{/* Demo Video */}
				<div className="mb-16">
					<Card className="bg-white/5 border-white/10 backdrop-blur-sm">
						<CardContent className="p-8">
							<div className="aspect-video bg-black rounded-lg flex items-center justify-center">
								<div className="text-center">
									<Play className="h-16 w-16 text-purple-400 mx-auto mb-4" />
									<p className="text-white text-lg">Demo Video Coming Soon</p>
									<p className="text-gray-400">Watch the full demo of VibeTune in action</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Features Demo */}
				<div className="grid md:grid-cols-3 gap-8 mb-16">
					<Card className="bg-white/5 border-white/10 backdrop-blur-sm">
						<CardHeader>
							<div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
								<Video className="h-6 w-6 text-white" />
							</div>
							<CardTitle className="text-white">Video Recording</CardTitle>
							<CardDescription className="text-gray-300">See how easy it is to record your video with our intuitive interface</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-purple-400 rounded-full"></div>
									<span className="text-gray-300">One-click recording</span>
								</div>
								<div className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-purple-400 rounded-full"></div>
									<span className="text-gray-300">Real-time preview</span>
								</div>
								<div className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-purple-400 rounded-full"></div>
									<span className="text-gray-300">Up to 30 seconds</span>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-white/5 border-white/10 backdrop-blur-sm">
						<CardHeader>
							<div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
								<Sparkles className="h-6 w-6 text-white" />
							</div>
							<CardTitle className="text-white">AI Processing</CardTitle>
							<CardDescription className="text-gray-300">Watch our AI analyze your content and generate the perfect song</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-purple-400 rounded-full"></div>
									<span className="text-gray-300">Mood detection</span>
								</div>
								<div className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-purple-400 rounded-full"></div>
									<span className="text-gray-300">Style matching</span>
								</div>
								<div className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-purple-400 rounded-full"></div>
									<span className="text-gray-300">High-quality output</span>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card className="bg-white/5 border-white/10 backdrop-blur-sm">
						<CardHeader>
							<div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
								<Music className="h-6 w-6 text-white" />
							</div>
							<CardTitle className="text-white">Song Player</CardTitle>
							<CardDescription className="text-gray-300">Experience the final result with our advanced audio player</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								<div className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-purple-400 rounded-full"></div>
									<span className="text-gray-300">Waveform visualization</span>
								</div>
								<div className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-purple-400 rounded-full"></div>
									<span className="text-gray-300">Download options</span>
								</div>
								<div className="flex items-center space-x-2">
									<div className="w-2 h-2 bg-purple-400 rounded-full"></div>
									<span className="text-gray-300">Share functionality</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Example Results */}
				<div className="mb-16">
					<h2 className="text-3xl font-bold text-white text-center mb-8">Example Results</h2>
					<div className="grid md:grid-cols-2 gap-8">
						<Card className="bg-white/5 border-white/10 backdrop-blur-sm">
							<CardHeader>
								<CardTitle className="text-white">"Summer Beach Day"</CardTitle>
								<CardDescription className="text-gray-300">Upbeat pop with acoustic guitar and tropical vibes</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<span className="text-gray-400">Duration</span>
										<span className="text-white">2:45</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-gray-400">Genre</span>
										<span className="text-white">Pop</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-gray-400">Mood</span>
										<span className="text-white">Happy</span>
									</div>
								</div>
							</CardContent>
						</Card>

						<Card className="bg-white/5 border-white/10 backdrop-blur-sm">
							<CardHeader>
								<CardTitle className="text-white">"Night Drive"</CardTitle>
								<CardDescription className="text-gray-300">Ambient electronic with smooth synth melodies</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									<div className="flex items-center justify-between">
										<span className="text-gray-400">Duration</span>
										<span className="text-white">3:12</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-gray-400">Genre</span>
										<span className="text-white">Electronic</span>
									</div>
									<div className="flex items-center justify-between">
										<span className="text-gray-400">Mood</span>
										<span className="text-white">Chill</span>
									</div>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>

				{/* Stats */}
				<div className="grid md:grid-cols-4 gap-6 mb-16">
					<div className="text-center">
						<div className="text-3xl font-bold text-purple-400 mb-2">10K+</div>
						<div className="text-gray-300">Songs Created</div>
					</div>
					<div className="text-center">
						<div className="text-3xl font-bold text-purple-400 mb-2">5K+</div>
						<div className="text-gray-300">Happy Users</div>
					</div>
					<div className="text-center">
						<div className="text-3xl font-bold text-purple-400 mb-2">4.9</div>
						<div className="text-gray-300 flex items-center justify-center">
							<Star className="h-4 w-4 text-yellow-400 mr-1" />
							User Rating
						</div>
					</div>
					<div className="text-center">
						<div className="text-3xl font-bold text-purple-400 mb-2">30s</div>
						<div className="text-gray-300">Average Generation</div>
					</div>
				</div>

				{/* CTA */}
				<div className="text-center">
					<Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-white/20 backdrop-blur-sm">
						<CardContent className="p-12">
							<h2 className="text-3xl font-bold text-white mb-4">Ready to Create Your Own Song?</h2>
							<p className="text-xl text-gray-300 mb-8">Join thousands of creators who are turning their moments into music</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<Link href="/create">
									<Button size="lg" className="bg-white text-purple-900 hover:bg-gray-100 px-8 py-3 text-lg">
										<Sparkles className="h-5 w-5 mr-2" />
										Start Creating
									</Button>
								</Link>
								<Link href="/signup">
									<Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-3 text-lg">
										Sign Up Free
									</Button>
								</Link>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
