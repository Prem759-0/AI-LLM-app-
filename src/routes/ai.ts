import express from "express";
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ClerkExpressRequireAuth } from "@clerk/clerk-sdk-node";
import { User } from "../models/User.ts";

const router = express.Router();

const FREE_MESSAGE_LIMIT = 15;

const OPENROUTER_MODELS = {
  text: "google/gemma-2-9b-it:free",
  code: "qwen/qwen-2.5-coder-32b-instruct:free",
  roleplay: "gryphe/mythomax-l2-13b:free",
  tech: "nvidia/llama-3.1-nemotron-70b-instruct:free",
  translate: "google/gemma-2-9b-it:free",
  vision: "google/gemini-flash-1.5-exp:free"
};

router.post("/summarize", ClerkExpressRequireAuth(), async (req, res) => {
  const { messages } = req.body;
  if (!process.env.OPENROUTER_API_KEY) return res.status(500).json({ error: "Missing OpenRouter API Key" });

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: OPENROUTER_MODELS.text,
        messages: [
          ...messages,
          { role: "system", content: "Summarize the previous conversation into a very short, catchy title (max 6 words). Output ONLY the title." }
        ],
        stream: false
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    res.json({ summary: response.data.choices[0]?.message?.content?.replace(/^"|"$/g, '') || "New Conversation" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", ClerkExpressRequireAuth(), async (req: any, res) => {
  const { messages, stream = true, model: requestedModel } = req.body;
  const { userId } = req.auth;

  // Usage check
  let user = await User.findOne({ clerkId: userId });
  if (!user) {
    user = new User({ clerkId: userId, email: "syncing..." });
    await user.save();
  }

  // Free Tier Policy: 10 messages, 4 images
  if (!user.isPro) {
    if (user.usage.messages >= FREE_MESSAGE_LIMIT) {
      return res.status(200).json({ 
        limitReached: true,
        message: "You've reached your free message limit. Please upgrade to Pro for unlimited synthesis."
      });
    }
  }

  // Update usage
  await User.findOneAndUpdate({ clerkId: userId }, { $inc: { "usage.messages": 1 } });
  
  // Use OpenRouter Exclusively for Chat as requested
  try {
    const model = OPENROUTER_MODELS[requestedModel as keyof typeof OPENROUTER_MODELS] || OPENROUTER_MODELS.text;
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model,
        messages: [
          { role: "system", content: "You are Cortex AI, a highly advanced neural assistant. Be concise, intelligent, and refined." },
          ...messages
        ],
        stream,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://neural-genesis.vercel.app",
          "X-Title": "Cortex AI"
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
            if (message.trim() === "[DONE]") {
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
      response.data.on("error", (err: any) => {
        console.error("[OpenRouter Stream Error]", err);
        res.end();
      });
    } else {
      res.json(response.data);
    }
  } catch (err: any) {
    const errorDetails = err.response?.data || err.message;
    console.error("[Cortex AI] OpenRouter Error:", errorDetails);
    res.status(500).json({ 
      error: "Neural interface failure",
      details: "The neural engine (OpenRouter) is currently unavailable.",
      raw: errorDetails 
    });
  }
});

router.post("/image", ClerkExpressRequireAuth(), async (req: any, res) => {
  const { prompt, size = "1K" } = req.body;
  const { userId } = req.auth;

  // Usage check
  let user = await User.findOne({ clerkId: userId });
  if (!user) {
    user = new User({ clerkId: userId, email: "syncing..." });
    await user.save();
  }

  const FREE_IMAGE_LIMIT = 4;
  if (!user.isPro && user.usage.images >= FREE_IMAGE_LIMIT) {
    return res.status(200).json({ 
      limitReached: true,
      message: "Neural visual synthesis limit reached. Upgrade to Pro for unlimited generation."
    });
  }

  await User.findOneAndUpdate({ clerkId: userId }, { $inc: { "usage.images": 1 } });
  
  // Try OpenRouter for images as requested
  if (process.env.OPENROUTER_API_KEY) {
    try {
      // Using a known image capable model on OpenRouter if available, 
      // otherwise falling back to Stable Diffusion style models
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "openai/dall-e-3", 
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 60000 // Image gen can be slow
        }
      );
      
      const content = response.data.choices[0]?.message?.content;
      // DALL-E models on OpenRouter typically return a single message with the URL or an image block
      if (content && (content.includes("http") || content.startsWith("data:"))) {
        const urlMatch = content.match(/https?:\/\/[^\s]+/) || [content];
        return res.json({ imageUrl: urlMatch[0] });
      }
    } catch (orErr: any) {
      console.error("[AI Image] OpenRouter failed:", orErr.response?.data || orErr.message);
    }
  }

  // Final fallback to Gemini only if OpenRouter failed and the user didn't strictly forbid it as a secondary backup
  if (process.env.GEMINI_API_KEY) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); 

      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          // @ts-ignore
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
    } catch (geminiErr: any) {
      console.error("[AI Image] Gemini backup failed:", geminiErr.message);
    }
  }

  res.status(500).json({ 
    error: "Synthesis failed",
    details: "All neural visual providers failed. Please check your system configuration." 
  });
});

export default router;
