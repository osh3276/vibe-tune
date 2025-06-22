"use client";

import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Music, LogOut, Video, Plus } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
	const { user, loading, signOut } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (!loading && !user) {
			router.push("/login");
		}
	}, [user, loading, router]);

	if (loading) {
		return (
			<div className="min-h-screen bg-white flex items-center justify-center">
				<div className="text-center">
					<div className="w-8 h-8 border-4 border-[#3fd342] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-[#030c03]/60">Loading...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return null; // Will redirect in useEffect
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#f9f9f7] to-[#f4f3ef] font-inter bg-[#fcf8f2]">
			{/* Navigation */}
			<nav className="bg-white/80 backdrop-blur-sm border-b border-[#8fd1e3]/20 px-6 py-4">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<Music className="h-8 w-8 text-[#3fd342]" />
						<span className="text-2xl font-bold text-[#030c03]">VibeTune</span>
					</div>
					<div className="flex items-center space-x-4">
						<span className="text-sm text-[#030c03]/70">Welcome, {user.user_metadata?.first_name || user.user_metadata?.full_name || user.email?.split("@")[0]}!</span>
						<Button onClick={signOut} variant="ghost" className="text-[#030c03] hover:bg-[#030c03]/10">
							<LogOut className="h-4 w-4 mr-2" />
							Sign Out
						</Button>
					</div>
				</div>
			</nav>

			{/* Main Content */}
			<main className="max-w-7xl mx-auto px-6 py-12">
				<div className="mb-8">
					<h1 className="text-6xl font-bold text-[#030c03] mb-2 font-display">Dashboard</h1>
					<p className="text-[#030c03]/60 text-lg mt-5">Create amazing music from your videos with AI</p>
				</div>

				{/* Quick Actions */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
					{/* Left column: stacked cards */}
					<div className="flex flex-col gap-6 lg:col-span-1">
						<Card className="bg-white/80 border-[#8fd1e3]/30 hover:shadow-lg transition-shadow cursor-pointer">
							<CardHeader>
								<div className="w-12 h-12 bg-[#3fd342] rounded-lg flex items-center justify-center mb-4">
									<Video className="h-6 w-6 text-[#030c03]" />
								</div>
								<CardTitle className="text-[#030c03]">Create New Song</CardTitle>
								<CardDescription className="text-[#030c03]/70">Upload a video and let AI create your unique song</CardDescription>
							</CardHeader>
							<CardContent>
								<Link href="/create">
									<Button className="w-full bg-[#3fd342] hover:bg-[#3fd342]/80 text-[#030c03]">
										<Plus className="h-4 w-4 mr-2" />
										Start Creating
									</Button>
								</Link>
							</CardContent>
						</Card>

						<Card className="bg-white/80 border-[#8fd1e3]/30">
							<CardHeader>
								<CardTitle className="text-[#030c03]">Account</CardTitle>
								<CardDescription className="text-[#030c03]/70">Manage your account settings</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-2 text-sm">
									<p className="text-[#030c03]/80">
										<span className="font-medium">Email:</span> {user.email}
									</p>
									<p className="text-[#030c03]/80">
										<span className="font-medium">Member since:</span> {new Date(user.created_at).toLocaleDateString()}
									</p>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* Right column: Recent Activity */}
					<div className="col-span-2 flex flex-col">
						<Card className="bg-white/80 border-[#8fd1e3]/30 flex-1">
							<CardHeader>
								<CardTitle className="text-[#030c03]">Recent Activity</CardTitle>
								<CardDescription className="text-[#030c03]/70">Your latest songs and projects</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="text-center py-12">
									<Music className="h-16 w-16 text-[#030c03]/20 mx-auto mb-4" />
									<p className="text-[#030c03]/60">No activity yet. Create your first song to get started!</p>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
}
