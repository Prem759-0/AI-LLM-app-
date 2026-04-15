import React from "react";
import { motion } from "framer-motion";
import { Library, BookOpen, Star, Clock, Bookmark, Search, MoreVertical, Share2, Trash2, ExternalLink } from "lucide-react";
import { Card } from "./ui/card.tsx";
import { Button } from "./ui/button.tsx";
import { cn } from "../lib/utils.ts";

export default function LibraryPage() {
  const sections = [
    { title: "Favorites", icon: Star, count: 12, color: "text-amber-500", bg: "bg-amber-50" },
    { title: "Saved Prompts", icon: Bookmark, count: 45, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Reading List", icon: BookOpen, count: 8, color: "text-purple-500", bg: "bg-purple-50" },
    { title: "Recent", icon: Clock, count: 120, color: "text-slate-500", bg: "bg-slate-50" },
  ];

  const savedItems = [
    { title: "Advanced React Patterns", type: "Reading List", date: "2 hours ago", icon: BookOpen, color: "text-purple-500" },
    { title: "Marketing Strategy Prompt", type: "Saved Prompts", date: "Yesterday", icon: Bookmark, color: "text-blue-500" },
    { title: "System Design Interview Prep", type: "Favorites", date: "3 days ago", icon: Star, color: "text-amber-500" },
    { title: "Python Data Science Snippets", type: "Saved Prompts", date: "1 week ago", icon: Bookmark, color: "text-blue-500" },
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
              <Library size={32} />
            </div>
            Your Library
          </h1>
          <p className="text-slate-500 mt-4 text-lg max-w-2xl leading-relaxed">
            Organize and manage your saved knowledge, favorite prompts, and curated reading lists in one central hub.
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {sections.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-8 rounded-[2.5rem] border-white/50 shadow-lg hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100/50 blur-3xl -z-10 group-hover:bg-slate-200/50 transition-colors" />
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform bg-white shadow-sm", s.color)}>
              <s.icon size={32} />
            </div>
            <h3 className="text-xl font-black text-slate-800 tracking-tight">{s.title}</h3>
            <p className="text-sm font-bold text-slate-400 mt-1">{s.count} items</p>
          </motion.div>
        ))}
      </div>

      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Recently Saved</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search library..." 
                className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-brand/20 transition-all w-48 md:w-64"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {savedItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass p-6 rounded-3xl border-white/50 shadow-sm hover:shadow-xl transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-5">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm bg-white group-hover:scale-110 transition-transform", item.color)}>
                  <item.icon size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-800 group-hover:text-brand transition-colors">{item.title}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.type}</span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">•</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.date}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-brand rounded-xl"><Share2 size={18} /></Button>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-brand rounded-xl"><ExternalLink size={18} /></Button>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 rounded-xl"><Trash2 size={18} /></Button>
              </div>
            </motion.div>
          ))}
        </div>

        {savedItems.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 glass rounded-[3rem] border-white/50">
            <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 relative">
              <div className="absolute inset-0 bg-slate-200/50 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
              <Bookmark size={48} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-800">No saved items yet</h3>
              <p className="text-slate-500 max-w-xs mx-auto mt-2 leading-relaxed font-medium">
                Start saving prompts, chat fragments, or reading materials to build your personal knowledge base.
              </p>
            </div>
            <Button className="bg-brand hover:bg-brand-dark text-white rounded-2xl px-8 h-12 font-black shadow-lg shadow-brand/20">
              Explore Content
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
