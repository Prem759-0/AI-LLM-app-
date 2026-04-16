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
  Menu, FileJson, FileText, MicOff, Volume2, XCircle,
  Square, PlusCircle, Bold, Italic, List, Code2, Link as LinkIcon,
  Quote, Eye, Info, Crown, Pencil
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button.tsx";
import { ScrollArea } from "./ui/scroll-area.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.tsx";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from "./ui/dropdown-menu.tsx";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger 
} from "./ui/dialog.tsx";
import { useAuth } from "../App.tsx";
import api from "../lib/api.ts";
import { cn } from "../lib/utils.ts";
import { streamChat } from "../lib/gemini.ts";
import PremiumModal from "./PremiumModal.tsx";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatInterfaceProps {
  setIsSidebarOpen: (open: boolean) => void;
}

export default function ChatInterface({ setIsSidebarOpen }: ChatInterfaceProps) {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Usage Tracking
  const [usage, setUsage] = useState(() => {
    const saved = localStorage.getItem('cortex_usage');
    try {
      return saved ? JSON.parse(saved) : { messages: 0, images: 0, files: 0 };
    } catch {
      return { messages: 0, images: 0, files: 0 };
    }
  });

  useEffect(() => {
    localStorage.setItem('cortex_usage', JSON.stringify(usage));
  }, [usage]);

  const checkUsage = (type: 'messages' | 'images' | 'files') => {
    const limits = { messages: 20, images: 5, files: 3 };
    if (usage[type] >= limits[type]) {
      setShowPremiumModal(true);
      toast.error(`Free limit reached: ${limits[type]} ${type} per day. Upgrade to Pro for unlimited access!`);
      return false;
    }
    return true;
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("text");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string } | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [chatTitle, setChatTitle] = useState("New Chat");
  const [showPreview, setShowPreview] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isResearchMode, setIsResearchMode] = useState(false);
  const [isCreativeMode, setIsCreativeMode] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
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
      setAttachedFile({ name: file.name, content });
      setUsage(prev => ({ ...prev, files: prev.files + 1 }));
      toast.success(`File "${file.name}" attached`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const modelOptions = [
    { id: "text", name: "Gemini Flash", desc: "Fast & efficient for daily tasks", icon: Sparkles },
    { id: "thinking", name: "Gemini Thinking", desc: "Deep reasoning & complex logic", icon: Brain },
    { id: "code", name: "Gemini Pro Code", desc: "Specialized in software development", icon: BrainCircuit },
    { id: "tech", name: "Gemini Pro Tech", desc: "Technical analysis & documentation", icon: Zap },
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
      const res = await api.get(`/chat/${id}`);
      setMessages(res.data.messages);
      setChatTitle(res.data.title || "New Chat");
    } catch (err) {
      console.error(err);
      navigate("/");
    }
  };

  const handleRename = async () => {
    if (!id || !chatTitle.trim()) return;
    setIsSaved(false);
    try {
      await api.patch(`/chat/${id}`, { title: chatTitle });
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
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100;
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

  const handleSubmit = async (e?: React.FormEvent, overrideInput?: string) => {
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

    const userMessage: Message = { role: "user", content: processedInput };
    setUsage(prev => ({ ...prev, messages: prev.messages + 1 }));
    const newMessages = [...messages, userMessage];
    
    // For UI display, we show the raw input, not the processed one with prefixes
    const displayMessages = [...messages, { role: "user", content: finalInput } as Message];
    setMessages(displayMessages);
    
    setInput("");
    setAttachedFile(null);
    setIsTyping(true);
    setStreamingContent("");
    setIsResearchMode(false);
    setIsCreativeMode(false);

    try {
      let chatId = id;
      if (!chatId) {
        const res = await api.post("/chat");
        chatId = res.data._id;
        navigate(`/chat/${chatId}`, { replace: true });
      }

      setIsSaving(true);
      setIsSaved(false);
      let fullContent = "";
      abortControllerRef.current = new AbortController();
      
      // Pass the full history with processed input to the AI
      const stream = streamChat(newMessages, selectedModel);

      for await (const chunk of stream) {
        if (abortControllerRef.current?.signal.aborted) break;
        fullContent += chunk;
        setStreamingContent(fullContent);
      }

      const assistantMessage: Message = { role: "assistant", content: fullContent };
      const finalMessages = [...displayMessages, assistantMessage];
      setMessages(finalMessages);
      setStreamingContent("");
      setIsTyping(false);

      // Update chat in DB
      await api.patch(`/chat/${chatId}`, {
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

  const exportChat = (format: 'txt' | 'json') => {
    let content = "";
    let mimeType = "text/plain";
    let fileName = `chat-export-${id || "new"}.${format}`;

    if (format === 'json') {
      content = JSON.stringify(messages, null, 2);
      mimeType = "application/json";
    } else {
      content = messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    toast.success(`Chat exported as .${format}`);
  };

  const clearChat = async () => {
    if (!id) return;
    try {
      await api.patch(`/chat/${id}`, { messages: [] });
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
    <div className="flex flex-col h-full bg-[#fcfcff] relative overflow-hidden">
      <PremiumModal isOpen={showPremiumModal} onOpenChange={setShowPremiumModal} />
      {/* Header */}
      <header className="h-16 flex items-center justify-between border-b border-slate-200/50 mb-2 shrink-0 px-4 md:px-8 bg-white/50 backdrop-blur-md z-30 sticky top-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden text-slate-500 hover:bg-slate-100 rounded-xl shrink-0"
          >
            <Menu size={20} />
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
                className="text-sm font-black text-slate-800 bg-slate-100/50 border-none rounded-lg px-2 py-0.5 focus:ring-2 focus:ring-brand/20 outline-none w-full max-w-[200px]"
              />
            ) : (
              <div 
                className="flex items-center gap-1.5 cursor-pointer group/title min-w-0"
                onClick={() => id && setIsEditingTitle(true)}
              >
                <h2 className="text-sm md:text-base font-black text-slate-800 truncate tracking-tight group-hover/title:text-brand transition-colors uppercase italic tracking-tighter pr-8 max-w-[150px] sm:max-w-[250px] md:max-w-md">
                  {id ? chatTitle : "Neural Genesis"}
                </h2>
                {id && <Crown size={10} className="text-amber-500 shrink-0" />}
              </div>
            )}
            
            <div className="flex items-center gap-2 overflow-hidden mt-0.5">
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="hidden sm:block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Aura v3.0 Core</span>
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hidden sm:flex rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-100 px-4 border-2 border-slate-100 h-10">
                {React.createElement(modelOptions.find(m => m.id === selectedModel)?.icon || Sparkles, { size: 14 })}
                {modelOptions.find(m => m.id === selectedModel)?.name}
                <ChevronDown size={14} className="text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 rounded-2xl p-2 shadow-2xl border-slate-200">
              <div className="px-3 py-2 mb-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Model</div>
              {modelOptions.map((opt) => (
                <DropdownMenuItem 
                  key={opt.id} 
                  onClick={() => setSelectedModel(opt.id)}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-xl py-3 px-4 transition-all cursor-pointer mb-1",
                    selectedModel === opt.id ? "bg-brand/5 border border-brand/10" : "hover:bg-slate-50"
                  )}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", selectedModel === opt.id ? "bg-brand text-white" : "bg-slate-100 text-slate-500")}>
                      <opt.icon size={16} />
                    </div>
                    <div className="flex-1">
                      <div className={cn("text-sm font-black", selectedModel === opt.id ? "text-brand" : "text-slate-900")}>{opt.name}</div>
                      <div className="text-[10px] font-bold text-slate-400 leading-tight">{opt.desc}</div>
                    </div>
                    {selectedModel === opt.id && <CheckCircle2 size={14} className="text-brand" />}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest px-4 h-10 shadow-lg shadow-brand/20 transition-all hover:scale-105 active:scale-95"
            onClick={() => setShowPremiumModal(true)}
          >
            <Crown size={14} className="fill-white" />
            <span className="hidden md:inline">Upgrade</span>
          </Button>
        </div>
      </header>

      <ScrollArea className={cn("flex-1 min-h-0", messages.length === 0 && "no-scrollbar")} onScroll={handleScroll}>
        <div className={cn(
          "max-w-4xl mx-auto px-4 md:px-8",
          messages.length === 0 ? "h-full flex items-center justify-center p-0" : "py-4 space-y-8"
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
                <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase italic">
                  Neural <span className="brand-text-gradient">Genesis</span>
                </h1>
                <p className="text-lg md:text-xl text-slate-400 font-medium leading-relaxed">
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
                    className="p-6 rounded-[2rem] bg-white border border-slate-100 hover:border-brand/40 hover:shadow-2xl hover:shadow-brand/5 transition-all text-left cursor-pointer group flex flex-col items-start"
                    onClick={() => setInput(s.desc)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-brand/10 group-hover:text-brand transition-colors mb-4">
                      <s.icon size={20} />
                    </div>
                    <h3 className="font-black text-slate-800 text-sm mb-1 group-hover:text-brand transition-colors uppercase italic tracking-tighter">{s.title}</h3>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">{s.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
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
                    <div className={cn(
                      "prose prose-sm md:prose-base dark:prose-invert leading-relaxed",
                      m.role === "user" ? "text-white selection:bg-white/20" : "text-slate-700 selection:bg-brand/10"
                    )}>
                      <ReactMarkdown components={MarkdownComponents} remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                    <div className={cn(
                      "absolute top-0 flex gap-1 opacity-0 group-hover/message:opacity-100 transition-all duration-200",
                      m.role === "user" ? "-left-20 flex-row-reverse" : "-right-24"
                    )}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm border border-slate-100 text-slate-400 hover:text-brand hover:scale-110 transition-all"
                        onClick={() => {
                          navigator.clipboard.writeText(m.content);
                          toast.success("Copied to clipboard");
                        }}
                        title="Copy content"
                      >
                        <Copy size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm border border-slate-100 text-slate-400 hover:text-red-500 hover:scale-110 transition-all"
                        onClick={() => {
                          setMessages(prev => prev.filter((_, idx) => idx !== i));
                          toast.error("Message removed");
                        }}
                        title="Delete message"
                      >
                        <XCircle size={14} />
                      </Button>
                      {m.role === "assistant" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm border border-slate-100 text-slate-400 hover:text-brand hover:scale-110 transition-all",
                              isSpeaking && "text-brand animate-pulse"
                            )}
                            onClick={() => speakText(m.content)}
                          >
                            <Volume2 size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm border border-slate-100 text-slate-400 hover:text-brand hover:scale-110 transition-all"
                            onClick={() => {
                              const lastUserMessage = messages.filter(msg => msg.role === "user").pop();
                              if (lastUserMessage) {
                                setMessages(prev => prev.slice(0, -2));
                                handleSubmit(undefined, lastUserMessage.content);
                              }
                            }}
                          >
                            <Wand2 size={14} />
                          </Button>
                        </>
                      )}
                      {m.role === "user" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-xl bg-white/80 backdrop-blur-sm shadow-sm border border-slate-100 text-slate-400 hover:text-brand hover:scale-110 transition-all"
                          onClick={() => {
                            setInput(m.content);
                            textareaRef.current?.focus();
                            toast.info("Message copied to input for editing");
                          }}
                          title="Edit Message"
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
          {/* Quick Suggestions Chips */}
          {messages.length > 0 && messages.length < 6 && (
            <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2 no-scrollbar px-1">
              {suggestions.map((s) => (
                <button
                  key={s.title}
                  onClick={() => handleSubmit(undefined, s.desc)}
                  className="whitespace-nowrap px-3 py-1 rounded-full bg-white border border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500 hover:border-brand hover:text-brand transition-all shadow-sm shrink-0"
                >
                  {s.title}
                </button>
              ))}
            </div>
          )}
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
            <div className="flex items-center justify-between px-4 pb-2">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "text-[10px] font-black px-2 py-0.5 rounded-md transition-all flex items-center gap-1.5",
                  input.length > MAX_CHARS ? "bg-red-100 text-red-600 animate-bounce" : 
                  input.length > MAX_CHARS - 500 ? "bg-amber-100 text-amber-600" :
                  "bg-slate-100 text-slate-400"
                )}>
                  {input.length > MAX_CHARS - 500 && <Info size={10} />}
                  {input.length} / {MAX_CHARS}
                </div>
                {input.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-slate-300 hover:text-red-500" 
                    onClick={() => setInput("")}
                  >
                    <XCircle size={12} />
                  </Button>
                )}
              </div>
              {inputError && (
                <div className="text-[10px] font-bold text-red-500 animate-pulse">
                  {inputError}
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between px-2 pb-2 gap-2">
              <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setIsResearchMode(!isResearchMode);
                    setIsCreativeMode(false);
                  }}
                  className={cn(
                    "rounded-xl gap-2 px-3 transition-all shrink-0",
                    isResearchMode ? "bg-brand text-white hover:bg-brand-dark" : "text-brand bg-brand/10 hover:bg-brand/20"
                  )}
                >
                  <BrainCircuit size={16} />
                  <span className="text-xs font-semibold">Research</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={startListening}
                  className={cn(
                    "transition-all shrink-0",
                    isListening ? "text-red-500 bg-red-50 animate-pulse" : "text-slate-400 hover:text-brand"
                  )}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate("/image")}
                  className="text-slate-400 hover:text-brand shrink-0"
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
                    "text-slate-400 hover:text-amber-500 transition-colors shrink-0",
                    isCreativeMode && "text-amber-500 bg-amber-50"
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
                    isTyping ? "bg-red-500 text-white hover:bg-red-600" : (input.trim() ? "bg-brand text-white hover:bg-brand-dark scale-105" : "bg-slate-100 text-slate-300")
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
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              {attachedFile ? (
                <Dialog>
                  <DialogTrigger render={
                    <div className="flex items-center gap-2 bg-brand/5 text-brand px-2 py-1 rounded-lg border border-brand/10 cursor-pointer hover:bg-brand/10 transition-colors">
                      <FileText size={12} />
                      <span className="truncate max-w-[100px]">{attachedFile.name}</span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setAttachedFile(null);
                        }} 
                        className="hover:text-red-500"
                      >
                        <XCircle size={12} />
                      </button>
                    </div>
                  } />
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col rounded-[2rem]">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-xl font-black">
                        <FileText className="text-brand" />
                        {attachedFile.name}
                      </DialogTitle>
                    </DialogHeader>
                    <ScrollArea className="flex-1 mt-4 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <pre className="text-xs font-mono text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {attachedFile.content}
                      </pre>
                    </ScrollArea>
                    <div className="flex justify-end mt-4">
                      <Button onClick={() => setAttachedFile(null)} variant="ghost" className="text-red-500 hover:bg-red-50 font-bold rounded-xl">
                        Remove File
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <>
                  <Sparkles size={12} className="text-brand" />
                  <span>Saved prompts</span>
                </>
              )}
            </div>
            <Button variant="ghost" size="sm" className="h-7 rounded-lg text-[11px] text-slate-500 gap-1.5 border border-slate-200 relative overflow-hidden">
              <Paperclip size={12} />
              Attach file
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleFileUpload}
                accept=".txt,.md,.js,.ts,.tsx,.json"
              />
            </Button>
          </div>
          <div className="text-center mt-6 text-[10px] text-slate-400">
            Join the Cortex community for more insights <Link to="#" className="text-brand hover:underline">Join Discord</Link>
          </div>
        </div>
      </div>
      {/* Premium Modal */}
      <PremiumModal isOpen={showPremiumModal} onOpenChange={setShowPremiumModal} />
    </div>
  );
}
