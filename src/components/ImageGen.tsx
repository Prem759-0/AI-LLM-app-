import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, Image as ImageIcon, Download, Share2, Wand2, RefreshCw, ArrowLeft } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import { Card } from "./ui/card.tsx";
import { toast } from "sonner";
import { generateImage } from "../lib/aiService.ts";
import PremiumModal from "./PremiumModal.tsx";
import { cn } from "../lib/utils.ts";

export default function ImageGen() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<"1K" | "2K" | "4K">("1K");
  const [selectedStyle, setSelectedStyle] = useState("Cinematic");
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const STYLES = [
    { name: "Cinematic", icon: Sparkles, prompt: "cinematic, 8k, highly detailed, photorealistic, dramatic lighting" },
    { name: "Anime", icon: Wand2, prompt: "anime style, vibrant colors, clean lines, high quality illustration" },
    { name: "Digital Art", icon: ImageIcon, prompt: "digital art, concept art, artistic, creative composition" },
    { name: "Minimalist", icon: Share2, prompt: "minimalist, clean, elegant, simple forms, high-end design" },
    { name: "Cyberpunk", icon: Zap, prompt: "cyberpunk aesthetic, neon lights, futuristic, gritty, hi-tech" }
  ];

  const PROMPT_SUGGESTIONS = [
    "A futuristic cyberpunk metropolis with neon vertical gardens",
    "An oil painting of a lonely astronaut on a distant crimson planet",
    "A glass architectural structure floating above a calm crystal ocean",
    "High-speed photography of a liquid chrome splash forming a crown"
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const stylePrompt = STYLES.find(s => s.name === selectedStyle)?.prompt || "";
      const finalPrompt = `${prompt}. Style: ${stylePrompt}`;

      const response = await fetch("/api/ai/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ prompt: finalPrompt, size: selectedSize })
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
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-4 md:px-8 py-8 overflow-y-auto transition-colors bg-[#fcfcff] dark:bg-[#0b0c14]">
      <PremiumModal isOpen={showPremiumModal} onOpenChange={setShowPremiumModal} />
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3 italic tracking-tighter uppercase">
            <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
              <ImageIcon size={24} />
            </div>
            Creative Studio
          </h1>
          <p className="text-slate-500 dark:text-slate-500 mt-2 italic pr-4 font-bold uppercase tracking-widest text-[10px]">Neural visual synthesis engine</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 rounded-[2rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-2xl space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] block mb-3 ml-1">Prompt Configuration</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic city with purple neon lights..."
                className="w-full h-40 bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 rounded-2xl p-4 text-sm focus:ring-brand outline-none resize-none dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 font-medium transition-all focus:bg-white dark:focus:bg-black/40"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] block mb-2 ml-1">Style Preset</label>
              <div className="grid grid-cols-2 gap-2">
                {STYLES.map((style) => (
                  <button
                    key={style.name}
                    onClick={() => setSelectedStyle(style.name)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                      selectedStyle === style.name 
                        ? "bg-brand text-white border-brand shadow-lg scale-[1.02]" 
                        : "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-500 border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
                    )}
                  >
                    <style.icon size={12} className={selectedStyle === style.name ? "text-white" : "text-brand"} />
                    {style.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] block mb-2 ml-1">Output Fidelity</label>
              <div className="grid grid-cols-3 gap-2">
                {["1K", "2K", "4K"].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size as any)}
                    className={cn(
                      "py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                      selectedSize === size 
                        ? "bg-slate-900 dark:bg-white dark:text-slate-900 text-white border-slate-900 dark:border-white shadow-md" 
                        : "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-500 border-slate-100 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
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
              className="w-full bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl h-16 font-black uppercase text-sm tracking-widest shadow-2xl shadow-brand/20 gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] mt-4 overflow-hidden relative group"
            >
              <div className="absolute inset-0 bg-brand/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <RefreshCw size={20} className="animate-spin" />
                  <span>Synthesizing...</span>
                </div>
              ) : (
                <>
                  <Wand2 size={20} />
                  <span>Initiate Synthesis</span>
                </>
              )}
            </Button>
          </Card>

          <Card className="p-6 rounded-[2rem] bg-slate-100/50 dark:bg-white/5 border-none">
            <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] mb-4 ml-1">Neural Inspiration</h3>
            <div className="space-y-2">
              {PROMPT_SUGGESTIONS.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(suggestion)}
                  className="w-full text-left p-3 rounded-xl bg-white dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 border border-slate-200/50 dark:border-white/5 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-brand transition-all line-clamp-1 group"
                >
                  <span className="opacity-40 mr-2 font-black italic">0{i+1}</span>
                  {suggestion}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="aspect-[4/3] lg:aspect-auto flex-1 w-full bg-white dark:bg-white/5 rounded-[3rem] border border-slate-200/50 dark:border-white/10 shadow-2xl flex items-center justify-center overflow-hidden relative group transition-all duration-700">
            {generatedImage ? (
              <>
                <AnimatePresence mode="wait">
                  <motion.img 
                    key={generatedImage}
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.6 }}
                    src={generatedImage} 
                    alt="Generated" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </AnimatePresence>
                <div className="absolute inset-x-0 bottom-0 p-8 translate-y-10 group-hover:translate-y-0 transition-all duration-500 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between opacity-0 group-hover:opacity-100">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-brand uppercase tracking-widest italic">Synthesis Complete</p>
                    <p className="text-white text-xs font-bold truncate max-w-[300px]">{prompt}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button onClick={handleDownload} variant="secondary" className="rounded-2xl h-12 px-6 shadow-2xl hover:scale-105 active:scale-95 transition-all bg-white text-slate-900 font-black uppercase text-[10px] tracking-widest gap-2">
                      <Download size={16} />
                      Export PNG
                    </Button>
                    <Button 
                      variant="secondary" 
                      className="rounded-2xl h-12 w-12 p-0 shadow-2xl hover:scale-105 active:scale-95 transition-all bg-brand text-white border-none"
                      onClick={() => setGeneratedImage(null)}
                    >
                      <Plus className="rotate-45" size={20} />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center space-y-6 p-12">
                <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto text-slate-300 dark:text-slate-700 relative">
                  {isGenerating ? (
                    <div className="absolute inset-0 bg-brand/20 rounded-[2.5rem] animate-ping" />
                  ) : (
                    <div className="absolute inset-0 bg-slate-100 dark:bg-white/5 rounded-[2.5rem] scale-110 opacity-50" />
                  )}
                  <motion.div
                    animate={isGenerating ? { rotate: 360 } : {}}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                  >
                    {isGenerating ? (
                      <RefreshCw className="text-brand" size={48} />
                    ) : (
                      <ImageIcon size={48} />
                    )}
                  </motion.div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-[0.2em] italic">
                    {isGenerating ? "Synthesizing Neural Map..." : "Virtual Canvas Offline"}
                  </h2>
                  <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest max-w-[240px] mx-auto leading-relaxed">
                    {isGenerating 
                      ? "Processing multi-layer perceptual noise into coherent structures" 
                      : "Configure your neural intent and initiate the synthesis process to manifest vision"}
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Zap size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Efficiency Mode</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 italic uppercase">Standard Latency</p>
              </div>
            </Card>
            <Card className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center text-brand">
                <ImageIcon size={18} />
              </div>
              <div className="flex-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Visual Engine</p>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300 italic uppercase">Neural-V2.5</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

