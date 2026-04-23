import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Upload, File, FileCode, FileJson, MoreVertical, Search, Download, Trash2, Share2, HardDrive, Image as ImageIcon, ArrowUpDown, ChevronDown, Check, Link2, X, Sparkles } from "lucide-react";
import { Card } from "./ui/card.tsx";
import { Button } from "./ui/button.tsx";
import { cn } from "../lib/utils.ts";
import { Progress } from "./ui/progress.tsx";
import PremiumModal from "./PremiumModal.tsx";
import api from "../lib/api.ts";
import { toast } from "sonner";
import FilePreview from "./FilePreview.tsx";
import { useAuth } from "../App.tsx";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu.tsx";

export default function Files() {
  const { user } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [purgingFileId, setPurgingFileId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"name" | "size" | "date">("date");
  
  // Preview state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const res = await api.get("files");
      setFiles(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to load neural assets");
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (id: string) => {
    try {
      await api.delete(`files/${id}`);
      setFiles(prev => prev.filter(f => f._id !== id));
      toast.success("Asset purged from memory");
      setPurgingFileId(null);
    } catch (err) {
      toast.error("Failed to delete asset");
    }
  };

  const shareFile = async (id: string, fileName: string) => {
    try {
      const res = await api.post(`files/${id}/share`);
      const shareUrl = res.data.shareUrl;
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success(`Share link for ${fileName} copied to clipboard!`);
      } else {
        toast.info(`Sharing enabled for ${fileName}`);
      }
      fetchFiles(); // Refresh to show shared status
    } catch (err) {
      toast.error("Failed to generate share link");
    }
  }

  const handlePreview = (file: any) => {
    setSelectedFile(file);
    setPreviewOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Capacity Check - limit to 4 files for free tier
    const isPro = user?.isPro || false;
    const limit = isPro ? 100 : 4;
    
    if (files.length >= limit) {
      setShowPremiumModal(true);
      return;
    }

    setUploadProgress(10);
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      setUploadProgress(40);
      try {
        const content = event.target?.result as string;
        
        // Progress simulation for better feedback since small files are instant
        const uploadTimer = setInterval(() => {
          setUploadProgress(prev => {
            if (prev === null) return null;
            if (prev >= 90) {
              clearInterval(uploadTimer);
              return 90;
            }
            return prev + 5;
          });
        }, 100);

        const res = await api.post("files", {
          name: file.name,
          size: (file.size / 1024).toFixed(1) + " KB",
          type: file.type || "unknown",
          content: file.type.startsWith('image/') ? content : content.slice(0, 50000)
        });
        
        clearInterval(uploadTimer);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(null), 1000);
        setFiles(prev => [res.data, ...prev]);
        toast.success(`Successfully synthesized: ${file.name}`);
      } catch (err: any) {
        setUploadProgress(null);
        toast.error(err.response?.data?.error || "Neural upload failure");
      }
    };

    reader.onerror = () => {
      setUploadProgress(null);
      toast.error("Asset read error");
    };

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  const parseSize = (sizeStr: string) => {
    const num = parseFloat(sizeStr.split(' ')[0]);
    if (sizeStr.includes('MB')) return num * 1024;
    return num;
  };

  const sortedFiles = [...files].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "size") return parseSize(b.size) - parseSize(a.size);
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }).filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getIcon = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="text-purple-500" />;
    if (type.includes("json")) return <FileJson className="text-amber-500" />;
    if (type.includes("code") || type.includes("javascript") || type.includes("typescript") || type.includes("css") || type.includes("html")) return <FileCode className="text-emerald-500" />;
    return <FileText className="text-blue-500" />;
  };

  const storageUsedPercent = Math.min((files.length / (user?.isPro ? 100 : 4)) * 100, 100);

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto px-4 md:px-8 py-8 overflow-y-auto no-scrollbar">
      <PremiumModal isOpen={showPremiumModal} onOpenChange={setShowPremiumModal} />
      <FilePreview isOpen={previewOpen} onOpenChange={setPreviewOpen} onShare={shareFile} file={selectedFile} />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white flex items-center gap-4 italic tracking-tighter uppercase">
            <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
              <HardDrive size={32} />
            </div>
            Neural Assets
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-4 text-lg max-w-xl leading-relaxed italic pr-4">
            Manage your high-density context datasets for real-time synthesis.
          </p>
        </motion.div>
        
        <div className="flex flex-col gap-4 min-w-[280px]">
          <label className="cursor-pointer group">
            <input type="file" className="hidden" onChange={handleFileUpload} />
            <div className="bg-brand hover:bg-brand-dark text-white rounded-2xl px-8 h-16 font-black shadow-xl shadow-brand/20 gap-3 text-lg flex items-center justify-center transition-all hover:scale-[1.02] active:scale-95 uppercase italic tracking-tighter">
              <Upload size={20} className="group-hover:-translate-y-1 transition-transform" />
              Upload Asset
            </div>
          </label>
          
          <AnimatePresence>
            {uploadProgress !== null && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-brand/20 shadow-2xl z-20"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-brand animate-spin" />
                    <span className="text-[10px] font-black text-brand uppercase tracking-widest">{uploadProgress === 100 ? "Sync Complete" : "Synthesizing..."}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-500">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2 bg-slate-100 dark:bg-white/5" />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="glass p-5 rounded-[2rem] border-white/50 dark:bg-white/5 dark:border-white/10 shadow-sm transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <HardDrive size={12} className="text-brand" />
                Network Storage
              </div>
              <span className="text-[10px] font-black text-brand uppercase tracking-widest">{Math.round(storageUsedPercent)}% used</span>
            </div>
            <Progress value={storageUsedPercent} className="h-2 bg-slate-100 dark:bg-white/5" />
            <div className="flex items-center justify-between mt-3">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{files.length} / {user?.isPro ? 100 : 4} Assets</p>
              {!user?.isPro && (
                <button onClick={() => setShowPremiumModal(true)} className="text-[9px] font-black text-brand hover:underline uppercase tracking-widest">Upgrade Tier</button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1 group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-brand transition-colors" size={24} />
          <input 
            type="text" 
            placeholder="Search neural library by name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] py-5 pl-14 pr-6 shadow-sm focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all text-lg dark:text-white"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="h-[72px] px-8 rounded-[2.5rem] border-slate-200 dark:border-white/10 font-bold text-slate-600 dark:text-slate-300 gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-all outline-none">
              <ArrowUpDown size={20} className="text-brand" />
              <div className="text-left">
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Sort Protocol</div>
                <div className="text-xs uppercase tracking-tight font-black">{sortBy}</div>
              </div>
              <ChevronDown size={14} className="opacity-50 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 rounded-2xl dark:bg-slate-900 border-white/10 shadow-2xl">
            <div className="px-3 py-2 text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Select ordering logic:</div>
            <DropdownMenuItem onClick={() => setSortBy("date")} className="rounded-xl py-3 cursor-pointer">
              <Check className={cn("mr-3", sortBy === "date" ? "text-brand" : "opacity-0")} size={16} /> Date Sync
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("name")} className="rounded-xl py-3 cursor-pointer">
              <Check className={cn("mr-3", sortBy === "name" ? "text-brand" : "opacity-0")} size={16} /> Alphanumeric
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSortBy("size")} className="rounded-xl py-3 cursor-pointer">
              <Check className={cn("mr-3", sortBy === "size" ? "text-brand" : "opacity-0")} size={16} /> Data Volume
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="glass rounded-[2rem] md:rounded-[3.5rem] border-white/50 dark:bg-white/5 dark:border-white/10 overflow-hidden shadow-2xl mb-12 transition-colors">
        <div className="hidden md:grid grid-cols-12 gap-4 px-12 py-6 bg-slate-50/50 dark:bg-black/40 border-b border-slate-200/50 dark:border-white/5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <div className="col-span-6 flex items-center gap-2">
            <FileText size={12} className="text-brand" />
            Asset Specification
          </div>
          <div className="col-span-2">Density</div>
          <div className="col-span-3">Network Entry</div>
          <div className="col-span-1"></div>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-white/5">
          {sortedFiles.map((f, i) => (
            <motion.div 
              key={f._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col md:grid md:grid-cols-12 gap-4 px-8 md:px-12 py-8 items-start md:items-center hover:bg-slate-50/50 dark:hover:bg-white/[0.04] transition-all cursor-pointer group"
              onClick={() => handlePreview(f)}
            >
              <div className="w-full md:col-span-6 flex items-center gap-6">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-md border border-slate-100 dark:border-white/5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shrink-0">
                  {getIcon(f.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-lg md:text-xl font-black text-slate-800 dark:text-slate-100 group-hover:text-brand transition-colors truncate block italic tracking-tighter uppercase">{f.name}</span>
                  <div className="flex items-center gap-3 mt-1.5">
                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">{f.type}</p>
                    {f.isShared && (
                      <span className="flex items-center gap-1.5 text-[9px] font-black bg-brand/10 text-brand px-2 py-0.5 rounded-full uppercase tracking-tighter border border-brand/20">
                        <Share2 size={10} /> Link Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between w-full md:contents">
                <div className="md:col-span-2 text-xs text-slate-500 font-bold dark:text-slate-400 uppercase tracking-widest">{f.size}</div>
                <div className="md:col-span-3 text-xs text-slate-500 font-bold dark:text-slate-400 uppercase tracking-widest">{new Date(f.createdAt).toLocaleDateString()}</div>
                <div className="md:col-span-1 flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-12 w-12 text-slate-400 hover:text-brand rounded-2xl md:opacity-0 group-hover:opacity-100 transition-all cursor-pointer bg-white/50 dark:bg-white/5 border border-transparent hover:border-slate-100 dark:hover:border-white/10"
                    onClick={(e) => { e.stopPropagation(); shareFile(f._id, f.name); }}
                  >
                    <Share2 size={18} />
                  </Button>
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
                      "h-12 w-12 rounded-2xl transition-all cursor-pointer md:opacity-0 group-hover:opacity-100 bg-white/50 dark:bg-white/5 border border-transparent",
                      purgingFileId === f._id 
                        ? "bg-red-500 text-white hover:bg-red-600 scale-110 w-auto px-5 opacity-100 border-none shadow-lg shadow-red-500/20" 
                        : "text-slate-400 hover:text-red-500 hover:border-red-100 dark:hover:border-red-900/20"
                    )}
                  >
                    {purgingFileId === f._id ? (
                      <div className="flex items-center gap-2 whitespace-nowrap">
                        <Trash2 size={14} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Purge Memory</span>
                      </div>
                    ) : (
                      <Trash2 size={18} />
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {!loading && sortedFiles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 text-center space-y-10 glass rounded-[4rem] border-white/50 dark:bg-white/5 dark:border-white/10 transition-colors">
          <div className="w-32 h-32 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 relative">
            <div className="absolute inset-0 bg-brand/10 rounded-full animate-ping" style={{ animationDuration: '5s' }} />
            <div className="absolute inset-0 bg-brand/5 rounded-full animate-pulse" />
            <Upload size={64} className="relative z-10" />
          </div>
          <div>
            <h3 className="text-4xl font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">Null Asset Library</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-4 leading-relaxed font-bold italic text-lg pr-4">
              Your high-bandwidth vault is currently empty. Initiate an upload to expand Cortex's synthesis capabilities.
            </p>
          </div>
          <Button 
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.onchange = (e: any) => handleFileUpload(e);
              input.click();
            }}
            className="bg-brand hover:bg-brand-dark text-white rounded-[2rem] px-16 h-20 font-black shadow-2xl shadow-brand/20 uppercase italic tracking-widest text-xl group transition-all hover:scale-105 active:scale-95"
          >
            Start Synthesis
            <Sparkles size={24} className="ml-4 group-hover:rotate-12 transition-transform" />
          </Button>
        </div>
      )}
    </div>
  );
}
