import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog.tsx";
import { FileText, Image as ImageIcon, FileCode, FileJson, X, Download, Copy, Maximize2 } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { cn } from "../lib/utils.ts";
import { toast } from "sonner";

interface FilePreviewProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  file: {
    name: string;
    type: string;
    size: string;
    content: string;
  } | null;
}

export default function FilePreview({ isOpen, onOpenChange, file }: FilePreviewProps) {
  if (!file) return null;

  const isImage = file.type.startsWith("image/");
  const isCode = file.type.includes("javascript") || file.type.includes("typescript") || file.type.includes("code") || file.name.endsWith(".ts") || file.name.endsWith(".tsx") || file.name.endsWith(".js") || file.name.endsWith(".py");
  const isJson = file.type.includes("json") || file.name.endsWith(".json");

  const getIcon = () => {
    if (isImage) return <ImageIcon className="text-purple-500" />;
    if (isJson) return <FileJson className="text-amber-500" />;
    if (isCode) return <FileCode className="text-emerald-500" />;
    return <FileText className="text-blue-500" />;
  };

  const copyContent = () => {
    if (file.content) {
      navigator.clipboard.writeText(file.content);
      toast.success("Content copied to neural clipboard");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden bg-white dark:bg-[#0b0c14] border-slate-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl">
        <DialogHeader className="p-6 border-b border-slate-100 dark:border-white/5 flex flex-row items-center justify-between space-y-0 bg-slate-50/50 dark:bg-white/5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 dark:border-white/5">
              {getIcon()}
            </div>
            <div>
              <DialogTitle className="text-xl font-black text-slate-800 dark:text-white truncate max-w-[200px] sm:max-w-md">
                {file.name}
              </DialogTitle>
              <DialogDescription className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2">
                {file.type} • {file.size}
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isImage && (
              <Button variant="ghost" size="icon" onClick={copyContent} className="h-10 w-10 text-slate-400 hover:text-brand rounded-xl">
                <Copy size={18} />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-10 w-10 text-slate-400 hover:text-red-500 rounded-xl">
              <X size={20} />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-0 bg-slate-50/30 dark:bg-black/20">
          {isImage ? (
            <div className="w-full h-full flex items-center justify-center p-8">
              <img 
                src={file.content} 
                alt={file.name} 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl border border-white/20"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="p-8">
              <pre className="font-mono text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed selection:bg-brand/10 bg-white dark:bg-slate-900/50 p-8 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-inner">
                {file.content || "No content available for synthesis."}
              </pre>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 dark:border-white/5 flex justify-end bg-white dark:bg-[#0b0c14]">
          <Button className="bg-brand text-white hover:bg-brand-dark rounded-2xl px-8 h-12 font-black shadow-lg shadow-brand/20 gap-2">
            <Download size={18} />
            Initialize Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
