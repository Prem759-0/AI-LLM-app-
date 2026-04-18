import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Plus, Database, Shield, Brain, Layers } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { Card } from "./ui/card.tsx";
import { ScrollArea } from "./ui/scroll-area.tsx";
import { toast } from "sonner";
import { cn } from "../lib/utils.ts";

interface ContextItem {
  id: string;
  name: string;
  type: "file" | "instruction" | "data";
  active: boolean;
}

export default function ContextManager() {
  const [items, setItems] = useState<ContextItem[]>([
    { id: "1", name: "Project Guidelines", type: "instruction", active: true },
    { id: "2", name: "schema.json", type: "file", active: false },
  ]);

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, active: !item.active } : item
    ));
    const item = items.find(i => i.id === id);
    if (item) {
      toast.info(`${item.name} is now ${!item.active ? "active" : "inactive"}`);
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
    toast.success("Context item removed");
  };

  return (
    <div className="p-4 flex flex-col h-full bg-white dark:bg-[#0b0c14] border-l border-slate-200 dark:border-white/5 w-80 shadow-xl transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600 dark:text-brand" />
          <h2 className="text-lg font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">Context Manager</h2>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full dark:text-slate-400 dark:hover:bg-white/5">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="mb-4">
        <p className="text-[10px] text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] font-black mb-4 ml-1">Active Context</p>
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="space-y-3 pr-4">
            <AnimatePresence>
              {items.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card className={cn(
                    "p-4 border border-transparent transition-all cursor-pointer group rounded-2xl",
                    item.active 
                      ? 'bg-indigo-50 dark:bg-brand/10 border-indigo-100 dark:border-brand/20 shadow-sm' 
                      : 'bg-slate-50 dark:bg-white/5 opacity-60 hover:opacity-100'
                  )}
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "p-2 rounded-xl transition-colors",
                          item.active 
                            ? 'bg-white dark:bg-brand/20 text-indigo-600 dark:text-brand shadow-sm' 
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-600'
                        )}>
                          {item.type === 'file' && <FileText className="w-4 h-4" />}
                          {item.type === 'instruction' && <Brain className="w-4 h-4" />}
                          {item.type === 'data' && <Database className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className={cn(
                            "text-xs font-black uppercase tracking-widest",
                            item.active ? 'text-indigo-900 dark:text-white' : 'text-slate-700 dark:text-slate-400'
                          )}>{item.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold capitalize mt-0.5">{item.type}</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-all"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </div>

      <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/5">
        <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl flex items-center gap-3 border border-slate-100 dark:border-white/5">
          <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Privacy Guard</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold">Neural local processing</p>
          </div>
        </div>
      </div>
    </div>
  );
}
