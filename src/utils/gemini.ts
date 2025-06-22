import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.0-flash";

// Utility function to convert video blob to base64
export function videoBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:video/mp4;base64,")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function processVideoWithGemini(
  videoFile: File,
  userText?: string,
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Missing Gemini API Key");
  }

  // Node.js/server: Read the file as base64 using Buffer
  const arrayBuffer = await videoFile.arrayBuffer();
  const videoBase64 = Buffer.from(arrayBuffer).toString("base64");

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL,
    systemInstruction: buildSystemInstruction()
  });

  try {
    console.log("Sending video to Gemini, base64 length:", videoBase64.length);
    console.log("User text:", userText);

    // Generate detailed music prompt based on video analysis
    let content: any[] = [
      {
        inlineData: {
          mimeType: videoFile.type || "video/webm",
          data: videoBase64,
        },
      },
    ];

    // Add user text if provided
    if (userText && userText.trim()) {
      content.unshift({
        text: `User's musical description: ${userText}`,
      });
    }

    // Retry logic for Gemini API
    let lastError;
    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Gemini API attempt ${attempt}/${maxRetries} (with video)`);

        const result = await model.generateContent(content);
        const response = await result.response;
        console.log("Gemini response received successfully");
        const rawResponse = response.text();
        console.log("Original Gemini response:", rawResponse);
        console.log("Gemini prompt:", rawResponse);
        return rawResponse;
      } catch (error: any) {
        lastError = error;
        console.error(`Gemini API error (attempt ${attempt}):`, error);

        // If it's a rate limit or temporary error, wait before retrying
        if (
          attempt < maxRetries &&
          (error.status === 500 ||
            error.status === 429 ||
            error.message?.includes("Internal Server Error") ||
            error.message?.includes("internal error"))
        ) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Retrying after ${waitTime}ms...`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          continue;
        }

        // If it's a different error or we've exhausted retries, break
        break;
      }
    }

    // If video processing failed, try text-only mode
    if (userText && userText.trim()) {
      console.log("Video processing failed, trying text-only mode...");
      try {
        const textOnlyContent = [
          {
            text: `Create a detailed song description based on this user input: "${userText}". Include genre, tempo, mood, instruments, and song structure. Be specific and creative.`,
          },
        ];

        const textResult = await model.generateContent(textOnlyContent);
        const textResponse = await textResult.response;
        console.log("Text-only Gemini response received successfully");
        const rawTextResponse = textResponse.text();
        console.log("Original text-only Gemini response:", rawTextResponse);
        console.log("Gemini prompt:", rawTextResponse);
        return rawTextResponse;
      } catch (textError) {
        console.error("Text-only Gemini call also failed:", textError);
      }
    }

    // If we get here, all attempts failed
    console.error("All Gemini API attempts failed:", lastError);

    // Provide a fallback response instead of throwing an error
    if (userText && userText.trim()) {
      console.log("Using fallback based on user text");
      const userLower = userText.toLowerCase();
      if (userLower.includes('trap')) {
        return 'Aggressive trap beat at 140 BPM. Heavy 808 bassline with hard-hitting kick and snare patterns. Use distorted synth leads and dark, gritty sound design for an intense mood. Add ad-libs and vocal chops with heavy autotune and aggressive mixing for a sinister tone.';
      }
      if (userLower.includes('rock')) {
        return 'Energetic rock song at 140 BPM with driving electric guitar power chords, punchy drum kit with snare on beats 2 and 4, distorted bass guitar, and powerful lead vocals. Heavy guitar solos with wah pedal, arena-style production with wide reverb, and anthemic chorus sections.';
      }
      if (userLower.includes('jazz')) {
        return 'Smooth jazz ballad at 90 BPM featuring grand piano with rich chord voicings, upright bass walking lines, brush drums with subtle swing, and warm tenor saxophone melodies. Sophisticated harmonic progressions with intimate recording and natural room ambience.';
      }
      return `${userText} song with detailed instrumentation, professional production, and engaging musical arrangements. Modern mixing with balanced dynamics and contemporary sound design.`;
    } else {
      console.log("Using generic fallback");
      return "Upbeat contemporary song at 120 BPM with catchy melodies, rhythmic instrumentation, modern production techniques, and engaging musical arrangements. Balanced mix with dynamic energy and professional sound quality.";
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    // Provide a fallback response instead of throwing an error
    if (userText && userText.trim()) {
      console.log("Using fallback based on user text due to catch block");
      const userLower = userText.toLowerCase();
      if (userLower.includes('trap')) {
        return 'Aggressive trap beat at 140 BPM. Heavy 808 bassline with hard-hitting kick and snare patterns. Use distorted synth leads and dark, gritty sound design for an intense mood. Add ad-libs and vocal chops with heavy autotune and aggressive mixing for a sinister tone.';
      }
      if (userLower.includes('rock')) {
        return 'Energetic rock song at 140 BPM with driving electric guitar power chords, punchy drum kit with snare on beats 2 and 4, distorted bass guitar, and powerful lead vocals. Heavy guitar solos with wah pedal, arena-style production with wide reverb, and anthemic chorus sections.';
      }
      if (userLower.includes('jazz')) {
        return 'Smooth jazz ballad at 90 BPM featuring grand piano with rich chord voicings, upright bass walking lines, brush drums with subtle swing, and warm tenor saxophone melodies. Sophisticated harmonic progressions with intimate recording and natural room ambience.';
      }
      return `${userText} song with detailed instrumentation, professional production, and engaging musical arrangements. Modern mixing with balanced dynamics and contemporary sound design.`;
    } else {
      console.log("Using generic fallback due to catch block");
      return "Upbeat contemporary song at 120 BPM with catchy melodies, rhythmic instrumentation, modern production techniques, and engaging musical arrangements. Balanced mix with dynamic energy and professional sound quality.";
    }
  }
}

function buildSystemInstruction(): string {
  return `
You are a music prompt generator for Lyria AI. Create detailed, comprehensive music prompts that capture exactly what you see in the video.

GUIDELINES:
- Generate detailed music descriptions with specific technical elements
- Include: genre, BPM, instruments, production techniques, mixing style, vocal style
- Be specific about sound design, effects, and musical arrangements
- Describe energy, mood, and musical progression
- Use professional music production terminology

EXAMPLE OUTPUTS:
"Aggressive trap beat at 140 BPM. Heavy 808 bassline with hard-hitting kick and snare patterns. Use distorted synth leads and dark, gritty sound design for an intense mood. Add ad-libs and vocal chops with heavy autotune and aggressive mixing for a sinister tone."

"Upbeat indie pop song at 128 BPM with jangly electric guitar arpeggios, warm analog synth pads, steady four-on-the-floor kick drum, and bright vocals with slight reverb. Major key progression with nostalgic summer vibes, layered harmonies in the chorus, and a driving bassline."

"Mellow lo-fi hip hop at 85 BPM featuring dusty vinyl samples, warm jazz piano chords, subtle vinyl crackle, laid-back drum loop with soft kick and snare, and atmospheric pad textures. Dreamy and nostalgic mood with tape saturation and analog warmth."

Analyze the video for movement, energy, and emotion, then create a comprehensive musical description that includes all technical details needed for high-quality music generation.
  `;
}