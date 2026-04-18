import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { History, Search, Trash2, MessageSquare, Calendar, Filter, Clock, MoreVertical, Share2, Download, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { cn } from "../lib/utils.ts";
import api from "../lib/api.ts";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Chat {
  _id: string;
  title: string;
  updatedAt: string;
}

export default function HistoryPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChats, setSelectedChats] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChats(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchChats = async (query = "") => {
    try {
      const res = await api.get(`chat${query ? `?q=${query}` : ""}`);
      setChats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteChat = async (id: string) => {
    try {
      await api.delete(`chat/${id}`);
      setChats(chats.filter(c => c._id !== id));
      toast.success("Chat deleted");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete chat");
    }
  };

  const deleteSelected = async () => {
    if (!window.confirm(`Delete ${selectedChats.length} selected chats?`)) return;
    try {
      await Promise.all(selectedChats.map(id => api.delete(`chat/${id}`)));
      setChats(chats.filter(c => !selectedChats.includes(c._id)));
      setSelectedChats([]);
      setIsSelectionMode(false);
      toast.success(`${selectedChats.length} chats deleted`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete some chats");
    }
  };

  const toggleSelection = (id: string) => {
    if (selectedChats.includes(id)) {
      setSelectedChats(selectedChats.filter(c => c !== id));
    } else {
      setSelectedChats([...selectedChats, id]);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto px-4 md:px-8 py-8 overflow-y-auto no-scrollbar transition-colors">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white flex items-center gap-4 italic tracking-tighter">
            <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
              <History size={32} />
            </div>
            Chat History
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-4 text-lg max-w-xl leading-relaxed italic pr-4">
            Review, organize, and manage your past conversations with Cortex AI.
          </p>
        </motion.div>

        <div className="flex items-center gap-3">
          {isSelectionMode ? (
            <>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedChats([]);
                }}
                className="rounded-xl font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 h-12 px-6"
              >
                Cancel
              </Button>
              <Button 
                onClick={deleteSelected}
                disabled={selectedChats.length === 0}
                className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-6 h-12 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-500/20 gap-2 transition-all hover:scale-105 active:scale-95"
              >
                <Trash2 size={16} />
                Delete ({selectedChats.length})
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              onClick={() => setIsSelectionMode(true)}
              className="rounded-xl border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest h-12 px-6 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
            >
              Select Chats
            </Button>
          )}
        </div>
      </div>

      <div className="relative mb-10 group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-brand transition-colors" size={24} />
        <input 
          type="text" 
          placeholder="Search your history..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 rounded-[2rem] py-5 pl-14 pr-6 shadow-sm focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all text-lg dark:text-white"
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 dark:text-slate-600 font-black uppercase tracking-widest text-xs">Loading History...</p>
        </div>
      ) : chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 glass rounded-[3rem] dark:bg-slate-900/50">
          <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700 relative">
            <div className="absolute inset-0 bg-slate-200/50 dark:bg-white/5 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            <MessageSquare size={48} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white italic tracking-tighter">No history found</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2 leading-relaxed font-medium">
              Your past conversations will appear here once you start chatting with Cortex.
            </p>
          </div>
          <Button 
            onClick={() => navigate("/chat")}
            className="bg-brand hover:bg-brand-dark text-white rounded-2xl px-10 h-14 font-black uppercase text-xs tracking-widest shadow-xl shadow-brand/20 transition-all hover:scale-105"
          >
            Start New Genesis
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 mb-12">
          {chats.map((chat, i) => (
            <motion.div
              key={chat._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "glass p-6 rounded-[2rem] border-white/50 dark:border-white/5 shadow-sm hover:shadow-xl dark:hover:bg-white/5 transition-all flex items-center justify-between group cursor-pointer relative overflow-hidden",
                selectedChats.includes(chat._id) && "ring-2 ring-brand bg-brand/5 dark:bg-brand/10"
              )}
              onClick={() => isSelectionMode ? toggleSelection(chat._id) : navigate(`/chat/${chat._id}`)}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6 w-full">
                {isSelectionMode ? (
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                    selectedChats.includes(chat._id) ? "bg-brand border-brand text-white" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  )}>
                    {selectedChats.includes(chat._id) && <CheckCircle2 size={14} />}
                  </div>
                ) : (
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-brand/10 dark:bg-brand/20 rounded-xl md:rounded-2xl flex items-center justify-center text-brand group-hover:bg-brand group-hover:text-white transition-all shadow-sm shrink-0">
                    <MessageSquare size={24} className="md:hidden" />
                    <MessageSquare size={28} className="hidden md:block" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="text-base md:text-lg font-black text-slate-800 dark:text-white group-hover:text-brand transition-colors truncate uppercase italic tracking-tighter">{chat.title || "Untilted Synthesis"}</h3>
                  <div className="flex items-center gap-3 md:gap-4 mt-1.5">
                    <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <Calendar size={10} />
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      <Clock size={10} />
                      {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
              
              {!isSelectionMode && (
                <div className="flex items-center gap-1 md:gap-2 md:opacity-0 group-hover:opacity-100 transition-all shrink-0">
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 dark:text-slate-600 hover:text-brand rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-white/5"><Share2 size={16} /></Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 dark:text-slate-600 hover:text-brand rounded-xl border border-transparent hover:border-slate-100 dark:hover:border-white/5"><Download size={16} /></Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-10 w-10 text-slate-400 dark:text-slate-600 hover:text-red-500 rounded-xl border border-transparent hover:border-red-100 dark:hover:border-red-900/20"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat._id);
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
