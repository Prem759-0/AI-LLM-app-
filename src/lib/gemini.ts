import { GoogleGenAI, ThinkingLevel } from "@google/genai";

// Initialize Gemini API
// Note: process.env.GEMINI_API_KEY is automatically injected by the platform
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export const models = {
  flash: "gemini-flash-latest",
  pro: "gemini-3.1-pro-preview",
  image: "gemini-2.5-flash-image",
  thinking: "gemini-2.0-flash-thinking-exp",
};

export async function* streamChat(messages: { role: string; content: string }[], modelId: string = "text") {
  let modelName = "gemini-flash-latest";
  if (modelId === "tech" || modelId === "code") {
    modelName = "gemini-3.1-pro-preview";
  } else if (modelId === "thinking") {
    modelName = "gemini-2.0-flash-thinking-exp";
  }

  const contents = messages.map(m => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }]
  }));

  const response = await (ai.models as any).generateContentStream({
    model: modelName,
    contents: contents,
    config: {
      systemInstruction: `You are Cortex AI, a highly advanced and helpful AI assistant. 
      Current date: Wednesday, April 15, 2026. 
      
      CONCISENESS IS MANDATORY: 
      - If a question is simple, answer in ONE SENTENCE or less.
      - Never use more than 3 sentences unless explicitly asked for a detailed explanation.
      - Use bullet points for lists.
      - Avoid conversational filler (e.g., "Sure, I can help with that", "Here is the information").
      
      MEMORY: You have access to the full conversation history. Use it to maintain continuity. If the user refers to "it" or "that", look at the previous messages.`,
      temperature: 0.7,
      topP: 0.95,
    }
  });

  for await (const chunk of response) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

export async function generateImage(prompt: string, size: "1K" | "2K" | "4K" = "1K") {
  const response = await ai.models.generateContent({
    model: models.image,
    contents: {
      parts: [{ text: prompt }]
    },
    config: {
      imageConfig: {
        aspectRatio: "1:1",
        imageSize: size
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
}
