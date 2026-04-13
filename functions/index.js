const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleGenAI } = require("@google/genai");

exports.generateGeminiContent = onCall(
  {
    region: "asia-northeast3", // Seoul region to minimize latency
    cors: true,
  },
  async (request) => {
    // 1. Verify Authentication
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    // 2. Validate Request Payload
    const { model, prompt } = request.data;
    if (!model || !prompt) {
      throw new HttpsError(
        "invalid-argument",
        "The function must be called with 'model' and 'prompt'."
      );
    }

    try {
      // 3. Initialize Gemini SDK with Environment Variable
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new HttpsError("internal", "GEMINI_API_KEY is not configured on the server.");
      }
      
      const genAI = new GoogleGenAI({ apiKey });
      
      // 4. Generate Content
      const response = await genAI.models.generateContent({
        model: model,
        contents: prompt,
      });

      // 5. Return result to client
      if (response && response.text) {
        return { text: response.text };
      } else {
        throw new HttpsError("internal", "No text returned from Gemini.");
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new HttpsError(
        "internal",
        `Failed to generate content: ${error.message || "Unknown error"}`
      );
    }
  }
);
