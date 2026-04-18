import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, Image as ImageIcon, Download, Share2, Wand2, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import { Card } from "./ui/card.tsx";
import { toast } from "sonner";
import { generateImage } from "../lib/gemini.ts";
import PremiumModal from "./PremiumModal.tsx";
import { cn } from "../lib/utils.ts";

export default function ImageGen() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<"1K" | "2K" | "4K">("1K");
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ prompt, size: selectedSize })
      });
      
      const data = await response.json();
      
      if (data.limitReached) {
        toast.info("Free limit reached!", {
          description: "Upgrade to Pro for unlimited generation."
        });
        const PremiumModal = (await import("./PremiumModal.tsx")).default;
        // Since we can't easily open the modal from here without passing props down, 
        // we'll trigger a custom event or just redirect/show toast.
        // Actually, let's just use a state for the modal in this component too.
        setShowPremiumModal(true);
        return;
      }

      if (!response.ok) throw new Error(data.error || "Failed to generate");

      setGeneratedImage(data.imageUrl);
      toast.success("Image generated successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate image.");
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
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-4 md:px-8 py-8 overflow-y-auto transition-colors">
      <PremiumModal isOpen={showPremiumModal} onOpenChange={setShowPremiumModal} />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 italic tracking-tighter uppercase">
            <ImageIcon className="text-brand" size={32} />
            Creative Studio
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 italic pr-4">Create stunning visuals with Cortex AI neural engine</p>
        </div>
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")}
          className="rounded-xl gap-2 text-slate-500 dark:text-slate-400 hover:text-brand font-black text-[10px] uppercase tracking-widest"
        >
          <ArrowLeft size={18} />
          Back to Chat
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-6 rounded-3xl glass border-white/50 dark:border-white/5 shadow-xl transition-colors">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] block mb-3 ml-1">Prompt</label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A futuristic city with purple neon lights..."
                  className="w-full h-32 bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-sm focus:ring-brand outline-none resize-none dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 font-medium"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] block mb-2 ml-1">Resolution</label>
                <div className="grid grid-cols-3 gap-2">
                  {["1K", "2K", "4K"].map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size as any)}
                      className={cn(
                        "py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                        selectedSize === size 
                          ? "bg-slate-900 dark:bg-brand text-white border-slate-900 dark:border-brand shadow-md" 
                          : "bg-white dark:bg-white/5 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-white/10 hover:border-brand/50"
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
                className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl h-14 font-black uppercase text-xs tracking-widest shadow-xl shadow-brand/20 gap-3 transition-all hover:scale-105 active:scale-95 mt-4"
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
          <div className="aspect-square w-full glass rounded-[3rem] border-white/50 dark:border-white/5 shadow-2xl flex items-center justify-center overflow-hidden relative group transition-colors">
            {generatedImage ? (
              <>
                <img 
                  src={generatedImage} 
                  alt="Generated" 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                  <Button onClick={handleDownload} variant="secondary" className="rounded-full w-14 h-14 p-0 shadow-2xl hover:scale-110 active:scale-90 transition-all"><Download size={22} /></Button>
                  <Button variant="secondary" className="rounded-full w-14 h-14 p-0 shadow-2xl hover:scale-110 active:scale-90 transition-all"><Share2 size={22} /></Button>
                </div>
              </>
            ) : (
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto text-slate-300 dark:text-slate-700 relative">
                  {isGenerating ? (
                    <div className="absolute inset-0 bg-brand/10 rounded-full animate-ping" />
                  ) : (
                    <div className="absolute inset-0 bg-slate-200/50 dark:bg-white/5 rounded-full animate-pulse" />
                  )}
                  {isGenerating ? (
                    <Sparkles className="animate-spin" size={48} />
                  ) : (
                    <ImageIcon size={48} />
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-slate-800 dark:text-slate-300 font-black uppercase tracking-widest text-xs italic">
                    {isGenerating ? "Cortex is dreaming..." : "Neural Canvas Empty"}
                  </p>
                  <p className="text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest">
                    {isGenerating ? "Synthesizing pixels from noise" : "Your masterpiece will appear here"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

