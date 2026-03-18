import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

// Force load .env from project root
dotenv.config({ path: path.resolve('d:/GitProject/first', '.env') });

const apiKey = process.env.VITE_GEMINI_API_KEY;

if (!apiKey || apiKey.includes('YOUR_GEMINI_API_KEY_HERE')) {
  console.error('API Key not found or still placeholder.');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function testConnection() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Say 'Hello AI works!' if you can read this.");
    const response = await result.response;
    console.log(response.text());
  } catch (error) {
    console.error('Connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
