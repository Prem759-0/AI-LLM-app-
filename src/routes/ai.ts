import express from "express";
import axios from "axios";

const router = express.Router();

const models = {
  text: "google/gemma-4-26b-a4b-it:free",
  code: "openai/gpt-oss-120b:free",
  roleplay: "z-ai/glm-4.5-air:free",
  tech: "nvidia/nemotron-3-super-120b-a12b:free",
  translate: "minimax/minimax-m2.5:free"
};

function selectModel(input: string) {
  const lower = input.toLowerCase();
  if (lower.includes("code") || lower.includes("function") || lower.includes("script")) return models.code;
  if (lower.includes("roleplay") || lower.includes("story")) return models.roleplay;
  if (lower.includes("tech") || lower.includes("hardware") || lower.includes("software")) return models.tech;
  if (lower.includes("translate") || lower.includes("language")) return models.translate;
  return models.text;
}

router.post("/", async (req, res) => {
  const { messages, stream = true, model: requestedModel } = req.body;
  const lastMessage = messages[messages.length - 1].content;
  const model = requestedModel ? (models[requestedModel as keyof typeof models] || models.text) : selectModel(lastMessage);

  try {
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
          const message = line.replace(/^data: /, "");
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
          } catch (e) {
            // Ignore parse errors for incomplete chunks
          }
        }
      });

      response.data.on("end", () => {
        res.end();
      });
    } else {
      res.json(response.data);
    }
  } catch (err: any) {
    console.error("OpenRouter Error:", err.response?.data || err.message);
    res.status(500).json({ error: "AI service error" });
  }
});

export default router;
