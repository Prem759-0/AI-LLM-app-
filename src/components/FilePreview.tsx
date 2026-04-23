import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog.tsx";
import { FileText, Image as ImageIcon, FileCode, FileJson, X, Download, Copy, Maximize2, Sparkles, Share2 } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { cn } from "../lib/utils.ts";
import { toast } from "sonner";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { lucario as codeStyle } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface FilePreviewProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onShare?: (id: string, name: string) => void;
  file: {
    _id?: string;
    name: string;
    type: string;
    size: string;
    content: string;
    isShared?: boolean;
  } | null;
}

export default function FilePreview({ isOpen, onOpenChange, onShare, file }: FilePreviewProps) {
  if (!file) return null;

  const isImage = file.type.startsWith("image/");
  const isCode = file.type.includes("javascript") || 
                 file.type.includes("typescript") || 
                 file.type.includes("code") || 
                 file.type.includes("html") || 
                 file.type.includes("css") ||
                 file.name.endsWith(".ts") || 
                 file.name.endsWith(".tsx") || 
                 file.name.endsWith(".js") || 
                 file.name.endsWith(".py") || 
                 file.name.endsWith(".rust") || 
                 file.name.endsWith(".go");
  const isJson = file.type.includes("json") || file.name.endsWith(".json");

  // Determine language for highlighting
  const getLanguage = () => {
    if (file.name.endsWith(".js")) return "javascript";
    if (file.name.endsWith(".ts") || file.name.endsWith(".tsx")) return "typescript";
    if (file.name.endsWith(".py")) return "python";
    if (file.name.endsWith(".html")) return "html";
    if (file.name.endsWith(".css")) return "css";
    if (file.name.endsWith(".json")) return "json";
    return "javascript";
  };

  const getIcon = () => {
    if (isImage) return <ImageIcon className="text-purple-500" />;
    if (isJson) return <FileJson className="text-amber-500" />;
    if (isCode) return <FileCode className="text-emerald-500" />;
    return <FileText className="text-blue-500" />;
  };

  const copyContent = () => {
    if (file.content) {
      navigator.clipboard.writeText(file.content);
      toast.success("Content synchronized to neural clipboard");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-[#0b0c14] border-slate-200 dark:border-white/10 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.4)]">
        <DialogHeader className="p-8 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between space-y-0 bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center shadow-xl border border-slate-100 dark:border-white/5">
              {getIcon()}
            </div>
            <div>
              <DialogTitle className="text-2xl font-black text-slate-800 dark:text-white truncate max-w-[300px] sm:max-w-xl italic uppercase tracking-tighter">
                {file.name}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2 flex items-center gap-3">
                <span className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">{file.type}</span>
                <span className="w-1 h-1 bg-slate-300 rounded-full" />
                <span className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-md">{file.size}</span>
                {file.isShared && (
                  <span className="bg-brand/10 text-brand px-2 py-0.5 rounded-md border border-brand/20 flex items-center gap-1.5 animate-pulse">
                    <Sparkles size={10} /> Neural Link Active
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isImage && (
              <Button variant="ghost" size="icon" onClick={copyContent} className="h-12 w-12 text-slate-400 hover:text-brand rounded-2xl bg-white dark:bg-white/5 border border-transparent hover:border-slate-100 dark:hover:border-white/10 transition-all">
                <Copy size={20} />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-12 w-12 text-slate-400 hover:text-red-500 rounded-2xl bg-white dark:bg-white/5 border border-transparent hover:border-red-100 dark:hover:border-red-900/20 transition-all">
              <X size={24} />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-0 bg-slate-50/20 dark:bg-black/40">
          {isImage ? (
            <div className="w-full h-full flex items-center justify-center p-12 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-90">
              <div className="relative group">
                <div className="absolute -inset-4 bg-brand/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <img 
                  src={file.content} 
                  alt={file.name} 
                  className="max-w-full max-h-[60vh] object-contain rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.5)] border border-white/20 relative z-10"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col p-8 md:p-12 overflow-hidden">
              <div className="flex-1 overflow-auto rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl bg-[#011627] no-scrollbar">
                {isCode || isJson ? (
                  <SyntaxHighlighter
                    language={getLanguage()}
                    style={codeStyle}
                    customStyle={{
                      margin: 0,
                      padding: '2rem',
                      background: 'transparent',
                      fontSize: '14px',
                      fontFamily: 'JetBrains Mono, monospace',
                      lineHeight: '1.6'
                    }}
                    showLineNumbers={true}
                  >
                    {file.content || ""}
                  </SyntaxHighlighter>
                ) : (
                  <div className="p-10 font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed selection:bg-brand/20">
                    {file.content || "Null content detected in synthesis cache."}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-slate-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#0b0c14]">
          <div className="flex items-center gap-2">
             <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Asset Verified
             </div>
          </div>
          <div className="flex items-center gap-4">
             <Button 
               variant="outline" 
               className="rounded-2xl h-14 px-8 border-slate-200 dark:border-white/10 font-black text-slate-600 dark:text-slate-400 gap-3 hover:bg-slate-50 transition-all uppercase text-[10px] tracking-widest italic"
               onClick={() => {
                 if (file._id && onShare) {
                    onShare(file._id, file.name);
                 }
               }}
             >
               <Share2 size={18} />
               Configure Link
             </Button>
             <Button className="bg-brand text-white hover:bg-brand-dark rounded-2xl px-10 h-14 font-black shadow-2xl shadow-brand/20 gap-3 transition-all hover:scale-105 active:scale-95 uppercase italic tracking-tighter text-lg">
               <Download size={20} />
               Neutral Extraction
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
