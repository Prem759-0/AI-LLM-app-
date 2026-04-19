import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  Send, Mic, Image as ImageIcon, Lightbulb, 
  Search, Globe, Settings, Share2, Download, 
  Sparkles, Zap, BrainCircuit, CheckCircle2, RefreshCw,
  ChevronDown, Paperclip, Wand2, Brain, History, Copy,
  PanelLeftOpen, PanelLeftClose, FileJson, FileText, MicOff, Volume2, XCircle,
  Square, PlusCircle, Bold, Italic, List, Code2, Link as LinkIcon,
  Quote, Eye, Info, Crown, Pencil, Layers, Library, Plus, Trash2, 
  FileDown
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button.tsx";
import { ScrollArea } from "./ui/scroll-area.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.tsx";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "./ui/dropdown-menu.tsx";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription 
} from "./ui/dialog.tsx";
import { useAuth } from "../App.tsx";
import api from "../lib/api.ts";
import { cn } from "../lib/utils.ts";
import { streamChat } from "../lib/aiService.ts";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip.tsx";
import PremiumModal from "./PremiumModal.tsx";
import ContextManager from "./ContextManager.tsx";
import FilePreview from "./FilePreview.tsx";
import ExportModal from "./ExportModal.tsx";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export default function ChatInterface({ isSidebarOpen, setIsSidebarOpen }: ChatInterfaceProps) {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Usage Tracking
  const [usage, setUsage] = useState({ messages: 0, images: 0, files: 0 });

  useEffect(() => {
    if (user?.usage) {
      setUsage(user.usage);
    }
  }, [user]);

  const checkUsage = (type: 'messages' | 'images' | 'files') => {
    if (user?.isPro) return true;
    const limits = { messages: 15, images: 4, files: 4 };
    if (usage[type] >= limits[type]) {
      setShowPremiumModal(true);
      toast.error(`Neural capacity reached: ${limits[type]} ${type}. Priority upgrade required for additional synthesis.`);
      return false;
    }
    return true;
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("text");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [secondaryStreamingContent, setSecondaryStreamingContent] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ id?: string; name: string; content: string; type?: string; preview?: string } | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryFiles, setLibraryFiles] = useState<any[]>([]);

  useEffect(() => {
    if (showLibrary) {
      api.get("files").then(res => setLibraryFiles(res.data)).catch(() => toast.error("Failed to load library"));
    }
  }, [showLibrary]);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [chatTitle, setChatTitle] = useState("New Chat");
  const [showPreview, setShowPreview] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [deletingMessageIndex, setDeletingMessageIndex] = useState<number | null>(null);
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [allChats, setAllChats] = useState<any[]>([]);
  const [previewAssetOpen, setPreviewAssetOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  const openExportModal = async () => {
    try {
      const res = await api.get("chat");
      setAllChats(res.data);
      setShowExportModal(true);
    } catch (err) {
      toast.error("Cloud linkage failed: Unable to retrieve chat records");
    }
  };

  const handlePreviewAsset = (asset: any) => {
    setSelectedAsset({
      name: asset.name,
      type: asset.type || "text/plain",
      size: asset.size || "Unknown",
      content: asset.content
    });
    setPreviewAssetOpen(true);
  };

  const confirmPurge = (index: number) => {
    setDeletingMessageIndex(index);
    setShowPurgeConfirm(true);
  };

  const handleConfirmedPurge = () => {
    if (deletingMessageIndex !== null) {
      deleteMessage(deletingMessageIndex);
      setDeletingMessageIndex(null);
      setShowPurgeConfirm(false);
    }
  };

  const exportChat = (format: 'txt' | 'json') => {
    if (messages.length === 0) {
      toast.error("No intelligence history to export");
      return;
    }

    let content = "";
    let fileName = `cortex-session-${chatTitle.toLowerCase().replace(/\s+/g, '-') || id}`;
    let type = "";

    if (format === 'json') {
      content = JSON.stringify({
        title: chatTitle,
        id,
        exportedAt: new Date().toISOString(),
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      }, null, 2);
      fileName += ".json";
      type = "application/json";
    } else {
      content = `Cortex AI Synthesis Export\nSession: ${chatTitle || id}\nDate: ${new Date().toLocaleString()}\n\n`;
      content += messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
      fileName += ".txt";
      type = "text/plain";
    }

    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Session exported as ${format.toUpperCase()}`);
  };

  const deleteMessage = async (index: number) => {
    if (!id) return;
    const updatedMessages = messages.filter((_, i) => i !== index);
    setMessages(updatedMessages);
    try {
      await api.patch(`chat/${id}`, { messages: updatedMessages });
      toast.success("Memory purged");
    } catch (err) {
      console.error(err);
      toast.error("Failed to purge memory");
    }
  };

  const saveEditedMessage = async (index: number) => {
    if (!id || !editingContent.trim()) return;
    const updatedMessages = [...messages];
    updatedMessages[index] = { ...updatedMessages[index], content: editingContent };
    setMessages(updatedMessages);
    setEditingIndex(null);
    try {
      await api.patch(`chat/${id}`, { messages: updatedMessages });
      toast.success("Intelligence updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update intelligence");
    }
  };
  const [isSaving, setIsSaving] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isResearchMode, setIsResearchMode] = useState(false);
  const [isCreativeMode, setIsCreativeMode] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showContextManager, setShowContextManager] = useState(false);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [comparisonModel, setComparisonModel] = useState("thinking");
  const MAX_CHARS = 4000;
  
  const recognitionRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => (result as any)[0])
          .map((result: any) => result.transcript)
          .join('');
        setInput(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (!recognitionRef.current) {
        toast.error("Speech recognition not supported");
        return;
      }
      recognitionRef.current?.start();
      setIsListening(true);
      toast.info("Listening... Speak into your microphone.");
    }
  };

  const speakText = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const startListening = toggleListening;

  const insertMarkdown = (prefix: string, suffix: string = "") => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const text = textareaRef.current.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);
    
    const newText = before + prefix + selection + suffix + after;
    setInput(newText);
    
    setTimeout(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(
        start + prefix.length,
        end + prefix.length
      );
    }, 0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!checkUsage('files')) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      
      let preview: string | undefined = undefined;
      if (file.type.startsWith('image/')) {
        preview = content;
      }

      setAttachedFile({ 
        name: file.name, 
        content: file.type.startsWith('image/') ? '[Image Data]' : content.slice(0, 10000), 
        type: file.type,
        preview
      });
      setUsage(prev => ({ ...prev, files: prev.files + 1 }));
      toast.success(`File "${file.name}" attached`);
    };

    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  const modelOptions = [
    { id: "text", name: "Cortex Flash", desc: "Fast & efficient for daily synthesis", icon: Sparkles },
    { id: "thinking", name: "Cortex Thinking", desc: "Deep reasoning & complex visual logic", icon: Brain },
    { id: "code", name: "Cortex Coder", desc: "Advanced engineering & software logic", icon: BrainCircuit },
    { id: "tech", name: "Cortex Architect", desc: "Deep technical analysis & documentation", icon: Zap },
  ];

  useEffect(() => {
    if (id) {
      fetchChat();
    } else {
      setMessages([]);
      setChatTitle("New Chat");
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const fetchChat = async () => {
    try {
      const res = await api.get(`chat/${id}`);
      setMessages(res.data.messages);
      setChatTitle(res.data.title || "New Chat");
    } catch (err) {
      console.error(err);
      navigate("/");
    }
  };

  const summarizeChat = async () => {
    if (messages.length < 2) {
      toast.info("Start a conversation first to summarize!");
      return;
    }
    const toastId = toast.loading("Synthesizing chat summary...");
    try {
      const res = await api.post("ai/summarize", { messages });
      setChatTitle(res.data.summary);
      if (id) {
        await api.patch(`chat/${id}`, { title: res.data.summary });
      }
      toast.success("Chat summarized and titled!", { id: toastId, icon: <Sparkles size={16} className="text-brand" /> });
    } catch (err) {
      console.error(err);
      toast.error("Summarization failed", { id: toastId });
    }
  };

  const handleRename = async () => {
    if (!id || !chatTitle.trim()) return;
    setIsSaved(false);
    try {
      await api.patch(`chat/${id}`, { title: chatTitle });
      setIsEditingTitle(false);
      setIsSaved(true);
      toast.success("Chat renamed");
    } catch (err) {
      console.error(err);
      toast.error("Failed to rename chat");
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // Only show scroll button if we are more than 200px from the bottom
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 200;
    
    // Also, if total content is less than viewport, we are at bottom
    if (target.scrollHeight <= target.clientHeight) {
      setShowScrollButton(false);
      return;
    }
    
    setShowScrollButton(!isAtBottom);
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  };

  const MarkdownComponents: Components = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <div className="relative group/code my-6">
          <div className="absolute right-4 top-4 opacity-0 group-hover/code:opacity-100 transition-opacity z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20"
              onClick={() => {
                navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
                toast.success("Code copied");
              }}
            >
              <Copy size={14} />
            </Button>
          </div>
          <div className="flex items-center justify-between px-4 py-2 bg-slate-800 rounded-t-2xl border-b border-white/5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{match[1]}</span>
          </div>
          <pre className="!mt-0 !rounded-t-none" {...props}>
            <code className={className}>
              {children}
            </code>
          </pre>
        </div>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent, overrideInput?: string, overrideHistory?: Message[]) => {
    e?.preventDefault();
    const finalInput = overrideInput || input;
    
    if (!finalInput.trim()) {
      setInputError("Please enter a message");
      return;
    }
    
    if (finalInput.length > MAX_CHARS) {
      setInputError(`Message too long (max ${MAX_CHARS} characters)`);
      return;
    }

    if (isTyping) return;
    setInputError(null);

    let processedInput = finalInput;
    if (attachedFile) {
      processedInput = `File: ${attachedFile.name}\nContent:\n${attachedFile.content}\n\nUser Question: ${finalInput}`;
    }

    if (isResearchMode) {
      processedInput = `[DEEP RESEARCH MODE] Please provide a comprehensive, detailed analysis with citations and multiple perspectives on: ${finalInput}`;
    } else if (isCreativeMode) {
      processedInput = `[CREATIVE MODE] Be highly imaginative, descriptive, and poetic in your response about: ${finalInput}`;
    }

    if (!checkUsage('messages')) return;

    const currentHistory = overrideHistory || messages;
    const userMessage: Message = { role: "user", content: processedInput };
    setUsage(prev => ({ ...prev, messages: prev.messages + 1 }));
    const newMessagesForAI = [...currentHistory, userMessage];
    
    const displayMessages = [...currentHistory, { role: "user", content: finalInput } as Message];
    setMessages(displayMessages);
    
    setInput("");
    setAttachedFile(null);
    setIsTyping(true);
    setStreamingContent("");
    setSecondaryStreamingContent("");
    setIsResearchMode(false);
    setIsCreativeMode(false);
    
    // Auto-scroll on new message
    setTimeout(scrollToBottom, 100);

    try {
      let chatId = id;
      if (!chatId) {
        const res = await api.post("chat", { 
          title: finalInput.slice(0, 40) + (finalInput.length > 40 ? "..." : ""),
          messages: [{ role: "user", content: finalInput }]
        });
        chatId = res.data._id;
        navigate(`/chat/${chatId}`, { replace: true });
        // After creating, we don't need to patch immediately if we already sent messages in creation
        // But for consistency with streaming, we'll let the logic below handle it
      }

      setIsSaving(true);
      setIsSaved(false);
      let fullContent = "";
      let secondaryFullContent = "";
      abortControllerRef.current = new AbortController();
      
      // Primary Stream
      const stream = streamChat(newMessagesForAI, selectedModel);
      
      // Secondary Stream (if compare mode)
      const secondaryPromise = isCompareMode 
        ? (async () => {
            const secondaryStream = streamChat(newMessagesForAI, comparisonModel);
            for await (const chunk of secondaryStream) {
              if (abortControllerRef.current?.signal.aborted) break;
              secondaryFullContent += chunk;
              setSecondaryStreamingContent(secondaryFullContent);
            }
            return secondaryFullContent;
          })()
        : Promise.resolve("");

      for await (const chunk of stream) {
        if (abortControllerRef.current?.signal.aborted) break;
        fullContent += chunk;
        setStreamingContent(fullContent);
      }

      const [assistantContent, secondContent] = await Promise.all([
        Promise.resolve(fullContent),
        secondaryPromise
      ]);

      const assistantMessage: Message = { 
        role: "assistant", 
        content: isCompareMode 
          ? `### ${modelOptions.find(m => m.id === selectedModel)?.name} (Primary)\n${assistantContent}\n\n---\n\n### ${modelOptions.find(m => m.id === comparisonModel)?.name} (Secondary)\n${secondContent}`
          : assistantContent 
      };
      
      const finalMessages = [...displayMessages, assistantMessage];
      setMessages(finalMessages);
      setStreamingContent("");
      setSecondaryStreamingContent("");
      setIsTyping(false);

      // Update chat in DB
      await api.patch(`chat/${chatId}`, {
        messages: finalMessages,
        title: finalInput.slice(0, 30) + (finalInput.length > 30 ? "..." : ""),
      });
      setIsSaving(false);
      setIsSaved(true);

    } catch (err) {
      console.error(err);
      toast.error("AI response failed. Please check your Gemini API key.");
      setIsTyping(false);
    }
  };

  const stopGenerating = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsTyping(false);
      toast.info("Generation stopped");
    }
  };

  const clearChat = async () => {
    if (!id) return;
    try {
      await api.patch(`chat/${id}`, { messages: [] });
      setMessages([]);
      toast.success("Chat cleared");
    } catch (err) {
      console.error(err);
      toast.error("Failed to clear chat");
    }
  };

  const suggestions = [
    { icon: BrainCircuit, title: "Synthesize Data", desc: "Turn your meeting notes into 5 key bullet points for the team." },
    { icon: Lightbulb, title: "Creative Brainstorm", desc: "Generate 3 taglines for a new sustainable fashion brand." },
    { icon: CheckCircle2, title: "Check Facts", desc: "Compare key differences between GDPR and CCPA." },
  ];

  return (
    <div className="flex flex-col h-full bg-[#fcfcff] dark:bg-[#0b0c14] relative overflow-hidden transition-colors duration-500">
      {/* Header */}
      <header className="h-16 flex items-center justify-between border-b border-slate-200/50 dark:border-white/5 mb-2 shrink-0 px-4 md:px-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md z-30 sticky top-0 transition-colors">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl shrink-0 transition-all",
              isSidebarOpen && "md:hidden"
            )}
          >
            {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </Button>
          
            <div className="flex flex-col min-w-0">
              {isEditingTitle ? (
                <input
                  autoFocus
                  type="text"
                  value={chatTitle}
                  onChange={(e) => setChatTitle(e.target.value)}
                  onBlur={handleRename}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                  className="text-sm font-black text-slate-800 dark:text-white bg-slate-100/50 dark:bg-white/5 border-none rounded-lg px-2 py-0.5 focus:ring-2 focus:ring-brand/20 outline-none w-full max-w-[200px]"
                />
              ) : (
                <div 
                  className="flex items-center gap-1.5 cursor-pointer group/title min-w-0"
                  onClick={() => id && setIsEditingTitle(true)}
                >
                  <h2 className="text-sm md:text-base font-black text-slate-800 dark:text-white truncate tracking-tight group-hover/title:text-brand transition-colors uppercase italic tracking-tighter pr-4 max-w-[150px] sm:max-w-[250px] md:max-w-md">
                    {id ? chatTitle : "Neural Genesis"}
                  </h2>
                  {id && <Crown size={10} className="text-amber-500 shrink-0" />}
                </div>
              )}
              
              <div className="flex items-center gap-2 overflow-hidden mt-0.5">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] md:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">Aura v3.0 Core</span>
                </div>
                <div className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-white/5 p-0.5 rounded-lg border border-slate-200/50 dark:border-white/5 ml-4">
                  <Button variant="ghost" size="sm" className={cn("h-6 rounded-md text-[9px] font-black uppercase tracking-widest px-2", isCompareMode ? "bg-white dark:bg-slate-800 text-brand shadow-sm" : "text-slate-500 dark:text-slate-400")} onClick={() => setIsCompareMode(!isCompareMode)}>Compare</Button>
                {isCompareMode && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 rounded-md text-[9px] font-black uppercase tracking-widest px-2 bg-white dark:bg-slate-800 text-brand shadow-sm flex items-center gap-1">
                        {modelOptions.find(m => m.id === comparisonModel)?.name}
                        <ChevronDown size={8} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48 rounded-xl p-1 shadow-2xl border-slate-200 dark:border-white/5 dark:bg-slate-900">
                      <div className="px-2 py-1 text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Compare with:</div>
                      {modelOptions.map((opt) => (
                        <DropdownMenuItem 
                          key={opt.id} 
                          onClick={() => setComparisonModel(opt.id)}
                          className={cn(
                            "rounded-lg py-2 px-3 transition-all cursor-pointer font-bold text-xs",
                            comparisonModel === opt.id ? "bg-brand/5 text-brand" : "hover:bg-slate-50 dark:hover:bg-white/5"
                          )}
                        >
                          {opt.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button variant="ghost" size="sm" className={cn("h-6 rounded-md text-[9px] font-black uppercase tracking-widest px-2", showContextManager && "bg-white dark:bg-slate-800 text-indigo-600 shadow-sm")} onClick={() => setShowContextManager(!showContextManager)}>Context</Button>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 rounded-md text-slate-500 hover:text-brand px-2" onClick={summarizeChat}>
                        <Sparkles size={10} />
                        <span className="ml-1 text-[8px] font-black">Summarize</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl p-2 bg-slate-900 text-white text-[10px] font-bold border-none">
                      Generate AI Title
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 rounded-md text-slate-500 hover:text-brand px-2 transition-colors">
                      <FileDown size={10} />
                      <span className="ml-1 text-[8px] font-black uppercase tracking-widest">Export</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40 rounded-xl p-1 shadow-2xl border-slate-200 dark:border-white/5 dark:bg-slate-900 z-[100]">
                    <div className="px-2 py-1 text-[8px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Select Format:</div>
                    <DropdownMenuItem 
                      onClick={() => exportChat('txt')}
                      className="rounded-lg py-2 px-3 transition-all cursor-pointer font-bold text-xs hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                    >
                      <FileText size={14} className="text-blue-500" />
                      Text File (.txt)
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => exportChat('json')}
                      className="rounded-lg py-2 px-3 transition-all cursor-pointer font-bold text-xs hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2"
                    >
                      <FileJson size={14} className="text-amber-500" />
                      JSON Structure
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="dark:bg-white/5" />
                    <DropdownMenuItem 
                      onClick={openExportModal}
                      className="rounded-lg py-2 px-3 transition-all cursor-pointer font-black text-xs hover:bg-slate-50 dark:hover:bg-white/5 flex items-center gap-2 text-brand"
                    >
                      <Download size={14} />
                      Batch Export Hub...
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <AnimatePresence>
                {isSaving && (
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center gap-1 text-[9px] font-black text-brand uppercase tracking-widest bg-brand/5 px-2 py-0.5 rounded-md border border-brand/10 shrink-0"
                  >
                    <RefreshCw size={8} className="animate-spin" />
                    Syncing...
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4 shrink-0">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/chat")}
            className="h-10 w-10 text-slate-500 dark:text-slate-400 hover:text-brand dark:hover:text-brand rounded-xl border-2 border-slate-100 dark:border-white/5 hidden sm:flex transition-colors"
            title="New Chat"
          >
            <PlusCircle size={20} />
          </Button>
          <Dialog>
            <DialogTrigger 
              render={
                <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 dark:text-slate-400 hover:text-brand dark:hover:text-brand rounded-xl border-2 border-slate-100 dark:border-white/5 sm:flex hidden transition-colors">
                  <Settings size={20} />
                </Button>
              } 
            />
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-[2rem] p-0 border-none shadow-2xl dark:bg-slate-900 transition-colors">
              <div className="p-8">
                <DialogHeader className="mb-8">
                  <DialogTitle className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-4 tracking-tighter italic uppercase">
                    <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
                      <Settings size={24} />
                    </div>
                    System Settings
                  </DialogTitle>
                  <DialogDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-2">
                    Configure your neural lattice preferences and visual interface.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-10">
                  <section>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
                      <Brain size={12} className="text-brand" />
                      Neural Preferences
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-brand/20 transition-all group">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-black text-slate-700 dark:text-slate-300 tracking-tight">Aura Streaming</span>
                          <div className="w-10 h-5 bg-brand rounded-full relative shadow-inner"><div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" /></div>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold leading-relaxed opacity-70">Enable real-time response generation for near-instant feedback.</p>
                      </div>
                      <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-brand/20 transition-all opacity-60">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-black text-slate-700 dark:text-slate-500 tracking-tight">Deep Inquiry</span>
                          <div className="w-10 h-5 bg-slate-300 dark:bg-white/10 rounded-full relative shadow-inner" />
                        </div>
                        <p className="text-[10px] text-amber-600 dark:text-amber-500 font-black uppercase tracking-widest mt-1">Pro Feature</p>
                      </div>
                    </div>
                  </section>
                  <section>
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">
                      <Zap size={12} className="text-amber-500" />
                      Visual Theme
                    </div>
                    <div className="flex gap-4">
                      {['light', 'dark', 'system'].map(t => (
                        <Button key={t} variant="outline" className="flex-1 rounded-2xl font-black capitalize text-[10px] tracking-widest h-14 border-slate-100 hover:border-brand/30 hover:bg-brand/5 shadow-sm">
                          {t}
                        </Button>
                      ))}
                    </div>
                  </section>
                  <div className="pt-6 border-t border-slate-100">
                    <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl h-14 font-black shadow-xl" onClick={() => navigate("/settings")}>
                      Advanced Configuration
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <TooltipProvider>
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden sm:flex rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 px-4 border-2 border-slate-100 dark:border-white/10 h-10 transition-colors">
                      {React.createElement(modelOptions.find(m => m.id === selectedModel)?.icon || Sparkles, { size: 14 })}
                      {modelOptions.find(m => m.id === selectedModel)?.name}
                      <ChevronDown size={14} className="text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent className="rounded-xl p-3 bg-slate-900 text-white border-none shadow-xl">
                  <p className="text-xs font-bold">Switch Neural Model</p>
                  <p className="text-[10px] opacity-70">Current: {modelOptions.find(m => m.id === selectedModel)?.name}</p>
                </TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-72 rounded-2xl p-2 shadow-2xl border-slate-200 dark:border-white/10 dark:bg-slate-900 transition-colors">
                <div className="px-3 py-2 mb-1 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Select Model</div>
                {modelOptions.map((opt) => (
                  <DropdownMenuItem 
                    key={opt.id} 
                    onClick={() => setSelectedModel(opt.id)}
                    className={cn(
                      "flex flex-col items-start gap-1 rounded-xl py-3 px-4 transition-all cursor-pointer mb-1",
                      selectedModel === opt.id ? "bg-brand/5 border border-brand/10" : "hover:bg-slate-50 dark:hover:bg-white/5"
                    )}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", selectedModel === opt.id ? "bg-brand text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400")}>
                        <opt.icon size={16} />
                      </div>
                      <div className="flex-1">
                        <div className={cn("text-sm font-black", selectedModel === opt.id ? "text-brand" : "text-slate-900 dark:text-white")}>{opt.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 leading-tight">{opt.desc}</div>
                      </div>
                      {selectedModel === opt.id && <CheckCircle2 size={14} className="text-brand" />}
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </TooltipProvider>

          <Button 
            className="bg-slate-900 dark:bg-brand hover:bg-slate-800 dark:hover:bg-brand-dark text-white rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest px-4 h-10 shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95"
            onClick={() => setShowPremiumModal(true)}
          >
            <Crown size={14} className="fill-white" />
            <span className="hidden md:inline">Upgrade</span>
          </Button>
        </div>
      </header>

      <ScrollArea className={cn("flex-1 min-h-0", messages.length === 0 && "no-scrollbar")} onScroll={handleScroll}>
        <div className={cn(
          "mx-auto px-4 md:px-8 transition-all duration-500",
          messages.length === 0 ? "max-w-4xl h-full flex items-center justify-center p-0" : "py-4 space-y-8 max-w-4xl",
          isCompareMode && messages.length > 0 && "max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-8"
        )}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center space-y-12 w-full max-w-2xl">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 bg-brand rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-brand/30 relative group"
              >
                <div className="absolute inset-0 bg-brand rounded-[2.5rem] animate-ping opacity-20 group-hover:opacity-40 transition-opacity" />
                <Sparkles size={48} className="relative z-10" />
              </motion.div>
              
              <div className="space-y-4">
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic pr-4">
                  Neural <span className="brand-text-gradient">Genesis</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 dark:text-slate-500 font-medium leading-relaxed">
                  Your advanced neural partner for research, <br className="hidden sm:inline" /> creation, and complex problem solving.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full mt-8">
                {suggestions.map((s, i) => (
                  <motion.div
                    key={s.title}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 + 0.3 }}
                    className="p-6 rounded-[2rem] bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 hover:border-brand/40 dark:hover:border-brand/40 hover:shadow-2xl hover:shadow-brand/5 transition-all text-left cursor-pointer group flex flex-col items-start"
                    onClick={() => setInput(s.desc)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 dark:text-slate-600 group-hover:bg-brand/10 group-hover:text-brand transition-colors mb-4">
                      <s.icon size={20} />
                    </div>
                    <h3 className="font-black text-slate-800 dark:text-slate-200 text-sm mb-1 group-hover:text-brand transition-colors uppercase italic tracking-tighter">{s.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-500 font-medium leading-relaxed line-clamp-2">{s.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className={cn("space-y-8 h-full", isCompareMode ? "flex flex-col lg:flex-row gap-8" : "")}>
              <div className={cn("space-y-8", isCompareMode ? "flex-1 min-w-0" : "")}>
                {messages.map((m, i) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    key={m.id || i}
                    className={cn(
                      "flex gap-4 group/item",
                      m.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <Avatar className={cn(
                      "h-10 w-10 border-2 border-white shadow-lg shrink-0 transition-all hover:scale-110 active:scale-95 cursor-pointer",
                      m.role === "user" ? "bg-gradient-to-tr from-brand to-indigo-600 ring-2 ring-brand/10" : "bg-slate-900 ring-2 ring-slate-100"
                    )}>
                      {m.role === "user" ? (
                        <>
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} />
                          <AvatarFallback className="bg-brand text-white text-xs font-black">{user?.name?.[0]}</AvatarFallback>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-brand">
                          <Sparkles size={20} className="animate-pulse" />
                        </div>
                      )}
                    </Avatar>
                    <div className={cn(
                      "max-w-[85%] md:max-w-[75%] relative group/message transition-all",
                      m.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"
                    )}>
                      {editingIndex === i ? (
                        <div className="flex flex-col gap-2 min-w-[200px] sm:min-w-[300px]">
                          <textarea
                            autoFocus
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                saveEditedMessage(i);
                              }
                              if (e.key === "Escape") setEditingIndex(null);
                            }}
                            className="w-full bg-white/10 dark:bg-black/20 text-white dark:text-slate-200 text-sm md:text-base p-3 rounded-2xl outline-none focus:ring-2 focus:ring-white/30 border-none resize-none min-h-[80px]"
                          />
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setEditingIndex(null)}
                              className="text-white/60 hover:text-white hover:bg-white/10 h-8 font-black uppercase tracking-widest text-[9px]"
                            >
                              Cancel
                            </Button>
                            <Button 
                              size="sm" 
                              onClick={() => saveEditedMessage(i)}
                              className="bg-white text-brand hover:bg-white/90 h-8 font-black uppercase tracking-widest text-[9px] px-4"
                            >
                              Save Synthesis
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className={cn(
                          "prose prose-sm md:prose-base dark:prose-invert leading-relaxed",
                          m.role === "user" ? "text-white selection:bg-white/20" : "text-slate-700 dark:text-slate-300 selection:bg-brand/10"
                        )}>
                          <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                        </div>
                      )}
                      
                      <div className={cn(
                        "absolute top-0 flex gap-1 opacity-0 group-hover/message:opacity-100 transition-all duration-200 z-20",
                        m.role === "user" ? "-left-20 flex-row-reverse" : "-right-24"
                      )}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-100 dark:border-white/5 text-slate-400 dark:text-slate-500 hover:text-brand hover:scale-110 transition-all"
                          onClick={() => {
                            navigator.clipboard.writeText(m.content);
                            toast.success("Intelligence cloned to clipboard");
                          }}
                          title="Copy content"
                        >
                          <Copy size={14} />
                        </Button>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-100 dark:border-white/5 text-slate-400 dark:text-slate-500 hover:text-red-500 hover:scale-110 transition-all"
                            onClick={() => confirmPurge(i)}
                            title="Purge message"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                        {m.role === "assistant" && (
                          <div className="flex items-center gap-1">
                            <button
                              className={cn(
                                "h-8 w-8 rounded-xl bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-100 dark:border-white/5 transition-all flex items-center justify-center",
                                isSpeaking ? "text-brand animate-pulse bg-brand/5 border-brand/20 shadow-brand/10" : "text-slate-400 dark:text-slate-500 hover:text-brand hover:scale-110"
                              )}
                              onClick={() => speakText(m.content)}
                            >
                              {isSpeaking ? <XCircle size={14} className="text-red-500" /> : <Volume2 size={14} />}
                            </button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-xl bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-100 dark:border-white/5 text-slate-400 dark:text-slate-500 hover:text-brand hover:scale-110 transition-all"
                              onClick={() => {
                                const lastUserMessage = messages.filter((msg, idx) => msg.role === "user" && idx <= i).pop();
                                if (lastUserMessage) {
                                  // Re-synthesize from this point
                                  const historyUpToThisPoint = messages.slice(0, i);
                                  setMessages(historyUpToThisPoint);
                                  handleSubmit(undefined, lastUserMessage.content, historyUpToThisPoint);
                                }
                              }}
                              title="Re-synthesize from here"
                            >
                              <Wand2 size={14} />
                            </Button>
                          </div>
                        )}
                        {m.role === "user" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl bg-white/80 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm border border-slate-100 dark:border-white/5 text-slate-400 dark:text-slate-500 hover:text-brand hover:scale-110 transition-all"
                            onClick={() => {
                              setEditingIndex(i);
                              setEditingContent(m.content);
                            }}
                            title="Edit Intelligence"
                          >
                            <Pencil size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}

                {isTyping && (
                  <div className="flex gap-4">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-md bg-slate-900 shrink-0 flex items-center justify-center text-brand">
                      <Sparkles size={20} />
                    </Avatar>
                    <div className="chat-bubble-ai min-w-[120px]">
                      {(selectedModel === "thinking" || isResearchMode) && !streamingContent && (
                        <div className="flex items-center gap-2 text-brand mb-2 pb-2 border-b border-slate-50">
                          <Brain size={14} className="animate-thinking" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {isResearchMode ? "Synthesizing Knowledge..." : "Deep Reasoning..."}
                          </span>
                        </div>
                      )}
                      {streamingContent ? (
                        <div className="prose prose-sm md:prose-base dark:prose-invert">
                          <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex gap-1.5 py-2">
                          <div className="w-2 h-2 bg-brand/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-2 h-2 bg-brand/60 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-2 h-2 bg-brand/80 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {isCompareMode && (
                <div className="flex-1 min-w-0 border-l border-slate-200 pl-8 bg-slate-50/30 rounded-3xl p-6 h-fit sticky top-20">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic font-serif">Secondary Insight</span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black gap-2 bg-white shadow-sm border border-slate-200 uppercase tracking-widest px-3 rounded-lg">
                          {comparisonModel} <ChevronDown size={12} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="rounded-xl p-1 shadow-2xl">
                        {modelOptions.map(opt => (
                          <DropdownMenuItem key={opt.id} onClick={() => setComparisonModel(opt.id)} className="text-[10px] font-bold uppercase tracking-widest rounded-lg">
                            {opt.name}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="prose prose-sm text-slate-700 leading-relaxed font-sans">
                    {secondaryStreamingContent ? (
                      <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>{secondaryStreamingContent}</ReactMarkdown>
                    ) : (
                      <div className="opacity-60 italic font-serif flex flex-col items-center justify-center py-20 text-center">
                        <History size={32} className="mb-4 opacity-20" />
                        <p>Secondary model feedback will manifest here during active synthesis.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={scrollRef} />
        </div>
        <AnimatePresence>
          {showScrollButton && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 z-20"
            >
              <Button 
                onClick={scrollToBottom}
                size="sm"
                className="rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-slate-600 hover:bg-white shadow-xl gap-2 px-4"
              >
                <ChevronDown size={16} className="animate-bounce" />
                <span className="text-xs font-bold">New messages</span>
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>

      <div className="pb-4 pt-2 shrink-0">
        <div className="max-w-3xl mx-auto relative px-2">
          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2 no-scrollbar px-1">
            {[
              { label: "Brainstorm", icon: Lightbulb, color: "text-amber-600 bg-amber-50 border-amber-100" },
              { label: "Summarize", icon: Sparkles, color: "text-brand bg-brand/5 border-brand/10" },
              { label: "Fix Code", icon: Code2, color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
              { label: "Optimize", icon: Zap, color: "text-indigo-600 bg-indigo-50 border-indigo-100" },
              { label: "Explain", icon: Info, color: "text-slate-600 bg-slate-100 border-slate-200" },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => action.label === "Summarize" ? summarizeChat() : setInput(prev => `${action.label}: ${prev}`)}
                className={cn(
                  "whitespace-nowrap px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-sm shrink-0",
                  action.color
                )}
              >
                <action.icon size={12} />
                {action.label}
              </button>
            ))}
          </div>
          <div className={cn(
            "glass rounded-2xl sm:rounded-[2rem] p-1.5 md:p-2 shadow-2xl border-white/50 relative overflow-hidden transition-all duration-500 group/input",
            isResearchMode && "ring-2 ring-brand/30 shadow-brand/10 bg-brand/[0.02]",
            isCreativeMode && "ring-2 ring-amber-400/30 shadow-amber-400/10 bg-amber-400/[0.02]"
          )}>
            {/* Enhanced Markdown Toolbar */}
            <div className="flex items-center gap-1.5 px-3 py-2 border-b border-slate-100 mb-1 overflow-x-auto no-scrollbar bg-slate-50/50">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-brand hover:bg-white rounded-lg transition-all" onClick={() => insertMarkdown("**", "**")} title="Bold">
                  <Bold size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-brand hover:bg-white rounded-lg transition-all" onClick={() => insertMarkdown("_", "_")} title="Italic">
                  <Italic size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-brand hover:bg-white rounded-lg transition-all" onClick={() => insertMarkdown("- ")} title="List">
                  <List size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-brand hover:bg-white rounded-lg transition-all" onClick={() => insertMarkdown("`", "`")} title="Code">
                  <Code2 size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-brand hover:bg-white rounded-lg transition-all" onClick={() => insertMarkdown("[", "](url)")} title="Link">
                  <LinkIcon size={14} />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-brand hover:bg-white rounded-lg transition-all" onClick={() => insertMarkdown("> ")} title="Quote">
                  <Quote size={14} />
                </Button>
              </div>
              
              <div className="h-5 w-[1px] bg-slate-200 mx-1.5" />
              
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className={cn(
                    "h-8 gap-2 text-[10px] font-black uppercase tracking-widest rounded-lg px-3 transition-all",
                    showPreview ? "text-brand bg-white shadow-sm border border-brand/10" : "text-slate-500 hover:bg-white"
                  )}
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye size={12} />
                  Preview
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-white rounded-lg px-3"
                  onClick={() => setShowPremiumModal(true)}
                >
                  <Sparkles size={12} className="text-amber-500" />
                  AI Tools
                </Button>
              </div>
            </div>

            <div className={cn(
              "absolute inset-0 pointer-events-none transition-opacity duration-500",
              isResearchMode ? "bg-brand/5 opacity-100" : "opacity-0",
              isCreativeMode ? "bg-amber-400/5 opacity-100" : "opacity-0"
            )} />
            
            {showPreview && input && (
              <div className="absolute inset-x-0 bottom-full mb-4 z-50 bg-white/98 backdrop-blur-xl p-6 overflow-y-auto max-h-[400px] rounded-[2rem] border-2 border-brand/20 shadow-2xl shadow-brand/10 animate-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-brand rounded-lg flex items-center justify-center text-white">
                      <FileText size={12} />
                    </div>
                    <span className="text-xs font-black text-slate-800 uppercase tracking-widest">Markdown Preview</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-slate-100" onClick={() => setShowPreview(false)}>
                    <XCircle size={16} className="text-slate-400" />
                  </Button>
                </div>
                <div className="prose prose-sm max-w-none prose-slate">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{input}</ReactMarkdown>
                </div>
              </div>
            )}

            {isTyping && (
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-20">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => abortControllerRef.current?.abort()}
                  className="rounded-full bg-white/90 backdrop-blur-md border-slate-200 text-slate-600 hover:bg-white shadow-xl gap-2 px-4 font-bold"
                >
                  <Square size={12} className="fill-current" />
                  <span>Stop Generating</span>
                </Button>
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (inputError) setInputError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={isResearchMode ? "Enter topic for deep research..." : isCreativeMode ? "Describe something creatively..." : "Ask me anything..."}
              className={cn(
                "w-full bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 p-4 min-h-[60px] max-h-[300px] resize-none outline-none text-sm transition-all",
                inputError && "placeholder-red-400"
              )}
            />
            <div className="flex items-center justify-between px-4 py-1.5 border-t border-slate-50 bg-slate-50/30">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "text-[10px] font-black px-2 py-0.5 rounded-md transition-all flex items-center gap-1.5 shadow-sm",
                  input.length > MAX_CHARS ? "bg-red-50 text-red-600 ring-1 ring-red-200" : 
                  input.length > MAX_CHARS - 500 ? "bg-amber-50 text-amber-600 ring-1 ring-amber-200" :
                  "bg-white text-slate-400 ring-1 ring-slate-100"
                )}>
                  <span className="opacity-50 tracking-tighter">CHARS:</span>
                  {input.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                </div>
                {input.length > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50" 
                          onClick={() => setInput("")}
                        >
                          <XCircle size={12} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="bg-slate-900 text-white rounded-lg">
                        <p className="text-[10px] font-bold">Clear Input</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              {inputError ? (
                <div className="text-[10px] font-bold text-red-500 animate-pulse bg-red-50 px-2 rounded-md">
                  {inputError}
                </div>
              ) : (
                <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest hidden sm:block">
                  Press Enter to send, Shift + Enter for new line
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between px-2 pb-2 gap-2">
              <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setIsResearchMode(!isResearchMode);
                          setIsCreativeMode(false);
                        }}
                        className={cn(
                          "rounded-xl gap-2 px-3 transition-all shrink-0",
                          isResearchMode ? "bg-brand text-white hover:bg-brand-dark" : "text-brand bg-brand/10 dark:bg-brand/20 hover:bg-brand/20 dark:hover:bg-brand/30"
                        )}
                      >
                        <BrainCircuit size={16} />
                        <span className="text-xs font-semibold">Research</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl p-3 bg-slate-900 dark:bg-slate-800">
                      <p className="text-xs font-bold text-white uppercase tracking-widest">Deep Synthesis Mode</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="relative group">
                  <AnimatePresence>
                    {isListening && (
                      <motion.div 
                        initial={{ opacity: 0, x: 10, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 10, scale: 0.8 }}
                        className="absolute -top-12 right-0 flex items-center gap-2 bg-red-500 text-white px-3 py-1.5 rounded-2xl shadow-lg border border-red-400 z-50 whitespace-nowrap"
                      >
                        <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                        <span className="text-[10px] font-black uppercase tracking-widest leading-none">Aura Listening...</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={startListening}
                    className={cn(
                      "transition-all shrink-0 h-10 w-10 rounded-xl border-2",
                      isListening ? "text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 animate-pulse shadow-lg shadow-red-500/10" : "text-slate-400 border-slate-100 dark:border-white/5 hover:text-brand hover:bg-slate-50 dark:hover:bg-white/5"
                    )}
                    title={isListening ? "Stop Microphone" : "Voice Input"}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </Button>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate("/image")}
                  className="text-slate-400 dark:text-slate-500 hover:text-brand shrink-0"
                >
                  <ImageIcon size={18} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setIsCreativeMode(!isCreativeMode);
                    setIsResearchMode(false);
                  }}
                  className={cn(
                    "text-slate-400 dark:text-slate-500 hover:text-amber-500 transition-colors shrink-0",
                    isCreativeMode && "text-amber-500 bg-amber-50 dark:bg-amber-900/20"
                  )}
                >
                  <Lightbulb size={18} />
                </Button>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button 
                  onClick={isTyping ? stopGenerating : () => handleSubmit()}
                  disabled={!isTyping && !input.trim()}
                  className={cn(
                    "w-full sm:w-10 h-10 rounded-xl sm:rounded-full flex items-center justify-center transition-all shadow-lg",
                    isTyping ? "bg-red-500 text-white hover:bg-red-600" : (input.trim() ? "bg-brand text-white hover:bg-brand-dark scale-105" : "bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600")
                  )}
                >
                  {isTyping ? (
                    <>
                      <div className="w-3 h-3 bg-white rounded-sm sm:block" />
                      <span className="sm:hidden ml-2 font-black text-xs">STOP</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} className="sm:size-20" />
                      <span className="sm:hidden ml-2 font-black text-xs">SEND</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
            <div className="flex items-center justify-between mt-4 px-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium whitespace-nowrap overflow-hidden">
              {attachedFile ? (
                <div 
                  onClick={() => handlePreviewAsset(attachedFile)}
                  className="flex items-center gap-2 bg-brand/5 dark:bg-brand/10 text-brand px-2.5 py-1.5 rounded-xl border border-brand/10 shadow-sm cursor-pointer group transition-all"
                >
                  {attachedFile.preview ? (
                    <div className="w-5 h-5 rounded overflow-hidden shadow-sm">
                      <img src={attachedFile.preview} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <FileText size={12} />
                  )}
                  <span className="truncate max-w-[120px] font-bold">{attachedFile.name}</span>
                  <div className="flex items-center gap-1">
                    <Eye size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setAttachedFile(null);
                      }} 
                      className="hover:text-red-500 transition-colors p-0.5"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 opacity-50">
                  <Sparkles size={12} className="text-brand" />
                  <span className="font-bold uppercase tracking-widest text-[9px]">Neural Context Ready</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowLibrary(true)}
                className="h-8 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 gap-1.5 border border-slate-200 dark:border-white/5 font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
              >
                <Library size={12} />
                Library
              </Button>
              <Button variant="ghost" size="sm" className="h-8 rounded-xl text-[10px] text-slate-500 dark:text-slate-400 gap-1.5 border border-slate-200 dark:border-white/5 relative overflow-hidden font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                <Paperclip size={12} />
                Attach
                <input 
                  type="file" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleFileUpload}
                  accept=".txt,.md,.js,.ts,.tsx,.json,.png,.jpg,.jpeg,.webp"
                />
              </Button>
            </div>
          </div>
          <div className="text-center mt-6 text-[10px] text-slate-400">
            Join the Cortex community for more insights <Link to="#" className="text-brand hover:underline">Join Discord</Link>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showContextManager && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="hidden xl:block overflow-hidden"
          >
            <ContextManager />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Library Modal */}
      <Dialog open={showLibrary} onOpenChange={setShowLibrary}>
        <DialogContent className="sm:max-w-2xl rounded-[2.5rem] p-0 border-none shadow-2xl dark:bg-slate-900 transition-colors">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 italic uppercase">
                <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
                  <FileText size={24} />
                </div>
                Neural Library
              </DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                Select context for synthesis
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto no-scrollbar pr-2">
              {libraryFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 transition-colors">
                  <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-200 dark:text-slate-700 mb-4 transition-colors">
                    <Library size={32} />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 dark:text-white">Empty Repository</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Visit Files section to upload context.</p>
                </div>
              ) : (
                libraryFiles.map((file) => (
                  <div 
                    key={file._id}
                    onClick={() => {
                      setAttachedFile({
                        id: file._id,
                        name: file.name,
                        content: file.content,
                        type: file.type,
                        preview: file.type.startsWith('image/') ? file.content : undefined
                      });
                      setShowLibrary(false);
                      toast.success(`Context synthesized: ${file.name}`);
                    }}
                    className="group bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/[0.08] p-4 rounded-2xl border border-slate-100 dark:border-white/5 transition-all cursor-pointer flex items-center gap-4"
                  >
                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      {file.type.startsWith('image/') ? (
                        <ImageIcon className="text-purple-500" size={20} />
                      ) : (
                        <FileText className="text-blue-500" size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-black text-slate-800 dark:text-white group-hover:text-brand transition-colors">{file.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{file.type}</span>
                        <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{file.size}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-brand rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewAsset(file);
                        }}
                      >
                        <Eye size={16} />
                      </Button>
                      <Plus className="text-slate-300 group-hover:text-brand transition-colors" size={20} />
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <Button 
                onClick={() => setShowLibrary(false)}
                className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl h-12 px-8 font-black shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                Return to Chat
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={showPurgeConfirm} onOpenChange={setShowPurgeConfirm}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 border-none shadow-2xl dark:bg-[#0b0c14] dark:border dark:border-white/10">
          <DialogHeader>
            <div className="w-12 h-12 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <XCircle size={28} />
            </div>
            <DialogTitle className="text-2xl font-black text-center text-slate-900 dark:text-white uppercase italic tracking-tighter">Confirm Neural Purge</DialogTitle>
            <DialogDescription className="text-center text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              Are you sure you want to purge this specific intelligence record from the neural stream? This action is irreversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button variant="ghost" onClick={() => setShowPurgeConfirm(false)} className="flex-1 rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5">
              Abort Purge
            </Button>
            <Button onClick={handleConfirmedPurge} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-2xl h-12 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-red-500/20">
              Purge Memory
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Premium Modal */}
      <PremiumModal isOpen={showPremiumModal} onOpenChange={setShowPremiumModal} />
      <FilePreview isOpen={previewAssetOpen} onOpenChange={setPreviewAssetOpen} file={selectedAsset} />
      <ExportModal isOpen={showExportModal} onOpenChange={setShowExportModal} chats={allChats} />
    </div>
  );
}
