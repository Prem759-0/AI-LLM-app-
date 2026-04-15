import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, Image as ImageIcon, Download, Share2, Wand2, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import { Card } from "./ui/card.tsx";
import { toast } from "sonner";
import { generateImage } from "../lib/gemini.ts";
import { cn } from "../lib/utils.ts";

export default function ImageGen() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<"1K" | "2K" | "4K">("1K");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const imageUrl = await generateImage(prompt, selectedSize);
      setGeneratedImage(imageUrl);
      toast.success("Image generated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate image. Please check your Gemini API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement("a");
    link.href = generatedImage;
    link.download = `cortex-ai-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-4 md:px-8 py-8 overflow-y-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <ImageIcon className="text-brand" size={32} />
            Creative Studio
          </h1>
          <p className="text-slate-500 mt-2">Create stunning visuals with Cortex AI</p>
        </div>
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="rounded-xl gap-2 text-slate-500 hover:text-brand"
        >
          <ArrowLeft size={18} />
          Back to Chat
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 rounded-3xl glass border-white/50 shadow-xl">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold text-slate-700 block mb-2">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A futuristic city with purple neon lights..."
                  className="w-full h-32 bg-white/50 border-slate-200 rounded-2xl p-4 text-sm focus:ring-brand outline-none resize-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 block mb-2">Resolution</label>
                <div className="grid grid-cols-3 gap-2">
                  {["1K", "2K", "4K"].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size as any)}
                      className={cn(
                        "py-2 rounded-xl text-xs font-bold transition-all border",
                        selectedSize === size 
                          ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                          : "bg-white text-slate-500 border-slate-200 hover:border-brand/50"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-brand hover:bg-brand-dark text-white rounded-xl h-12 font-bold shadow-lg gap-2"
              >
                {isGenerating ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <>
                    <Wand2 size={18} />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="aspect-square w-full glass rounded-[2.5rem] border-white/50 shadow-2xl flex items-center justify-center overflow-hidden relative group">
            {generatedImage ? (
              <>
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                  <Button onClick={handleDownload} variant="secondary" className="rounded-full w-12 h-12 p-0"><Download size={20} /></Button>
                  <Button variant="secondary" className="rounded-full w-12 h-12 p-0"><Share2 size={20} /></Button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                  {isGenerating ? (
                    <Sparkles className="animate-spin" size={40} />
                  ) : (
                    <ImageIcon size={40} />
                  )}
                </div>
                <p className="text-slate-400 text-sm">
                  {isGenerating ? "Cortex is dreaming up your image..." : "Your masterpiece will appear here"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

