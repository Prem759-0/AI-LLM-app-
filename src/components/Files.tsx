import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { FileText, Upload, File, FileCode, FileJson, MoreVertical, Search, Download, Trash2, Share2, HardDrive, Image as ImageIcon } from "lucide-react";
import { Card } from "./ui/card.tsx";
import { Button } from "./ui/button.tsx";
import { cn } from "../lib/utils.ts";
import { Progress } from "./ui/progress.tsx";
import PremiumModal from "./PremiumModal.tsx";
import api from "../lib/api.ts";
import { toast } from "sonner";

export default function Files() {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [purgingFileId, setPurgingFileId] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await api.get("files");
      setFiles(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error("Failed to load your neural assets. Database connection may be initializing.");
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (id: string) => {
    try {
      await api.delete(`files/${id}`);
      setFiles(prev => prev.filter(f => f._id !== id));
      toast.success("Asset removed from library");
      setPurgingFileId(null);
    } catch (err) {
      toast.error("Failed to delete asset. Retrieval failure.");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const toastId = toast.loading(`Uploading ${file.name}...`);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const res = await api.post("files", {
          name: file.name,
          size: (file.size / 1024).toFixed(1) + " KB",
          type: file.type || "unknown",
          content: file.type.startsWith('image/') ? content : content.slice(0, 50000)
        });
        
        setFiles(prev => [res.data, ...prev]);
        toast.success("Asset synthesized and stored", { id: toastId });
      } catch (err: any) {
        toast.error(err.response?.data?.error || "Upload failed", { id: toastId });
      }
    };

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const filteredFiles = files.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="text-purple-500" />;
    if (type.includes("json")) return <FileJson className="text-amber-500" />;
    if (type.includes("code") || type.includes("javascript") || type.includes("typescript")) return <FileCode className="text-emerald-500" />;
    return <FileText className="text-blue-500" />;
  };

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto px-4 md:px-8 py-8 overflow-y-auto no-scrollbar">
      <PremiumModal isOpen={showPremiumModal} onOpenChange={setShowPremiumModal} />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 flex items-center gap-4">
            <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
              <FileText size={32} />
            </div>
            Files
          </h1>
          <p className="text-slate-500 mt-4 text-lg max-w-xl leading-relaxed">
            Securely store and manage documents, datasets, and code files to use as context for your AI conversations.
          </p>
        </motion.div>
        
        <div className="flex flex-col gap-4">
          <label className="cursor-pointer">
            <input type="file" className="hidden" onChange={handleFileUpload} />
            <div className="bg-brand hover:bg-brand-dark text-white rounded-[1.25rem] px-8 h-14 font-black shadow-xl shadow-brand/20 gap-3 text-lg flex items-center justify-center">
              <Upload size={20} />
              Upload File
            </div>
          </label>
          <div className="glass p-4 rounded-2xl border-white/50 dark:bg-white/5 dark:border-white/10 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                <HardDrive size={12} />
                Storage
              </div>
              <span className="text-[10px] font-black text-brand uppercase tracking-widest">12% Used</span>
            </div>
            <Progress value={12} className="h-1.5 bg-slate-100" />
            <p className="text-[9px] text-slate-400 mt-2 font-bold">1.2 GB of 10 GB used</p>
          </div>
        </div>
      </div>

      <div className="relative mb-10 group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={24} />
        <input 
          type="text" 
          placeholder="Search your files..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2rem] py-4 pl-14 pr-6 shadow-sm focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all text-lg dark:text-white"
        />
      </div>

      <div className="glass rounded-[2rem] md:rounded-[2.5rem] border-white/50 dark:bg-white/5 dark:border-white/10 overflow-hidden shadow-2xl mb-12 transition-colors">
        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 bg-slate-50/50 dark:bg-black/20 border-b border-slate-200/50 dark:border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <div className="col-span-6">File Name</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-3">Date Modified</div>
          <div className="col-span-1"></div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {filteredFiles.map((f, i) => (
            <motion.div 
              key={f._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col md:grid md:grid-cols-12 gap-4 px-6 md:px-8 py-6 items-start md:items-center hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
            >
              <div className="w-full md:col-span-6 flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-white/5 group-hover:scale-110 transition-transform shrink-0">
                  {getIcon(f.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm md:text-base font-black text-slate-800 dark:text-slate-100 group-hover:text-brand transition-colors truncate block">{f.name}</span>
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{f.type}</p>
                </div>
              </div>
              <div className="flex items-center justify-between w-full md:contents">
                <div className="md:col-span-2 text-[10px] md:text-xs text-slate-500 font-black">{f.size}</div>
                <div className="md:col-span-3 text-[10px] md:text-xs text-slate-500 font-black">{new Date(f.createdAt).toLocaleDateString()}</div>
                <div className="md:col-span-1 flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 text-slate-400 hover:text-brand rounded-xl md:opacity-0 group-hover:opacity-100 transition-all cursor-pointer"><Download size={16} /></Button>
                  <Button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      if (purgingFileId === f._id) {
                        deleteFile(f._id);
                      } else {
                        setPurgingFileId(f._id);
                        setTimeout(() => setPurgingFileId(null), 3000);
                      }
                    }} 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "h-8 w-8 md:h-10 md:w-10 rounded-xl transition-all cursor-pointer md:opacity-0 group-hover:opacity-100",
                      purgingFileId === f._id 
                        ? "bg-red-500 text-white hover:bg-red-600 scale-110 w-auto px-3 opacity-100" 
                        : "text-slate-400 hover:text-red-500"
                    )}
                  >
                    {purgingFileId === f._id ? (
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <Trash2 size={14} />
                        <span className="text-[10px] font-black uppercase">Confirm</span>
                      </div>
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {!loading && filteredFiles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 glass rounded-[3rem] border-white/50 dark:bg-white/5 dark:border-white/10 transition-colors">
          <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 relative">
            <div className="absolute inset-0 bg-slate-200/50 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            <Upload size={48} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">No files uploaded</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-2 leading-relaxed font-medium">
              Upload documents or datasets to provide context for your AI assistant.
            </p>
          </div>
          <Button 
            onClick={() => setShowPremiumModal(true)}
            className="bg-brand hover:bg-brand-dark text-white rounded-2xl px-8 h-12 font-black shadow-lg shadow-brand/20"
          >
            Upload First File
          </Button>
        </div>
      )}
    </div>
  );
}
