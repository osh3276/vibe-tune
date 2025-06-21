import type { Metadata } from "next";
import { Geist, Geist_Mono, Playfair_Display, Inter } from "next/font/google";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
	variable: "--font-playfair",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
	title: "VibeTune - Create Music from Your Videos",
	description: "Record a short video, add context, and let AI generate a unique song just for you. Turn your moments into music with VibeTune.",
	keywords: ["AI music", "video to music", "song generation", "music creation", "AI audio"],
	authors: [{ name: "VibeTune Team" }],
	openGraph: {
		title: "VibeTune - Create Music from Your Videos",
		description: "Record a short video, add context, and let AI generate a unique song just for you.",
		type: "website",
		locale: "en_US",
	},
	twitter: {
		card: "summary_large_image",
		title: "VibeTune - Create Music from Your Videos",
		description: "Record a short video, add context, and let AI generate a unique song just for you.",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark">
			<body className={`${playfairDisplay.variable} ${inter.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}>
				<AuthProvider>
					{children}
				</AuthProvider>
			</body>
		</html>
	);
}
