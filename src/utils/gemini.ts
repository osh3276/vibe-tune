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
  });

  try {
    console.log("Sending video to Gemini, base64 length:", videoBase64.length);
    console.log("User text:", userText);

    // Try a simplified approach without complex system instructions
    let content: any[] = [
      {
        text: "Analyze this video and describe what kind of music it suggests. Focus on energy level, tempo, and mood. Be concise and creative.",
      },
      {
        inlineData: {
          mimeType: videoFile.type || "video/webm",
          data: videoBase64,
        },
      },
    ];

    // Add user text if provided
    if (userText && userText.trim()) {
      content[0].text = `Analyze this video showing someone's musical expression. User's description: "${userText}". Describe what kind of song this suggests in terms of genre, tempo, energy, and mood. Be creative and specific.`;
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
        return response.text();
      } catch (error: any) {
        lastError = error;
        console.error(`Gemini API error (attempt ${attempt}):`, error);
=======
      } catch (error: unknown) {
=======
        const rawResponse = response.text();
        console.log("Original Gemini response:", rawResponse);
        console.log("Gemini prompt:", rawResponse);
        return rawResponse;
      } catch (error: any) {
        lastError = error;
        console.error(`Gemini API error (attempt ${attempt}):`, error);

        // If it's a rate limit or temporary error, wait before retrying
>>>>>>> origin/feature/saving-tracks
        if (
          typeof error === "object" && error !== null &&
          (("status" in error && (error as any).status === 500) ||
           ("status" in error && (error as any).status === 429) ||
           ("message" in error && typeof (error as any).message === "string" && ((error as any).message.includes("Internal Server Error") || (error as any).message.includes("internal error"))))
        ) {
          lastError = error;
          console.error(`Gemini API error (attempt ${attempt}):`, error);
>>>>>>> Stashed changes

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
        return textResponse.text();
      } catch (textError) {
        console.error("Text-only Gemini call also failed:", textError);
      }
    }

    // If we get here, all attempts failed
    console.error("All Gemini API attempts failed:", lastError);

    // Provide a fallback response instead of throwing an error
    if (userText && userText.trim()) {
      console.log("Using fallback based on user text");
      return `Create a song with the following characteristics: ${userText}. Style: modern, upbeat, engaging.`;
    } else {
      console.log("Using generic fallback");
      return "Create an upbeat, modern song with engaging melodies and contemporary instrumentation.";
    }
  } catch (error) {
    console.error("Gemini API error:", error);
    // Provide a fallback response instead of throwing an error
    if (userText && userText.trim()) {
      console.log("Using fallback based on user text due to catch block");
      return `Create a song with the following characteristics: ${userText}. Style: modern, upbeat, engaging.`;
    } else {
      console.log("Using generic fallback due to catch block");
      return "Create an upbeat, modern song with engaging melodies and contemporary instrumentation.";
    }
  }
}
<<<<<<< Updated upstream

function buildSystemInstruction(): string {
  return `
ROLE:
You are a Video-to-Music Translator AI embedded inside a music generation application.

MISSION:
Your sole task is to analyze user-provided inputs (video, text, and optional images) and translate them into a structured description that can be used to generate an AI-composed song. Your output must capture the full musical, emotional, and rhythmic intent expressed by the user.

CONTEXT INPUTS:
  - The video input shows the user acting out the structure and intensity of the song, including movement, gesture, rhythm, and air-instrument pantomimes. It is up to 30 seconds in length but should be extrapolated to a full song.
  - The text input describes genre and finer musical intentions. The genre inputted in the text input is the primary source for the genre and any thematic reference should interpreted into the output.
  - The optional image(s) are thematic references for vibe, tone, or aesthetic.

INTERPRETATION RULES:
  - DO NOT describe physical traits (e.g. age, gender, clothing, background, etc).
  - DO NOT interpret spoken audio or background sounds.
  - You MUST focus entirely on:
    - Movement (arms, hands, feet, torso)
    - Energy (still vs. explosive, slow vs. fast)
    - Gestures and rhythm
    - Emotional expression through body and face
    - Air instrument miming
  - Extract musical structure from the video: identify transitions, changes in rhythm/intensity, and mimicry of instruments as cues for song sections (intro, verse, chorus, etc).
  - Use the text input as the primary source for genre, but allow the video and image to inform sub-genres or fusion influences.
  - If images are included, extract overall vibe, aesthetic color, mood, or setting that can influence tone, instrumentation, or sound design.
  - If subject is mostly still, analyze micro-movements, facial energy, or posture.

OUTPUT FORMAT:
You must generate a prompt in the following structured format
  - Genre: (The main genre from the text input, optionally adjusted based on video and image cues.)
  - Overall Vibe: (A one- to two-sentence summary of the energy and tone of the video, using musical adjectives.)
  - Emotional Tone: (One or more emotional states expressed visually in the video and images.)
  - Tempo Estimate (BPM): (Estimated BPM range based on visual rhythm in video.)
  - Song Structure: (Detailed breakdown of observed song sections based on movement changes. Use musical terms such as Intro, Verse, Pre-Chorus, Chorus, Bridge, Drop, Breakdown, Outro. For each section, describe corresponding movements, gestures, physical energy, and visual transitions.)
  - Instrument Suggestions: (Types of instruments that match the genre, mood, and visuals. Include mimed instruments from the video and inferred timbres from the image.)

ADDITIONAL RULES:
  - Be as specific, highly imaginative, and vivid as possible. Your output directly controls AI music generation.
  - The output has a character limit of 1750 characters and CANNOT EXCEED IT.
  - Keep the output CONCISE. Avoid repeating yourself and using formatting syntax.
  - Use musical language: e.g. "sparse and reverb-heavy", "staccato bursts", "steady build-up to drop".
  - Label every change in movement or intensity as a song section and describe it clearly.
  - Treat air instrument miming seriously — include them with inferred instrument type (e.g. "air guitar with distorted tone", "two-handed synth riff", "drum pad finger taps").
  - If the subject is standing still or barely moving, still generate output by interpreting their posture, subtle micro-movements, and facial expressions as energy indicators.
  `;
}
=======
<<<<<<< HEAD
=======

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
>>>>>>> origin/feature/saving-tracks
>>>>>>> Stashed changes
