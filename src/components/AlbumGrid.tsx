"use client";

/**
 * AlbumGrid Component - Full Viewport Carousel Rows with Flip Animation
 *
 * Each row moves horizontally like a carousel, albums flip down to white, then main content fades in
 */

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import { albumConfig } from "@/lib/albumConfig";

interface AlbumGridProps {
	className?: string;
	onAnimationComplete?: () => void;
}

export default function AlbumGrid({
	className = "",
	onAnimationComplete,
}: AlbumGridProps) {
	const [mounted, setMounted] = useState(false);
	const [startFlip, setStartFlip] = useState(false);
	const [animationComplete, setAnimationComplete] = useState(false);

	useEffect(() => {
		setMounted(true);

		// Show carousel for 2.5 seconds, then start flipping
		const flipTimer = setTimeout(() => {
			setStartFlip(true);
		}, 2500);

		// Complete animation timing for perfect sync
		// 2.5s carousel + row cascade (4 * 0.06s) + album cascade (12 * 0.012s) + flip duration (0.35s)
		// = 2.5s + 0.24s + 0.144s + 0.35s = 3.234s total, trigger at 3.2s for tight sync
		const completeTimer = setTimeout(() => {
			setAnimationComplete(true);
			onAnimationComplete?.();
		}, 3200); // Optimized timing for reduced cascade pattern

		return () => {
			clearTimeout(flipTimer);
			clearTimeout(completeTimer);
		};
	}, [onAnimationComplete]);

	// Generate extended array of album numbers for seamless scrolling
	// ULTRA-OPTIMIZED: Minimal repetition with memoization
	const generateRowAlbums = (rowIndex: number) => {
		// Rows 0,1 use albums 1-25, Rows 2,3 use albums 26-50
		const baseOffset = rowIndex >= 2 ? 25 : 0;
		const baseAlbums = Array.from(
			{ length: 20 },
			(_, i) => i + 1 + baseOffset,
		); // Reduced to 20 albums per row
		// Single repetition for minimal DOM nodes
		const extendedAlbums = [...baseAlbums, ...baseAlbums.slice(0, 10)]; // 30 total per row
		return extendedAlbums.map((num, index) => ({
			id: `${rowIndex}-${index}`,
			albumNumber: num,
			// Simplified cascade calculation
			globalIndex: rowIndex * 12 + (index % 12),
		}));
	};

	const rows = Array.from({ length: 4 }, (_, i) => generateRowAlbums(i));

	if (!mounted) {
		return null;
	}

	return (
		<motion.div
			className={`fixed inset-0 w-screen h-screen  overflow-hidden perspective-1000 album-carousel-container album-grid-optimized ${className}`}
			initial={{ opacity: 1 }}
			animate={{ opacity: animationComplete ? 0 : 1 }}
			transition={{
				duration: 0.4,
				ease: "easeOut",
				delay: animationComplete ? 0 : 0, // No delay on fade out for instant sync
			}}
		>
			<div className="h-full w-full flex flex-col justify-center py-4 sm:py-6 md:py-8">
				{rows.map((rowAlbums, rowIndex) => {
					// Alternate direction for each row for more dynamic movement
					const isReverse = rowIndex % 2 === 1;
					const moveDistance = -1200; // Optimized for fewer albums

					return (
						<div
							key={rowIndex}
							className="flex-1 min-h-0 overflow-hidden carousel-row carousel-row-optimized flex items-center"
						>
							<motion.div
								className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-5 hw-accel infinite-scroll"
								style={{
									width: "max-content",
									height: "100%",
									// Enhanced GPU layer optimizations
									transform: "translate3d(0, 0, 0)",
									willChange: "transform",
									contain: "layout style paint",
								}}
								animate={{
									x: isReverse
										? [moveDistance, 0] // Right to left
										: [0, moveDistance], // Left to right
								}}
								transition={{
									x: {
										duration: 12 + rowIndex * 1.2, // Faster and more consistent: 12s, 13.2s, 14.4s, 15.6s
										ease: "linear",
										repeat: Infinity,
										repeatType: "loop",
									},
								}}
							>
								{rowAlbums.map((album) => (
									<motion.div
										key={album.id}
										className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-50 xl:h-50 preserve-3d smooth-flip"
										style={{
											// Enhanced GPU acceleration
											transform: "translate3d(0, 0, 0)",
											backfaceVisibility: "hidden",
											contain: "layout",
										}}
										initial={{
											rotateX: 0,
											opacity: 1,
											scale: 1,
										}}
										animate={{
											rotateX: startFlip ? 180 : 0,
										}}
										transition={{
											rotateX: {
												duration: 0.35, // Slightly faster flip
												delay: startFlip
													? rowIndex * 0.06 +
														(album.globalIndex %
															12) *
															0.012
													: 0, // Optimized timing for fewer albums
												ease: "easeOut",
											},
										}}
										// Minimal hover effect for best performance
										whileHover={
											!startFlip
												? {
														scale: 1.02,
														transition: {
															duration: 0.08,
															ease: "easeOut",
														},
													}
												: {}
										}
									>
										{/* Front side - Enhanced colorful album */}
										<div className="absolute inset-0 backface-hidden">
											<AlbumCover
												albumNumber={album.albumNumber}
											/>
										</div>

										{/* Back side - Pure white background that blends seamlessly */}
										<div className="absolute inset-0 backface-hidden rotate-x-180 bg-[#fcf8f2] rounded-md sm:rounded-lg md:rounded-xl" />
									</motion.div>
								))}
							</motion.div>
						</div>
					);
				})}
			</div>
		</motion.div>
	);
}

interface AlbumCoverProps {
	albumNumber: number;
}

function AlbumCover({ albumNumber }: AlbumCoverProps) {
	const [imageError, setImageError] = useState(false);
	const [imageLoaded, setImageLoaded] = useState(false);

	// Simplified - only try JPG format for better performance
	const getImageSrc = () => {
		return `${albumConfig.basePath}album-${albumNumber}.jpg`;
	};

	const handleImageError = () => {
		setImageError(true);
	};

	const handleImageLoad = () => {
		setImageLoaded(true);
	};

	// Optimized reset with useCallback equivalent
	useEffect(() => {
		setImageError(false);
		setImageLoaded(false);
	}, [albumNumber]);

	// Show image if loaded successfully, otherwise show minimal fallback
	if (!imageError) {
		return (
			<div className="w-full h-full relative rounded-lg md:rounded-xl overflow-hidden">
				<Image
					src={getImageSrc()}
					alt="" // Empty alt for decorative images reduces accessibility tree
					fill
					className="object-cover"
					onError={handleImageError}
					onLoad={handleImageLoad}
					priority={albumNumber <= 3} // Only prioritize first 3 images
					quality={65} // Further reduced quality for better performance
					placeholder="empty"
					sizes="(max-width: 640px) 80px, (max-width: 768px) 96px, (max-width: 1024px) 128px, (max-width: 1280px) 144px, 160px"
					unoptimized={false} // Ensure Next.js optimization
				/>
				{/* Ultra-minimal loading state */}
				{!imageLoaded && (
					<div className="absolute inset-0 bg-gray-50" />
				)}
			</div>
		);
	}

	// Ultra-minimal fallback
	return (
		<div className="w-full h-full bg-gray-100 rounded-lg md:rounded-xl" />
	);
}
