import React from "react";
import { motion } from "framer-motion";
import { Compass, Search, Sparkles, TrendingUp, Globe, Zap, ArrowRight, Star, Users, Clock } from "lucide-react";
import { Card } from "./ui/card.tsx";
import { Button } from "./ui/button.tsx";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils.ts";

export default function Explore() {
  const navigate = useNavigate();
  const categories = [
    { name: "Writing", icon: Sparkles, color: "text-purple-500", bg: "bg-purple-50" },
    { name: "Coding", icon: Zap, color: "text-amber-500", bg: "bg-amber-50" },
    { name: "Research", icon: Globe, color: "text-blue-500", bg: "bg-blue-50" },
    { name: "Analysis", icon: TrendingUp, color: "text-emerald-500", bg: "bg-emerald-50" },
  ];

  const featured = [
    { title: "Code Architect", desc: "Advanced system design and code optimization assistant.", author: "Cortex Team", tags: ["Coding", "System Design"], rating: 4.9, users: "12k" },
    { title: "Creative Muse", desc: "Unlock your imagination with poetic and descriptive storytelling.", author: "Cortex Team", tags: ["Writing", "Creative"], rating: 4.8, users: "8k" },
    { title: "Data Synthesizer", desc: "Turn complex datasets into clear, actionable insights.", author: "Cortex Team", tags: ["Analysis", "Data"], rating: 4.7, users: "15k" },
    { title: "Legal Eagle", desc: "Specialized in document review and legal terminology analysis.", author: "Cortex Team", tags: ["Legal", "Research"], rating: 4.9, users: "5k" },
    { title: "Market Strategist", desc: "Trend analysis and competitive landscape mapping.", author: "Cortex Team", tags: ["Business", "Marketing"], rating: 4.6, users: "9k" },
    { title: "UX Researcher", desc: "User persona generation and usability feedback simulation.", author: "Cortex Team", tags: ["Design", "UX"], rating: 4.8, users: "7k" },
  ];

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto px-4 md:px-8 py-8 overflow-y-auto no-scrollbar">
      <div className="mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 flex items-center gap-4">
            <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
              <Compass size={32} />
            </div>
            Explore Cortex
          </h1>
          <p className="text-slate-500 mt-4 text-lg max-w-2xl leading-relaxed">
            Discover specialized AI models, community-crafted prompts, and powerful tools designed to supercharge your productivity.
          </p>
        </motion.div>
      </div>

      <div className="relative mb-12 group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={24} />
        <input 
          type="text" 
          placeholder="Search for models, prompts, or tools..." 
          className="w-full bg-white border border-slate-200 rounded-[2rem] py-5 pl-14 pr-6 shadow-sm focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all text-lg"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {categories.map((cat, i) => (
          <motion.div
            key={cat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "p-8 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 cursor-pointer hover:shadow-xl transition-all border border-transparent hover:border-slate-200 group",
              cat.bg
            )}
          >
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <cat.icon className={cat.color} size={32} />
            </div>
            <span className="font-black text-slate-800 tracking-tight">{cat.name}</span>
          </motion.div>
        ))}
      </div>

      <div className="space-y-8 mb-16">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Featured Models</h2>
          <Button variant="ghost" className="text-brand font-bold hover:bg-brand/5">
            View all models <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featured.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="p-8 rounded-[2.5rem] glass border-white/50 shadow-lg hover:shadow-2xl transition-all group overflow-hidden relative h-full flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 blur-3xl -z-10 group-hover:bg-brand/10 transition-colors" />
                
                <div className="flex items-start justify-between mb-6">
                  <div className="w-14 h-14 bg-brand/10 rounded-2xl flex items-center justify-center text-brand group-hover:scale-110 transition-transform shadow-sm">
                    <Sparkles size={28} />
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/50 shadow-sm">
                    <Star size={14} className="text-amber-500 fill-amber-500" />
                    <span className="text-xs font-black text-slate-700">{item.rating}</span>
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-900 mb-3 group-hover:text-brand transition-colors">{item.title}</h3>
                <p className="text-sm text-slate-500 mb-6 leading-relaxed flex-1">{item.desc}</p>
                
                <div className="flex flex-wrap gap-2 mb-8">
                  {item.tags.map(tag => (
                    <span key={tag} className="text-[10px] font-black px-3 py-1 rounded-full bg-slate-100 text-slate-500 uppercase tracking-widest">{tag}</span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-auto">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <Users size={12} />
                      {item.users}
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-brand hover:bg-brand/10 rounded-xl font-black text-xs px-5 h-10"
                    onClick={() => navigate("/chat")}
                  >
                    Try now
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trending Section */}
      <section className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden mb-12">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand/10 blur-[120px] -z-0" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="text-brand" size={32} />
            <h2 className="text-3xl font-black tracking-tight">Trending Prompts</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              "Generate a comprehensive market entry strategy for a SaaS startup.",
              "Write a technical deep-dive into the architecture of modern LLMs.",
              "Create a series of abstract digital art prompts for Midjourney.",
              "Analyze the impact of remote work on urban development in 2026."
            ].map((prompt, i) => (
              <div 
                key={i} 
                className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer flex items-center justify-between group"
                onClick={() => navigate("/chat")}
              >
                <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors line-clamp-1">{prompt}</span>
                <ArrowRight size={18} className="text-slate-500 group-hover:text-brand group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
