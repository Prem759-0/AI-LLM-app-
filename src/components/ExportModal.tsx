import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog.tsx";
import { Download, FileText, FileJson, Check, Search, Calendar, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { cn } from "../lib/utils.ts";
import { toast } from "sonner";
import api from "../lib/api.ts";

interface Chat {
  _id: string;
  title: string;
  updatedAt: string;
  messages: any[];
}

interface ExportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chats: Chat[];
}

export default function ExportModal({ isOpen, onOpenChange, chats }: ExportModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [format, setFormat] = useState<"txt" | "json">("json");
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = chats.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === filteredChats.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredChats.map(c => c._id));
    }
  };

  const handleExport = async () => {
    if (selectedIds.length === 0) {
      toast.error("Select at least one neural record for export");
      return;
    }

    setIsExporting(true);
    const toastId = toast.loading("Synthesizing export package...");

    try {
      // Find selected chats with messages
      const exportData = chats.filter(c => selectedIds.includes(c._id));
      
      let finalContent = "";
      let filename = `Cortex_Export_${new Date().toISOString().split('T')[0]}`;

      if (format === "json") {
        finalContent = JSON.stringify(exportData, null, 2);
        filename += ".json";
      } else {
        finalContent = exportData.map(chat => (
          `==========================================\n` +
          `CHAT: ${chat.title}\n` +
          `DATE: ${new Date(chat.updatedAt).toLocaleString()}\n` +
          `==========================================\n\n` +
          chat.messages.map(m => (
            `[${m.role.toUpperCase()}]\n${m.content}\n\n`
          )).join("---\n\n")
        )).join("\n\n\n\n");
        filename += ".txt";
      }

      const blob = new Blob([finalContent], { type: format === "json" ? "application/json" : "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Intelligence package successfully exported", { id: toastId });
      onOpenChange(false);
    } catch (err) {
      toast.error("Export synthesis failed", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-[#0b0c14] border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl">
        <DialogHeader className="p-8 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
              <Download size={28} />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">
                Neural Export Hub
              </DialogTitle>
              <DialogDescription className="text-xs font-medium text-slate-500 mt-1">
                Batch select synthesis records and choose your preferred protocol.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col p-8 gap-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search neural records..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all dark:text-white"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={format === "json" ? "brand" : "outline"} 
                onClick={() => setFormat("json")}
                className="flex-1 sm:flex-none h-12 rounded-xl font-black gap-2"
              >
                <FileJson size={16} /> JSON
              </Button>
              <Button 
                variant={format === "txt" ? "brand" : "outline"} 
                onClick={() => setFormat("txt")}
                className="flex-1 sm:flex-none h-12 rounded-xl font-black gap-2"
              >
                <FileText size={16} /> TXT
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Available Records ({filteredChats.length})
            </h3>
            <button 
              onClick={selectAll}
              className="text-[10px] font-black text-brand uppercase tracking-widest hover:underline"
            >
              {selectedIds.length === filteredChats.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-2 no-scrollbar">
            {filteredChats.map(chat => {
              const isSelected = selectedIds.includes(chat._id);
              return (
                <div 
                  key={chat._id}
                  onClick={() => toggleSelect(chat._id)}
                  className={cn(
                    "p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between group",
                    isSelected 
                      ? "bg-brand/5 border-brand/20 shadow-sm" 
                      : "bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-slate-200 dark:hover:border-white/10"
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0",
                      isSelected ? "bg-brand text-white" : "bg-slate-50 dark:bg-white/5 text-slate-400"
                    )}>
                      {isSelected ? <Check size={20} /> : <MessageSquare size={20} />}
                    </div>
                    <div className="min-w-0">
                      <div className={cn("text-sm font-black truncate", isSelected ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300")}>
                        {chat.title}
                      </div>
                      <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-2">
                        <Calendar size={10} />
                        {new Date(chat.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#0b0c14] flex items-center justify-between">
          <div className="text-xs font-medium text-slate-500">
            <span className="text-slate-900 dark:text-white font-black">{selectedIds.length}</span> records selected
          </div>
          <Button 
            disabled={selectedIds.length === 0 || isExporting}
            onClick={handleExport}
            className="bg-brand hover:bg-brand-dark text-white rounded-2xl px-10 h-14 font-black shadow-xl shadow-brand/20 gap-3 text-lg"
          >
            {isExporting ? <Loader2 className="animate-spin" size={24} /> : <Download size={24} />}
            Initialize Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
