import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Plus, Database, Shield, Brain, Layers } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { Card } from "./ui/card.tsx";
import { ScrollArea } from "./ui/scroll-area.tsx";
import { toast } from "sonner";

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
    <div className="p-4 flex flex-col h-full bg-white border-l border-slate-200 w-80 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-slate-900 italic serif font-serif">Context Manager</h2>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="mb-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Active Context</p>
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
                  <Card className={`p-3 border-none transition-all cursor-pointer group ${item.active ? 'bg-indigo-50 shadow-sm' : 'bg-slate-50 opacity-60'}`}
                    onClick={() => toggleItem(item.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${item.active ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                          {item.type === 'file' && <FileText className="w-4 h-4" />}
                          {item.type === 'instruction' && <Brain className="w-4 h-4" />}
                          {item.type === 'data' && <Database className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${item.active ? 'text-indigo-900' : 'text-slate-700'}`}>{item.name}</p>
                          <p className="text-[10px] text-slate-400 capitalize">{item.type}</p>
                        </div>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-600 rounded transition-all"
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

      <div className="mt-auto pt-6 border-t border-slate-100">
        <div className="bg-slate-50 p-3 rounded-xl flex items-center gap-3">
          <Shield className="w-5 h-5 text-emerald-500" />
          <div>
            <p className="text-xs font-semibold text-slate-900">Privacy Mode</p>
            <p className="text-[10px] text-slate-500">Local context processing active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
