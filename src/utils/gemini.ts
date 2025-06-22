import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash";

// Utility function to convert video blob to base64
export function videoBlobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (e.g., "data:video/mp4;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function processVideoWithGemini(videoFile: File, userText?: string): Promise<string> {
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
    
    const content: any[] = [
      {
        inlineData: {
          mimeType: videoFile.type || "video/mp4",
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

    const result = await model.generateContent(content);
    const response = await result.response;
    console.log("Gemini response received");
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to process video with Gemini");
  }
}

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