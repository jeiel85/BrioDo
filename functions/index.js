const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleGenAI } = require("@google/genai");

const ALLOWED_MODELS = new Set([
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash',
]);
const MAX_PROMPT_LENGTH = 4000;

exports.generateGeminiContent = onCall(
  {
    region: "asia-northeast3",
    cors: true,
    enforceAppCheck: false,
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
    if (!ALLOWED_MODELS.has(model)) {
      throw new HttpsError("invalid-argument", "Invalid model.");
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      throw new HttpsError("invalid-argument", "Prompt too long.");
    }

    try {
      // 4. Initialize Gemini SDK with Environment Variable
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new HttpsError("internal", "GEMINI_API_KEY is not configured on the server.");
      }

      const genAI = new GoogleGenAI({ apiKey });

      // 5. Generate Content
      const response = await genAI.models.generateContent({
        model: model,
        contents: prompt,
      });

      // 6. Return result to client
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
