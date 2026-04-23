import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Chat {
  _id: string;
  title: string;
  updatedAt: string;
}

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

function SortableChatItem({ 
  chat, 
  isActive, 
  onNavigate, 
  onRename, 
  onDelete, 
  isOpen, 
  editingChatId, 
  setEditingChatId, 
  editTitle, 
  setEditTitle 
}: { 
  chat: Chat, 
  isActive: boolean, 
  onNavigate: (id: string) => void,
  onRename: (id: string) => void,
  onDelete: (id: string) => void,
  isOpen: boolean,
  editingChatId: string | null,
  setEditingChatId: (id: string | null) => void,
  editTitle: string,
  setEditTitle: (t: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: chat._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={cn(
        "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all cursor-pointer relative",
        isActive ? "bg-white dark:bg-slate-800 shadow-sm text-brand" : "text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5",
        !isOpen && "md:justify-center md:px-0"
      )}
      onClick={() => onNavigate(chat._id)}
    >
      <div {...listeners} className="cursor-grab active:cursor-grabbing p-1 -ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <MoreHorizontal size={14} className="rotate-90 text-slate-300" />
      </div>
      <MessageSquare size={16} className={cn("shrink-0", isActive ? "text-brand" : "text-slate-400 group-hover:text-brand")} />
      {editingChatId === chat._id ? (
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={() => onRename(chat._id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onRename(chat._id);
            if (e.key === "Escape") setEditingChatId(null);
          }}
          className="flex-1 bg-white dark:bg-slate-800 border border-brand/30 rounded px-1 text-sm outline-none dark:text-slate-200"
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
        <DropdownMenuContent align="end" className="w-40 rounded-xl dark:bg-slate-900 dark:border-white/10">
          <DropdownMenuItem 
            className="text-sm rounded-lg font-bold dark:text-slate-300 dark:hover:bg-white/5"
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
              onDelete(chat._id);
            }}
          >
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const { user, logout } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [chats, setChats] = useState<Chat[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const sortedChats = useMemo(() => {
    return [...chats]
      .filter(chat => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [chats, searchQuery]);

  // For DND we use the primary state but filtered/sorted if needed
  // However, DND with sorting/grouping is complex. 
  // Let's assume the user wants to reorder the results of the current search/filter.
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = chats.findIndex(i => i._id === active.id);
      const newIndex = chats.findIndex(i => i._id === over?.id);
      const newItems = arrayMove(chats, oldIndex, newIndex);
      setChats(newItems);
      
      try {
        await api.post("chat/reorder", { chatIds: newItems.map(c => c._id) });
      } catch (err) {
        console.error("Failed to persist order", err);
      }
    }
  };

  const groupedChats = useMemo(() => {
    const groups: { [key: string]: Chat[] } = {
      "Today": [],
      "Yesterday": [],
      "This Week": [],
      "Archive": []
    };

    // We preserve the order from the 'chats' state but distribute into containers
    chats.forEach(chat => {
      if (!chat.title.toLowerCase().includes(searchQuery.toLowerCase())) return;

      const date = new Date(chat.updatedAt);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const chatDate = new Date(chat.updatedAt);
      chatDate.setHours(0, 0, 0, 0);
      
      const diffTime = now.getTime() - chatDate.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) groups["Today"].push(chat);
      else if (diffDays === 1) groups["Yesterday"].push(chat);
      else if (diffDays < 7) groups["This Week"].push(chat);
      else groups["Archive"].push(chat);
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [chats, searchQuery]);

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
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-10 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "h-full bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 transition-all duration-300 flex flex-col z-20 fixed md:relative",
        isOpen ? "w-72 translate-x-0" : "w-72 -translate-x-full md:w-20 md:translate-x-0"
      )}>
      <div className="p-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-brand/20 relative overflow-hidden group shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand to-indigo-500 opacity-100" />
            <Sparkles size={22} className="relative z-10 group-hover:rotate-12 transition-transform" />
          </div>
          <span className={cn("font-black text-2xl text-slate-900 dark:text-white tracking-tighter uppercase italic truncate pr-4 transition-all", !isOpen && "md:hidden")}>Cortex</span>
        </Link>
        
        {/* Hover Toggle Detective Area */}
        <div className={cn(
          "absolute left-full top-0 bottom-0 w-8 flex items-center -ml-4 z-[100] group/detect cursor-pointer",
          !isOpen && "left-0 ml-14 ml-0 w-12"
        )}>
           <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "bg-white dark:bg-slate-900 shadow-[0_0_20px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_rgba(255,255,255,0.05)] rounded-full h-8 w-8 border border-slate-200 dark:border-white/10 transition-all hover:scale-110 active:scale-95 opacity-0 group-hover/detect:opacity-100 flex items-center justify-center relative z-50",
              isOpen ? "-translate-x-1/2" : "translate-x-4 border-brand/30"
            )}
          >
            {isOpen ? <PanelLeftClose size={16} className="text-slate-600 dark:text-slate-400" /> : <PanelLeftOpen size={16} className="text-brand" />}
          </Button>

          {/* Reveal hint bar when closed */}
          {!isOpen && (
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-brand/50 rounded-full blur-[2px] opacity-0 group-hover/detect:opacity-100 transition-opacity ml-2"
              onClick={() => setIsOpen(true)}
            />
          )}
        </div>
      </div>

      <div className={cn("px-4 mb-4", !isOpen && "md:px-2")}>
        <Button 
          onClick={createNewChat}
          className={cn(
            "w-full bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white rounded-[1.25rem] py-8 flex items-center gap-3 shadow-2xl transition-all border border-white/5 relative overflow-hidden group",
            !isOpen && "md:p-0 md:h-14 md:w-14 md:mx-auto md:justify-center rounded-2xl"
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand/20 via-transparent to-brand/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="w-8 h-8 rounded-xl bg-brand/20 flex items-center justify-center text-brand shrink-0 group-hover:rotate-90 transition-transform duration-500">
            <Plus size={20} strokeWidth={3} />
          </div>
          <span className={cn("font-black text-sm uppercase tracking-[0.15em]", !isOpen && "md:hidden")}>New Synthesis</span>
        </Button>
      </div>

      <div className={cn("px-4 mb-6", !isOpen && "md:hidden")}>
        <div className={cn(
          "relative group transition-all duration-300",
          isSearchFocused ? "scale-[1.02]" : "scale-100"
        )}>
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300",
            isSearchFocused ? "text-brand" : "text-slate-400 dark:text-slate-600"
          )} size={16} />
          <input 
            type="text" 
            placeholder="Search chats..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={cn(
              "w-full bg-slate-100/50 dark:bg-white/5 border-2 border-transparent rounded-xl py-2.5 pl-10 pr-10 text-sm transition-all outline-none font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-400 dark:placeholder:text-slate-600",
              isSearchFocused ? "border-brand/20 bg-white dark:bg-white/10 shadow-lg shadow-brand/5" : "hover:bg-slate-200/50 dark:hover:bg-white/10",
              !isOpen && "md:hidden"
            )}
          />
          <AnimatePresence>
            {searchQuery && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand transition-colors p-1 rounded-full hover:bg-slate-200 dark:hover:bg-white/10"
              >
                <Plus size={14} className="rotate-45" />
              </motion.button>
            )}
          </AnimatePresence>
          {!searchQuery && (
            <div className={cn("absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 border border-slate-200 dark:border-white/10 rounded px-1.5 py-0.5 pointer-events-none opacity-50", !isOpen && "md:hidden")}>
              ⌘K
            </div>
          )}
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
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all group relative overflow-hidden",
                isActive 
                  ? "bg-brand text-white shadow-lg shadow-brand/20" 
                  : "text-slate-500 dark:text-slate-400 hover:bg-white dark:hover:bg-white/5 hover:text-brand dark:hover:text-brand",
                !isOpen && "md:justify-center md:px-0"
              )}
            >
              {isActive && (
                <motion.div 
                  layoutId="active-nav-bg"
                  className="absolute inset-0 bg-gradient-to-r from-brand to-indigo-600 -z-10"
                />
              )}
              <item.icon size={20} className={cn(
                "shrink-0 transition-transform group-hover:scale-110",
                isActive ? "text-white" : "text-slate-400 dark:text-slate-500 group-hover:text-brand"
              )} />
              <span className={cn(
                "font-bold text-sm tracking-tight transition-opacity",
                !isOpen && "md:hidden"
              )}>
                {item.label}
              </span>
              {item.isPremium && isOpen && (
                <div className="ml-auto flex items-center gap-1 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800">
                  <Crown size={8} /> Pro
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="flex-1 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 px-2">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={chats.map(c => c._id)}
              strategy={verticalListSortingStrategy}
            >
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
                      <SortableChatItem
                        key={chat._id}
                        chat={chat}
                        isActive={id === chat._id}
                        isOpen={isOpen}
                        editingChatId={editingChatId}
                        setEditingChatId={setEditingChatId}
                        editTitle={editTitle}
                        setEditTitle={setEditTitle}
                        onNavigate={(chatId) => {
                          navigate(`/chat/${chatId}`);
                          if (window.innerWidth < 768) setIsOpen(false);
                        }}
                        onRename={renameChat}
                        onDelete={deleteChat}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </SortableContext>
          </DndContext>
        </ScrollArea>
      </div>

      <div className="p-4 border-t border-slate-200/50 dark:border-white/5">
        <PremiumModal isOpen={showPremiumModal} onOpenChange={setShowPremiumModal} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className={cn(
              "w-full h-auto p-2 rounded-xl hover:bg-slate-200/50 dark:hover:bg-white/5 transition-colors justify-start gap-3",
              !isOpen && "md:justify-center md:p-0"
            )}>
              <Avatar className="h-9 w-9 border-2 border-white dark:border-slate-800 shadow-sm shrink-0">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} />
                <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
              </Avatar>
              <div className={cn("flex-1 text-left overflow-hidden", !isOpen && "md:hidden")}>
                <div className="text-sm font-bold text-slate-800 dark:text-white truncate">{user?.name}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-500 truncate">{user?.email}</div>
              </div>
              <LogOut size={16} className={cn("text-slate-400 dark:text-slate-600 shrink-0", !isOpen && "md:hidden")} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-56 rounded-xl mb-2 dark:bg-slate-900 dark:border-white/10">
            <DropdownMenuItem className="rounded-lg cursor-pointer font-bold dark:text-slate-300 dark:hover:bg-white/5" onClick={() => navigate("/profile")}>
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg cursor-pointer font-bold dark:text-slate-300 dark:hover:bg-white/5" onClick={() => navigate("/settings")}>
              App Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-lg cursor-pointer font-bold dark:text-slate-300 dark:hover:bg-white/5" onClick={() => navigate("/billing")}>
              Billing
            </DropdownMenuItem>
            <DropdownMenuSeparator className="dark:bg-white/5" />
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
