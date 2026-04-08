import 'dotenv/config';
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

async function translate(req, res) {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }

    const prompt = `You are a strict translation system. Your ONLY task is to convert any given input text into Assamese. You MUST ALWAYS translate the entire content into Assamese, regardless of the original language. Do NOT summarize, explain, or add extra information. Do NOT leave any part untranslated. The output must be fully and only in Assamese. Under no circumstances should you respond in any other language. Input text: ${text}`;

    const response = await genAI.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
    });
    // gemini-3-flash-preview
    // gemini-3.1-flash-lite-preview
    // gemini-2.5-flash
    // gemini-2.5-flash-lite


    res.json({
      message: response.text,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
}

export default translate;