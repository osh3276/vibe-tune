import { NextRequest, NextResponse } from "next/server";
import { GoogleAuth } from "google-auth-library";
import decode from "audio-decode";
import axios, { AxiosResponse } from "axios";
import {processVideoWithGemini, videoBlobToBase64} from "@/utils/gemini"; // Adjust import based on your project structure

export async function POST(request: NextRequest) {
	const auth = new GoogleAuth({
		keyFile: "keys/service-account.json",
		scopes: ["https://www.googleapis.com/auth/cloud-platform"],
	});

	console.log(request);

	const client = await auth.getClient();
	const token = await client.getAccessToken();
	console.log("Access token:", token);

	try {
		// Use formData for binary uploads
		const formData = await request.formData();
		const videoFile = formData.get("video") as File;
		const userText = formData.get("userText") as string;
		const title = formData.get("title") as string;

		if (!videoFile || !title) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		// Example: read video file as ArrayBuffer (if needed for AI API)
		// const videoBuffer = Buffer.from(await videoFile.arrayBuffer());
		// If you want to use Gemini, you can call:
		// const geminiPrompt = await processVideoWithGemini(videoFile, userText);
		// console.log('Gemini prompt:', geminiPrompt);

		// Prepare payload for Google Cloud AI model
		const payload = {
			instances: [
				{
					prompt: userText,
					negative_prompt: "",
				},
			],
			parameters: {},
		};

		const response: AxiosResponse = await axios.post(
			"https://us-central1-aiplatform.googleapis.com/v1/projects/vibetune-463607/locations/us-central1/publishers/google/models/lyria-002:predict",
			payload,
			{
				headers: {
					Authorization: `Bearer ${token.token}`,
					"Content-Type": "application/json",
				},
				timeout: 300000, // 5 minutes timeout for AI generation
				validateStatus: (status) => status < 500, // Don't throw for 4xx errors
			},
		);

		// Check for HTTP errors
		if (response.status >= 400) {
			console.error(
				"Google Cloud API error:",
				response.status,
				response.data,
			);
			return NextResponse.json(
				{
					error:
						response.data?.error?.message ||
						"Failed to generate song",
				},
				{ status: response.status },
			);
		}

		const result = response.data;
		console.log("Google Cloud API response:", result);

		// Extract base64 audio data
		const base64Audio = result.predictions?.[0]?.bytesBase64Encoded;

		if (!base64Audio) {
			console.error("No base64 audio data in response:", result);
			return NextResponse.json(
				{ error: "No audio data received from AI model" },
				{ status: 500 },
			);
		}

		try {
			// Convert base64 to buffer
			const audioBuffer = Buffer.from(base64Audio, "base64");

			// Decode audio buffer to get metadata
			const audioData = await decode(audioBuffer);

			// Return the audio file directly
			return new NextResponse(audioBuffer, {
				status: 200,
				headers: {
					"Content-Type": "audio/wav",
					"Content-Disposition": `attachment; filename=\"generated-song-${Date.now()}.wav\"`,
					"Content-Length": audioBuffer.length.toString(),
					"X-Audio-Duration": audioData.duration.toString(),
					"X-Audio-Sample-Rate": audioData.sampleRate.toString(),
					"X-Audio-Channels": audioData.numberOfChannels.toString(),
				},
			});
		} catch (decodeError) {
			console.error("Failed to decode audio:", decodeError);
			return NextResponse.json(
				{ error: "Failed to decode audio data" },
				{ status: 500 },
			);
		}
	} catch (error) {
		console.error("Generate API error:", error);

		if (axios.isAxiosError(error)) {
			// Handle specific axios errors
			if (error.code === "ECONNABORTED") {
				return NextResponse.json(
					{
						error: "Request timeout - music generation took too long",
					},
					{ status: 408 },
				);
			}

			if (error.response) {
				console.error("Axios error details:", error.response.data);
				return NextResponse.json(
					{
						error:
							error.response.data?.error?.message ||
							error.response.data?.error ||
							"Failed to generate song",
					},
					{ status: error.response.status },
				);
			}

			if (error.request) {
				return NextResponse.json(
					{ error: "Failed to connect to AI service" },
					{ status: 503 },
				);
			}
		}

		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
