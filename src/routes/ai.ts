import express from "express";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

const OPENROUTER_MODELS = {
  text: "google/gemma-2-9b-it:free",
  code: "qwen/qwen-2.5-coder-32b-instruct:free",
  roleplay: "gryphe/mythomax-l2-13b:free",
  tech: "nvidia/llama-3.1-nemotron-70b-instruct:free",
  translate: "google/gemma-2-9b-it:free"
};

const GEMINI_MODELS = {
  text: "gemini-2.0-flash-exp",
  code: "gemini-2.0-flash-exp",
  tech: "gemini-2.0-flash-exp",
  thinking: "gemini-2.0-flash-thinking-exp",
};

router.post("/", async (req, res) => {
  const { messages, stream = true, model: requestedModel } = req.body;
  
  // Try Gemini first if key is available
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const modelName = GEMINI_MODELS[requestedModel as keyof typeof GEMINI_MODELS] || GEMINI_MODELS.text;
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        systemInstruction: "You are Cortex AI, a highly advanced assistant. Be concise."
      });

      const contents = messages.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      if (stream) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        const result = await model.generateContentStream({ contents });
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            res.write(`data: ${JSON.stringify({ content: text })}\n\n`);
          }
        }
        res.write("data: [DONE]\n\n");
        return res.end();
      } else {
        const result = await model.generateContent({ contents });
        return res.json({ choices: [{ message: { content: result.response.text() } }] });
      }
    } catch (geminiErr: any) {
      console.error("[AI] Gemini failed, falling back to OpenRouter:", geminiErr.message);
      // Fall through to OpenRouter logic
    }
  }

  // OpenRouter Fallback
  try {
    const model = OPENROUTER_MODELS[requestedModel as keyof typeof OPENROUTER_MODELS] || OPENROUTER_MODELS.text;
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model,
        messages,
        stream,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://neural-genesis.vercel.app",
          "X-Title": "Neural Genesis"
        },
        responseType: stream ? "stream" : "json",
      }
    );

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      response.data.on("data", (chunk: Buffer) => {
        const lines = chunk.toString().split("\n").filter(line => line.trim() !== "");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const message = line.slice(6);
            if (message === "[DONE]") {
              res.write("data: [DONE]\n\n");
              return;
            }
            try {
              const parsed = JSON.parse(message);
              const content = parsed.choices[0]?.delta?.content || "";
              if (content) {
                res.write(`data: ${JSON.stringify({ content })}\n\n`);
              }
            } catch (e) {}
          }
        }
      });

      response.data.on("end", () => res.end());
    } else {
      res.json(response.data);
    }
  } catch (err: any) {
    console.error("[AI] Final Fallback Error:", err.response?.data || err.message);
    res.status(500).json({ 
      error: "AI service error",
      details: "Both Gemini and OpenRouter failed. Check your API keys."
    });
  }
});

router.post("/image", async (req, res) => {
  const { prompt, size = "1K" } = req.body;
  
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY not configured for image generation" });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); // Using a known good model for config pass

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        // @ts-ignore - Image generation config
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: size
        }
      }
    });

    const part = result.response.candidates?.[0]?.content.parts[0];
    if (part?.inlineData) {
      return res.json({ imageUrl: `data:image/png;base64,${part.inlineData.data}` });
    }
    
    throw new Error("No image data returned from Gemini");
  } catch (err: any) {
    console.error("[AI Image] Error:", err.message);
    res.status(500).json({ 
      error: "Image generation failed",
      details: err.message 
    });
  }
});

export default router;
