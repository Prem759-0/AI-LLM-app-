import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { 
  Send, Mic, Image as ImageIcon, Lightbulb, 
  Search, Globe, Settings, Share2, Download, 
  Sparkles, Zap, BrainCircuit, CheckCircle2,
  ChevronDown, Paperclip, Wand2, Brain, History, Copy,
  Menu, FileJson, FileText, MicOff, Volume2
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button.tsx";
import { ScrollArea } from "./ui/scroll-area.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.tsx";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from "./ui/dropdown-menu.tsx";
import { useAuth } from "../App.tsx";
import api from "../lib/api.ts";
import { cn } from "../lib/utils.ts";
import { streamChat } from "../lib/gemini.ts";

interface Message {
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useState("text");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      toast.info("Listening...");
    };
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? " " : "") + transcript);
    };

    recognition.start();
  };

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) {
      toast.error("Text-to-speech not supported");
      return;
    }

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInput(prev => prev + "\n\nFile Content:\n" + content);
      toast.success(`File "${file.name}" attached`);
    };
    reader.readAsText(file);
  };

  const modelOptions = [
    { id: "text", name: "Gemini Flash (General)", icon: Sparkles },
    { id: "thinking", name: "Gemini Thinking (Advanced)", icon: Brain },
    { id: "code", name: "Gemini Pro (Coding)", icon: BrainCircuit },
    { id: "tech", name: "Gemini Pro (Technical)", icon: Zap },
  ];
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    if (id) {
      fetchChat();
    } else {
      setMessages([]);
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const fetchChat = async () => {
    try {
      const res = await api.get(`/chat/${id}`);
      setMessages(res.data.messages);
    } catch (err) {
      console.error(err);
      navigate("/");
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

  const [isResearchMode, setIsResearchMode] = useState(false);
  const [isCreativeMode, setIsCreativeMode] = useState(false);

  const handleSubmit = async (e?: React.FormEvent, overrideInput?: string) => {
    e?.preventDefault();
    const finalInput = overrideInput || input;
    if (!finalInput.trim() || isTyping) return;

    let processedInput = finalInput;
    if (isResearchMode) {
      processedInput = `[DEEP RESEARCH MODE] Please provide a comprehensive, detailed analysis with citations and multiple perspectives on: ${finalInput}`;
    } else if (isCreativeMode) {
      processedInput = `[CREATIVE MODE] Be highly imaginative, descriptive, and poetic in your response about: ${finalInput}`;
    }

    const userMessage: Message = { role: "user", content: processedInput };
    const newMessages = [...messages, userMessage];
    
    // For UI display, we show the raw input, not the processed one with prefixes
    const displayMessages = [...messages, { role: "user", content: finalInput } as Message];
    setMessages(displayMessages);
    
    setInput("");
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
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto px-4 md:px-8 overflow-hidden">
      {/* Header */}
      <header className="h-16 flex items-center justify-between border-b border-slate-200/50 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden text-slate-500"
          >
            <Menu size={20} />
          </Button>
          <div className="w-6 h-6 bg-brand/10 rounded flex items-center justify-center text-brand">
            <Sparkles size={14} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 px-2 h-8 hover:bg-slate-100">
                <span className="text-sm font-semibold text-slate-700">
                  {modelOptions.find(m => m.id === selectedModel)?.name}
                </span>
                <ChevronDown size={14} className="text-slate-400" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 rounded-xl">
              {modelOptions.map((opt) => (
                <DropdownMenuItem 
                  key={opt.id} 
                  onClick={() => setSelectedModel(opt.id)}
                  className="gap-3 rounded-lg py-2"
                >
                  <opt.icon size={16} className="text-brand" />
                  <span className="text-sm">{opt.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="text-slate-500 hover:text-red-500 gap-2">
              <History size={14} />
              <span className="text-xs">Clear</span>
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-slate-500"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied to clipboard");
            }}
          >
            <Share2 size={18} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-slate-500">
                <Download size={18} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl">
              <DropdownMenuItem onClick={() => exportChat('txt')} className="gap-2">
                <FileText size={14} />
                <span>Export as .txt</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportChat('json')} className="gap-2">
                <FileJson size={14} />
                <span>Export as .json</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button 
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs px-4 h-8 ml-2"
            onClick={() => toast.info("Premium features coming soon!")}
          >
            Upgrade
          </Button>
        </div>
      </header>

      <ScrollArea className="flex-1 pr-4 min-h-0" onScroll={handleScroll}>
        <div className="py-8 space-y-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-24 h-24 bg-brand/10 rounded-full flex items-center justify-center relative"
              >
                <div className="absolute inset-0 bg-brand/20 rounded-full animate-pulse" />
                <div className="w-16 h-16 bg-brand rounded-full flex items-center justify-center text-white shadow-xl z-10">
                  <Zap size={32} />
                </div>
              </motion.div>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold text-slate-900">Hello, {user?.name?.split(" ")[0]}</h1>
                <p className="text-xl text-slate-500">How can I assist you today?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mt-12">
                {suggestions.map((s, i) => (
                  <motion.div
                    key={s.title}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: i * 0.1 }}
                    className="glass p-6 rounded-2xl text-left hover:shadow-md hover:border-brand/30 transition-all cursor-pointer group"
                    onClick={() => {
                      handleSubmit(undefined, s.desc);
                    }}
                  >
                    <s.icon className="text-brand mb-4 group-hover:scale-110 transition-transform" size={24} />
                    <h3 className="font-bold text-slate-800 mb-1">{s.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={cn(
                    "flex gap-4",
                    m.role === "user" ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <Avatar className={cn(
                    "h-9 w-9 border-2 border-white shadow-sm shrink-0",
                    m.role === "user" ? "bg-brand" : "bg-slate-100"
                  )}>
                    {m.role === "user" ? (
                      <AvatarFallback className="bg-brand text-white text-xs">{user?.name?.[0]}</AvatarFallback>
                    ) : (
                      <AvatarFallback className="bg-slate-800 text-white text-xs">AI</AvatarFallback>
                    )}
                  </Avatar>
                  <div className={cn(
                    "max-w-[85%] md:max-w-[75%] relative group/message",
                    m.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"
                  )}>
                    <div className="prose prose-sm md:prose-base dark:prose-invert">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                    </div>
                    {m.role === "assistant" && (
                      <div className="absolute -right-12 top-0 flex flex-col gap-1 opacity-0 group-hover/message:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-brand"
                          onClick={() => {
                            navigator.clipboard.writeText(m.content);
                            toast.success("Copied to clipboard");
                          }}
                        >
                          <Copy size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "h-8 w-8 text-slate-400 hover:text-brand",
                            isSpeaking && "text-brand animate-pulse"
                          )}
                          onClick={() => speakText(m.content)}
                        >
                          <Volume2 size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <div className="flex gap-4">
                  <Avatar className="h-9 w-9 border-2 border-white shadow-sm bg-slate-100 shrink-0">
                    <AvatarFallback className="bg-slate-800 text-white text-xs">AI</AvatarFallback>
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
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
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

      {/* Input Area */}
      <div className="pb-8 pt-4 shrink-0">
        <div className="max-w-3xl mx-auto relative">
          {/* Quick Suggestions Chips */}
          {messages.length > 0 && messages.length < 6 && (
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
              {suggestions.map((s) => (
                <button
                  key={s.title}
                  onClick={() => handleSubmit(undefined, s.desc)}
                  className="whitespace-nowrap px-4 py-1.5 rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-600 hover:border-brand hover:text-brand transition-all shadow-sm"
                >
                  {s.title}
                </button>
              ))}
            </div>
          )}
          <div className={cn(
            "glass rounded-3xl p-2 shadow-2xl border-white/50 relative overflow-hidden transition-all duration-500",
            isResearchMode && "ring-2 ring-brand/30 shadow-brand/10",
            isCreativeMode && "ring-2 ring-amber-400/30 shadow-amber-400/10"
          )}>
            <div className={cn(
              "absolute inset-0 pointer-events-none transition-opacity duration-500",
              isResearchMode ? "bg-brand/5 opacity-100" : "opacity-0",
              isCreativeMode ? "bg-amber-400/5 opacity-100" : "opacity-0"
            )} />
            
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={isResearchMode ? "Enter topic for deep research..." : isCreativeMode ? "Describe something creatively..." : "Ask me anything..."}
              className="w-full bg-transparent border-none focus:ring-0 text-slate-800 placeholder-slate-400 p-4 min-h-[60px] max-h-[200px] resize-none outline-none text-sm"
            />
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setIsResearchMode(!isResearchMode);
                    setIsCreativeMode(false);
                  }}
                  className={cn(
                    "rounded-xl gap-2 px-3 transition-all",
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
                    "transition-all",
                    isListening ? "text-red-500 bg-red-50 animate-pulse" : "text-slate-400 hover:text-brand"
                  )}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => navigate("/image")}
                  className="text-slate-400 hover:text-brand"
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
                    "text-slate-400 hover:text-amber-500 transition-colors",
                    isCreativeMode && "text-amber-500 bg-amber-50"
                  )}
                >
                  <Lightbulb size={18} />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-400 hover:text-brand"
                  onClick={() => toast.info("Settings coming soon!")}
                >
                  <Settings size={18} />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-slate-400 hover:text-brand"
                  onClick={() => toast.info("Web search is active by default")}
                >
                  <Globe size={18} />
                </Button>
                <Button 
                  onClick={isTyping ? stopGenerating : () => handleSubmit()}
                  disabled={!isTyping && !input.trim()}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg",
                    isTyping ? "bg-red-500 text-white hover:bg-red-600" : (input.trim() ? "bg-brand text-white hover:bg-brand-dark scale-105" : "bg-slate-100 text-slate-300")
                  )}
                >
                  {isTyping ? (
                    <div className="w-3 h-3 bg-white rounded-sm" />
                  ) : (
                    <Send size={20} />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 px-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <Sparkles size={12} className="text-brand" />
              <span>Saved prompts</span>
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
    </div>
  );
}
