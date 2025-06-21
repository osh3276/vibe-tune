"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Music, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
	const [showPassword, setShowPassword] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const router = useRouter();
	const supabase = createClient();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setError("");

		try {
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});

			if (error) {
				setError(error.message);
			} else {
				router.push("/dashboard");
				router.refresh();
			}
		} catch (err) {
			setError("An unexpected error occurred");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-[#f9f9f7] to-[#f4f3ef] flex items-center justify-center p-6">
			<div className="w-full max-w-md">
				{/* Logo */}
				<div className="text-center mb-8">
					<div className="flex items-center justify-center space-x-2 mb-4">
						<Music className="h-10 w-10 text-[#3fd342]" />
						<span className="text-3xl font-bold text-[#030c03]">
							VibeTune
						</span>
					</div>
					<p className="text-[#030c03]/60">
						Welcome back to your music creation journey
					</p>
				</div>

				{/* Login Form */}
				<Card className="bg-white/80 border-[#8fd1e3]/30 backdrop-blur-sm shadow-lg">
					<CardHeader className="space-y-1">
						<CardTitle className="text-2xl text-[#030c03] text-center">
							Sign In
						</CardTitle>
						<CardDescription className="text-[#030c03]/60 text-center">
							Enter your credentials to access your account
						</CardDescription>
					</CardHeader>
					<CardContent>
						{error && (
							<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
								<p className="text-red-600 text-sm">{error}</p>
							</div>
						)}

						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="space-y-2">
								<Label
									htmlFor="email"
									className="text-[#030c03]"
								>
									Email
								</Label>
								<Input
									id="email"
									type="email"
									placeholder="Enter your email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									className="bg-white/50 border-[#8fd1e3]/50 text-[#030c03] placeholder:text-[#030c03]/50 focus:border-[#3fd342] focus:ring-[#3fd342]"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label
									htmlFor="password"
									className="text-[#030c03]"
								>
									Password
								</Label>
								<div className="relative">
									<Input
										id="password"
										type={
											showPassword ? "text" : "password"
										}
										placeholder="Enter your password"
										value={password}
										onChange={(e) =>
											setPassword(e.target.value)
										}
										className="bg-white/50 border-[#8fd1e3]/50 text-[#030c03] placeholder:text-[#030c03]/50 focus:border-[#3fd342] focus:ring-[#3fd342] pr-10"
										required
									/>
									<button
										type="button"
										onClick={() =>
											setShowPassword(!showPassword)
										}
										className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#030c03]/60 hover:text-[#030c03]"
									>
										{showPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
									</button>
								</div>
							</div>

							<div className="flex items-center justify-between">
								<Link
									href="/forgot-password"
									className="text-sm text-[#668bd9] hover:text-[#668bd9]/80"
								>
									Forgot password?
								</Link>
							</div>

							<Button
								type="submit"
								className="w-full bg-[#3fd342] hover:bg-[#3fd342]/80 text-[#030c03]"
								disabled={loading}
							>
								{loading ? "Signing In..." : "Sign In"}
							</Button>
						</form>

						<div className="mt-6 text-center">
							<p className="text-[#030c03]/60">
								Don't have an account?{" "}
								<Link
									href="/signup"
									className="text-[#668bd9] hover:text-[#668bd9]/80 font-medium"
								>
									Sign up
								</Link>
							</p>
						</div>

						{/* Back to home link moved below sign up, aligned left */}
						<div className="mt-4 text-left">
							<Link
								href="/"
								className="inline-flex items-center text-[#030c03]/70 hover:text-[#030c03] transition-colors"
							>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back to Home
							</Link>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
