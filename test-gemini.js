import { GoogleGenerativeAI } from "@google/generative-ai";

// Load environment variables manually
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testGemini() {
  if (!GEMINI_API_KEY) {
    console.error("Missing Gemini API Key");
    console.log("Available env vars:", Object.keys(process.env).filter(k => k.includes('GEMINI')));
    return;
  }

  console.log("Testing Gemini API...");
  console.log("API Key starts with:", GEMINI_API_KEY.substring(0, 10) + "...");
  
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  
  // Test different models
  const modelsToTest = [
    "gemini-1.5-flash",
    "gemini-1.5-pro", 
    "gemini-pro"
  ];

  for (const modelName of modelsToTest) {
    try {
      console.log(`\nTesting model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const result = await model.generateContent("Write a short song description for an upbeat pop song.");
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ ${modelName} works!`);
      console.log("Response:", text.substring(0, 100) + "...");
      break; // If one works, we're good
      
    } catch (error) {
      console.log(`❌ ${modelName} failed:`, error.message);
    }
  }
}

testGemini().catch(console.error);
