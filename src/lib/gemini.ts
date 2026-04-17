// AI Service Utilities
export const models = {
  flash: "gemini-flash-latest",
  pro: "gemini-3.1-pro-preview",
  image: "gemini-2.5-flash-image",
  thinking: "gemini-2.0-flash-thinking-exp",
};

export async function* streamChat(messages: { role: string; content: string }[], modelId: string = "text") {
  try {
    const response = await fetch("/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({
        messages,
        model: modelId,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || "Failed to connect to AI service");
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              yield parsed.content;
            }
          } catch (e) {
            // Incomplete chunk
          }
        }
      }
    }
  } catch (err: any) {
    console.error("Stream Error:", err);
    throw err;
  }
}

export async function generateImage(prompt: string, size: "1K" | "2K" | "4K" = "1K") {
  try {
    const response = await fetch("/api/ai/image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
      },
      body: JSON.stringify({ prompt, size })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || error.error || "Failed to generate image");
    }

    const data = await response.json();
    return data.imageUrl;
  } catch (err: any) {
    console.error("Image Gen Error:", err);
    throw err;
  }
}
