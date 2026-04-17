const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleGenAI } = require("@google/genai");

exports.generateGeminiContent = onCall(
  {
    region: "asia-northeast3", // Seoul region to minimize latency
    cors: true,
    enforceAppCheck: true, // Require valid App Check token
  },
  async (request) => {
    // 1. Verify App Check token (enforceAppCheck: true auto-validates)
    if (!request.app) {
      throw new HttpsError(
        "failed-precondition",
        "The function must be called with a valid App Check token. " +
        "Please ensure the app is registered in Firebase Console App Check."
      );
    }

    // 2. Verify Authentication
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    // 3. Validate Request Payload
    const { model, prompt } = request.data;
    if (!model || !prompt) {
      throw new HttpsError(
        "invalid-argument",
        "The function must be called with 'model' and 'prompt'."
      );
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
