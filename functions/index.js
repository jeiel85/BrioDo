const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleGenAI } = require("@google/genai");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();

const ALLOWED_MODELS = new Set([
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash',
]);
const MAX_PROMPT_LENGTH = 4000;
const DAILY_LIMIT = 10;
const MONTHLY_LIMIT = 100;

async function checkAndIncrementUsage(uid) {
  const db = getFirestore();
  const now = new Date();
  const dayKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
  const monthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

  const ref = db.collection("ai_usage").doc(uid);

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const data = snap.exists ? snap.data() : {};

    const daily = (data.dayKey === dayKey ? data.daily : 0);
    const monthly = (data.monthKey === monthKey ? data.monthly : 0);

    if (daily >= DAILY_LIMIT) return "daily";
    if (monthly >= MONTHLY_LIMIT) return "monthly";

    tx.set(ref, {
      dayKey,
      daily: daily + 1,
      monthKey,
      monthly: monthly + 1,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return "ok";
  });
}

exports.generateGeminiContent = onCall(
  {
    region: "asia-northeast3",
    cors: true,
    enforceAppCheck: false,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const { model, prompt } = request.data;
    if (!model || !prompt) {
      throw new HttpsError("invalid-argument", "The function must be called with 'model' and 'prompt'.");
    }
    if (!ALLOWED_MODELS.has(model)) {
      throw new HttpsError("invalid-argument", "Invalid model.");
    }
    if (prompt.length > MAX_PROMPT_LENGTH) {
      throw new HttpsError("invalid-argument", "Prompt too long.");
    }

    const usageResult = await checkAndIncrementUsage(request.auth.uid);
    if (usageResult === "daily") {
      throw new HttpsError("resource-exhausted", "Daily AI limit reached. Try again tomorrow.");
    }
    if (usageResult === "monthly") {
      throw new HttpsError("resource-exhausted", "Monthly AI limit reached.");
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new HttpsError("internal", "GEMINI_API_KEY is not configured on the server.");
      }

      const genAI = new GoogleGenAI({ apiKey });

      const response = await genAI.models.generateContent({
        model: model,
        contents: prompt,
      });

      if (response && response.text) {
        return { text: response.text };
      } else {
        throw new HttpsError("internal", "No text returned from Gemini.");
      }
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error("Gemini API Error:", error);
      throw new HttpsError("internal", `Failed to generate content: ${error.message || "Unknown error"}`);
    }
  }
);
