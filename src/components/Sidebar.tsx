import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { 
  Plus, Search, Compass, Library, FileText, History, 
  MoreHorizontal, LogOut, PanelLeft, PanelLeftClose, PanelLeftOpen,
  Image as ImageIcon, Sparkles, Code, MessageSquare,
  Calendar, Clock, ChevronRight, Crown
} from "lucide-react";
import { useAuth } from "../App.tsx";
import api from "../lib/api.ts";
import { Button } from "./ui/button.tsx";
import { ScrollArea } from "./ui/scroll-area.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.tsx";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from "./ui/dropdown-menu.tsx";
import PremiumModal from "./PremiumModal.tsx";
import { cn } from "../lib/utils.ts";
import { format, isToday, isYesterday, subDays, isAfter } from "date-fns";

interface Chat {
  _id: string;
  title: string;
  updatedAt: string;
}

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { user, logout } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchChats();
  }, [id]);

  const fetchChats = async () => {
    try {
      const res = await api.get("chat");
      setChats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chats;
    const q = searchQuery.toLowerCase();
    return chats.filter(chat => 
      chat.title.toLowerCase().includes(q)
    );
  }, [chats, searchQuery]);

  const sortedChats = useMemo(() => {
    return chats
      .filter(chat => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [chats, searchQuery]);

  const groupedChats = useMemo(() => {
    const groups: { [key: string]: Chat[] } = {
      "Today": [],
      "Yesterday": [],
      "This Week": [],
      "Archive": []
    };

    sortedChats.forEach(chat => {
      const date = new Date(chat.updatedAt);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 0) groups["Today"].push(chat);
      else if (diffDays === 1) groups["Yesterday"].push(chat);
      else if (diffDays < 7) groups["This Week"].push(chat);
      else groups["Archive"].push(chat);
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [sortedChats]);

  const createNewChat = async () => {
    try {
      const res = await api.post("chat");
      setChats([res.data, ...chats]);
      navigate(`/chat/${res.data._id}`);
      if (window.innerWidth < 768) setIsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const renameChat = async (chatId: string) => {
    if (!editTitle.trim()) return;
    try {
      await api.patch(`chat/${chatId}`, { title: editTitle });
      setChats(chats.map(c => c._id === chatId ? { ...c, title: editTitle } : c));
      setEditingChatId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await api.delete(`chat/${chatId}`);
      setChats(chats.filter(c => c._id !== chatId));
      if (id === chatId) navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: ImageIcon, label: "Creative Studio", path: "/image", isPremium: true },
    { icon: Library, label: "Library", path: "/library" },
    { icon: FileText, label: "Files", path: "/files", isPremium: true },
    { icon: History, label: "History", path: "/history" },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-10 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "h-full sidebar-glass transition-all duration-300 flex flex-col z-20 fixed md:relative",
        isOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full md:w-20 md:translate-x-0"
      )}>
      <div className="p-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-brand rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-brand/20 relative overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand to-indigo-500 opacity-100" />
            <Sparkles size={20} className="relative z-10 group-hover:scale-110 transition-transform" />
          </div>
          <span className={cn("font-black text-xl text-slate-800 tracking-tighter uppercase italic truncate pr-4", !isOpen && "md:hidden")}>Cortex</span>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "text-slate-500 hover:bg-white hover:text-brand shadow-sm rounded-xl transition-all border border-slate-100", 
            !isOpen ? "md:mx-auto" : ""
          )}
        >
          {isOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </Button>
      </div>

      <div className={cn("px-4 mb-4", !isOpen && "md:px-2")}>
        <Button 
          onClick={createNewChat}
          className={cn(
            "w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-6 flex items-center gap-2 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]",
            !isOpen && "md:p-0 md:h-12 md:w-12 md:mx-auto md:justify-center"
          )}
        >
          <Plus size={18} className="shrink-0" />
          <span className={cn("font-bold", !isOpen && "md:hidden")}>New chat</span>
        </Button>
      </div>

      <div className={cn("px-4 mb-6", !isOpen && "md:hidden")}>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search chats..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full bg-slate-100/50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-brand/20 transition-all outline-none font-medium",
              !isOpen && "md:hidden"
            )}
          />
          <div className={cn("absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 border border-slate-200 rounded px-1.5 py-0.5", !isOpen && "md:hidden")}>
            ⌘K
          </div>
        </div>
      </div>

      <nav className="px-2 space-y-1 mb-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label} 
              onClick={(e) => {
                if (item.isPremium) {
                  e.preventDefault();
                  setShowPremiumModal(true);
                  return;
                }
                navigate(item.path);
                if (window.innerWidth < 768) setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                isActive 
                  ? "bg-brand/10 text-brand shadow-sm" 
                  : "text-slate-600 hover:bg-slate-200/50",
                !isOpen && "md:justify-center md:px-0"
              )}
            >
              <item.icon size={20} className={cn("transition-colors shrink-0", isActive ? "text-brand" : "group-hover:text-brand")} />
              <span className={cn("text-sm font-bold truncate", !isOpen && "md:hidden")}>{item.label}</span>
              {item.isPremium && isOpen && (
                <div className="ml-auto flex items-center gap-1 bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-amber-200">
                  <Crown size={8} /> Pro
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 px-2">
          {groupedChats.map(([group, items]) => (
            <div key={group} className="mb-4">
              <div className={cn("px-4 mb-2 flex items-center justify-between", !isOpen && "md:hidden")}>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  {group === "Today" && <div className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />}
                  {group}
                </div>
                {group === "Today" && items.length > 0 && (
                  <div className="text-[8px] font-black text-brand bg-brand/5 px-2 py-0.5 rounded-lg border border-brand/10 uppercase tracking-tighter">Active</div>
                )}
              </div>
              <div className="space-y-0.5">
                {items.map((chat) => (
                  <div 
                    key={chat._id}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer relative",
                      id === chat._id ? "bg-white shadow-sm text-brand" : "text-slate-600 hover:bg-slate-200/50",
                      !isOpen && "md:justify-center md:px-0"
                    )}
                    onClick={() => {
                      navigate(`/chat/${chat._id}`);
                      if (window.innerWidth < 768) setIsOpen(false);
                    }}
                  >
                    <MessageSquare size={16} className={cn("shrink-0", id === chat._id ? "text-brand" : "text-slate-400 group-hover:text-brand")} />
                    {editingChatId === chat._id ? (
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => renameChat(chat._id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameChat(chat._id);
                          if (e.key === "Escape") setEditingChatId(null);
                        }}
                        className="flex-1 bg-white border border-brand/30 rounded px-1 text-sm outline-none"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className={cn("text-sm font-bold truncate flex-1", !isOpen && "md:hidden")}>
                        {chat.title}
                      </span>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className={cn("h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity", !isOpen && "md:hidden")}>
                          <MoreHorizontal size={14} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 rounded-xl">
                        <DropdownMenuItem 
                          className="text-sm rounded-lg font-bold"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingChatId(chat._id);
                            setEditTitle(chat.title);
                          }}
                        >
                          Rename
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-sm text-red-500 focus:text-red-500 rounded-lg font-bold"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteChat(chat._id);
                          }}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </ScrollArea>
      </div>

      <div className="p-4 border-t border-slate-200/50">
        <PremiumModal isOpen={showPremiumModal} onOpenChange={setShowPremiumModal} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn(
              "w-full h-auto p-2 rounded-xl hover:bg-slate-200/50 transition-colors justify-start gap-3",
              !isOpen && "md:justify-center md:p-0"
            )}>
              <Avatar className="h-9 w-9 border-2 border-white shadow-sm shrink-0">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} />
                <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className={cn("flex-1 text-left overflow-hidden", !isOpen && "md:hidden")}>
                <div className="text-sm font-bold text-slate-800 truncate">{user?.name}</div>
                <div className="text-[10px] text-slate-500 truncate">{user?.email}</div>
              </div>
              <LogOut size={16} className={cn("text-slate-400 shrink-0", !isOpen && "md:hidden")} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 rounded-xl mb-2">
            <DropdownMenuItem className="rounded-lg cursor-pointer font-bold" onClick={() => navigate("/profile")}>
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg cursor-pointer font-bold" onClick={() => navigate("/settings")}>
              App Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg cursor-pointer font-bold" onClick={() => navigate("/billing")}>
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500 focus:text-red-500 rounded-lg cursor-pointer font-bold" onClick={logout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
    </>
  );
}
