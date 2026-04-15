import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { 
  Plus, Search, Compass, Library, FileText, History, 
  MoreHorizontal, LogOut, PanelLeftClose, PanelLeftOpen,
  Image as ImageIcon
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
import { cn } from "../lib/utils.ts";

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
  // Removed local isOpen state

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchChats(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [id, searchQuery]);

  const fetchChats = async (query = "") => {
    try {
      const res = await api.get(`/chat${query ? `?q=${query}` : ""}`);
      setChats(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createNewChat = async () => {
    try {
      const res = await api.post("/chat");
      setChats([res.data, ...chats]);
      navigate(`/chat/${res.data._id}`);
      if (window.innerWidth < 768) setIsOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const renameChat = async (chatId: string) => {
    if (!editTitle.trim()) return;
    try {
      await api.patch(`/chat/${chatId}`, { title: editTitle });
      setChats(chats.map(c => c._id === chatId ? { ...c, title: editTitle } : c));
      setEditingChatId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await api.delete(`/chat/${chatId}`);
      setChats(chats.filter(c => c._id !== chatId));
      if (id === chatId) navigate("/");
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { icon: Compass, label: "Explore", path: "/explore" },
    { icon: ImageIcon, label: "Creative Studio", path: "/image" },
    { icon: Library, label: "Library", path: "/library" },
    { icon: FileText, label: "Files", path: "/files" },
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
        <Link to="/" className={cn("flex items-center gap-2", !isOpen && "md:hidden")}>
          <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center text-white font-bold">
            C
          </div>
          <span className="font-bold text-xl text-slate-800">Cortex</span>
        </Link>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsOpen(!isOpen)}
          className="text-slate-500"
        >
          {isOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </Button>
      </div>

      <div className="px-4 mb-4">
        <Button 
          onClick={createNewChat}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-6 flex items-center gap-2 shadow-lg"
        >
          <Plus size={18} />
          <span className={cn(!isOpen && "md:hidden")}>New chat</span>
        </Button>
      </div>

      <div className="px-4 mb-6">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={16} />
          <input 
            type="text" 
            placeholder="Search" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "w-full bg-slate-100/50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-brand/20 transition-all outline-none",
              !isOpen && "md:hidden"
            )}
          />
          <div className={cn("absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 border border-slate-200 rounded px-1", !isOpen && "md:hidden")}>
            ⌘K
          </div>
        </div>
      </div>

      <nav className="px-2 space-y-1 mb-6">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.label} 
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group",
                isActive 
                  ? "bg-brand/10 text-brand shadow-sm" 
                  : "text-slate-600 hover:bg-slate-200/50"
              )}
              onClick={() => {
                if (window.innerWidth < 768) setIsOpen(false);
              }}
            >
              <item.icon size={20} className={cn("transition-colors", isActive ? "text-brand" : "group-hover:text-brand")} />
              <span className={cn("text-sm font-semibold", !isOpen && "md:hidden")}>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className={cn("px-4 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider", !isOpen && "md:hidden")}>
          Recent Chats
        </div>
        <ScrollArea className="flex-1 px-2">
          <div className="space-y-1">
            {chats.map((chat) => (
              <div 
                key={chat._id}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer relative",
                  id === chat._id ? "bg-white shadow-sm text-brand" : "text-slate-600 hover:bg-slate-200/50"
                )}
                onClick={() => {
                  navigate(`/chat/${chat._id}`);
                  if (window.innerWidth < 768) setIsOpen(false);
                }}
              >
                <div className={cn("w-1.5 h-1.5 rounded-full", id === chat._id ? "bg-brand" : "bg-transparent")} />
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
                  <span className={cn("text-sm font-medium truncate flex-1", !isOpen && "md:hidden")}>
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
                      className="text-sm rounded-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingChatId(chat._id);
                        setEditTitle(chat.title);
                      }}
                    >
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-sm text-red-500 focus:text-red-500 rounded-lg"
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
        </ScrollArea>
      </div>

      <div className="p-4 border-t border-slate-200/50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full h-auto p-2 rounded-xl hover:bg-slate-200/50 transition-colors justify-start gap-3">
              <Avatar className="h-9 w-9 border-2 border-white shadow-sm">
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
            <DropdownMenuItem className="rounded-lg">Profile Settings</DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg">Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500 focus:text-red-500 rounded-lg" onClick={logout}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
    </>
  );
}
