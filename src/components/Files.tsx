import React from "react";
import { motion } from "framer-motion";
import { FileText, Upload, File, FileCode, FileJson, MoreVertical, Search, Download, Trash2, Share2, HardDrive } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { cn } from "../lib/utils.ts";
import { Progress } from "./ui/progress.tsx";

export default function Files() {
  const [files, setFiles] = React.useState<any[]>([]);

  const getIcon = (type: string) => {
    switch (type) {
      case "markdown": return <FileText className="text-blue-500" />;
      case "json": return <FileJson className="text-amber-500" />;
      case "code": return <FileCode className="text-emerald-500" />;
      case "pdf": return <FileText className="text-red-500" />;
      default: return <File className="text-slate-500" />;
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-6xl mx-auto px-4 md:px-8 py-8 overflow-y-auto no-scrollbar">
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
          <Button className="bg-brand hover:bg-brand-dark text-white rounded-[1.25rem] px-8 h-14 font-black shadow-xl shadow-brand/20 gap-3 text-lg">
            <Upload size={20} />
            Upload File
          </Button>
          <div className="glass p-4 rounded-2xl border-white/50 shadow-sm">
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
          className="w-full bg-white border border-slate-200 rounded-[2rem] py-4 pl-14 pr-6 shadow-sm focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all text-lg"
        />
      </div>

      <div className="glass rounded-[2rem] md:rounded-[2.5rem] border-white/50 overflow-hidden shadow-2xl mb-12">
        <div className="hidden md:grid grid-cols-12 gap-4 px-8 py-5 bg-slate-50/50 border-b border-slate-200/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          <div className="col-span-6">File Name</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-3">Date Modified</div>
          <div className="col-span-1"></div>
        </div>
        <div className="divide-y divide-slate-100">
          {files.map((f, i) => (
            <motion.div 
              key={f.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col md:grid md:grid-cols-12 gap-4 px-6 md:px-8 py-6 items-start md:items-center hover:bg-slate-50/50 transition-colors cursor-pointer group"
            >
              <div className="w-full md:col-span-6 flex items-center gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm border border-slate-100 group-hover:scale-110 transition-transform shrink-0">
                  {getIcon(f.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-sm md:text-base font-black text-slate-800 group-hover:text-brand transition-colors truncate block">{f.name}</span>
                  <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{f.type}</p>
                </div>
              </div>
              <div className="flex items-center justify-between w-full md:contents">
                <div className="md:col-span-2 text-[10px] md:text-xs text-slate-500 font-black">{f.size}</div>
                <div className="md:col-span-3 text-[10px] md:text-xs text-slate-500 font-black">{f.date}</div>
                <div className="md:col-span-1 flex justify-end gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 text-slate-400 hover:text-brand rounded-xl md:opacity-0 group-hover:opacity-100 transition-all"><Download size={16} /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 text-slate-400 hover:text-red-500 rounded-xl md:opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {files.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-6 glass rounded-[3rem] border-white/50">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 relative">
            <div className="absolute inset-0 bg-slate-200/50 rounded-full animate-ping" style={{ animationDuration: '3s' }} />
            <Upload size={48} />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800">No files uploaded</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-2 leading-relaxed font-medium">
              Upload documents or datasets to provide context for your AI assistant.
            </p>
          </div>
          <Button className="bg-brand hover:bg-brand-dark text-white rounded-2xl px-8 h-12 font-black shadow-lg shadow-brand/20">
            Upload First File
          </Button>
        </div>
      )}
    </div>
  );
}
