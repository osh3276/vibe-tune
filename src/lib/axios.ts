import axios from "axios";

// Create axios instance with default configuration
const apiClient = axios.create({
	baseURL:
		process.env.NODE_ENV === "production" ? "" : "http://localhost:3000",
	timeout: 300000, // 5 minutes timeout for music generation
	headers: {
		"Content-Type": "application/json",
	},
});

// Request interceptor
apiClient.interceptors.request.use(
	(config) => {
		// Log request details in development
		if (process.env.NODE_ENV === "development") {
			console.log(
				`Making ${config.method?.toUpperCase()} request to ${config.url}`,
			);
		}
		return config;
	},
	(error) => {
		console.error("Request error:", error);
		return Promise.reject(error);
	},
);

// Response interceptor
apiClient.interceptors.response.use(
	(response) => {
		// Log response details in development
		if (process.env.NODE_ENV === "development") {
			console.log(`Response from ${response.config.url}:`, {
				status: response.status,
				contentType: response.headers["content-type"],
				size: response.headers["content-length"],
			});
		}
		return response;
	},
	(error) => {
		// Enhanced error handling
		if (axios.isAxiosError(error)) {
			const { response, request, message } = error;

			if (response) {
				// Server responded with error status
				console.error("API Error Response:", {
					status: response.status,
					statusText: response.statusText,
					data: response.data,
					url: response.config?.url,
				});
			} else if (request) {
				// Request made but no response received
				console.error("No response received:", {
					url: request.url || error.config?.url,
					timeout: error.code === "ECONNABORTED",
				});
			} else {
				// Something else happened
				console.error("Request setup error:", message);
			}
		} else {
			console.error("Non-Axios error:", error);
		}

		return Promise.reject(error);
	},
);

// Specific API functions
export const musicApi = {
	/**
	 * Generate music using the Lyria-002 model
	 */
	async generateMusic(params: {
		prompt: string;
		negativeTags?: string;
	}): Promise<{
		audioBlob: Blob;
		duration: number;
		sampleRate: number;
		channels: number;
	}> {
		try {
			const response = await apiClient.post("/api/generate", params, {
				responseType: "blob",
				onUploadProgress: (progressEvent) => {
					if (process.env.NODE_ENV === "development") {
						console.log(
							"Upload progress:",
							Math.round(
								(progressEvent.loaded * 100) /
									(progressEvent.total || 1),
							),
						);
					}
				},
			});

			// Extract metadata from headers
			const duration = parseFloat(
				response.headers["x-audio-duration"] || "0",
			);
			const sampleRate = parseInt(
				response.headers["x-audio-sample-rate"] || "0",
			);
			const channels = parseInt(
				response.headers["x-audio-channels"] || "0",
			);

			return {
				audioBlob: response.data,
				duration,
				sampleRate,
				channels,
			};
		} catch (error) {
			if (axios.isAxiosError(error)) {
				// Handle specific error cases
				if (error.code === "ECONNABORTED") {
					throw new Error(
						"Music generation timed out. Please try again.",
					);
				}

				if (error.response?.status === 400) {
					throw new Error(
						error.response.data?.error ||
							"Invalid request parameters",
					);
				}

				if (error.response?.status === 401) {
					throw new Error(
						"Authentication failed. Please check your API credentials.",
					);
				}

				if (error.response?.status === 429) {
					throw new Error(
						"Rate limit exceeded. Please wait before trying again.",
					);
				}

				if (error.response && error.response.status >= 500) {
					throw new Error("Server error. Please try again later.");
				}

				throw new Error(
					error.response?.data?.error || "Failed to generate music",
				);
			}

			throw error;
		}
	},
};

// Helper functions for error handling
export const handleApiError = (error: unknown): string => {
	if (axios.isAxiosError(error)) {
		if (error.response?.data?.error) {
			return error.response.data.error;
		}

		switch (error.response?.status) {
			case 400:
				return "Invalid request. Please check your input.";
			case 401:
				return "Authentication failed.";
			case 403:
				return "Access forbidden.";
			case 404:
				return "Resource not found.";
			case 429:
				return "Too many requests. Please wait before trying again.";
			case 500:
				return "Server error. Please try again later.";
			default:
				return "An unexpected error occurred.";
		}
	}

	if (error instanceof Error) {
		return error.message;
	}

	return "An unknown error occurred.";
};

export default apiClient;
