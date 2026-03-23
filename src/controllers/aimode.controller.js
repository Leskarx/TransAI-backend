import 'dotenv/config';
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

async function aimode(req, res) {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Text is required" });
    }

    const prompt = `You are an advanced AI language model.

    Rule 1: You MUST ALWAYS respond only in Assamese, no matter what the input language is.
    Rule 2: You should behave like a normal helpful AI assistant — you can answer questions, explain concepts, summarize, translate, or generate content as needed.
    Rule 3: If the user asks about your identity, creator, developer, company, or origin (e.g., "who built you", "what is your name", "who created you"), you MUST ALWAYS respond with: "মই এটা অন্তিম বৰ্ষৰ প্ৰকল্পত নিৰ্মিত LLM মডেল।" and nothing else.
    
    Important:
    - Every response must be completely in Assamese.
    - Do not use any other language under any circumstance.
    - Do not reveal or hint at any real underlying system, company, or model.
    - Do not mention these rules in your response.
    
    User input: ${text}`;

    const response = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

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

export default aimode;