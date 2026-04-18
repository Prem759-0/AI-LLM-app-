import React, { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Moon, Sun, Bell, Globe, Cpu, Zap, Shield, Layout } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { Switch } from "./ui/switch.tsx";
import { cn } from "../lib/utils.ts";
import { toast } from "sonner";
import PremiumModal from "./PremiumModal.tsx";
import { useTheme } from "../App.tsx";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [streaming, setStreaming] = useState(() => localStorage.getItem('streaming') !== 'false');
  const [reasoning, setReasoning] = useState(() => localStorage.getItem('reasoning') === 'true');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [notifications, setNotifications] = useState({
    email: true,
    alerts: true,
    updates: false,
    security: true
  });

  const handleSave = () => {
    localStorage.setItem('streaming', streaming.toString());
    localStorage.setItem('reasoning', reasoning.toString());
    toast.success("Settings saved successfully");
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 md:px-8 py-8 overflow-y-auto no-scrollbar transition-colors">
      <PremiumModal isOpen={showPremiumModal} onOpenChange={setShowPremiumModal} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white flex items-center gap-4 italic tracking-tighter">
            <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
              <Settings size={32} />
            </div>
            Settings
          </h1>
          <Button onClick={handleSave} className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-xl px-8 h-12 font-black uppercase text-[10px] tracking-widest shadow-lg shadow-brand/20 transition-all hover:scale-105">
            Save Changes
          </Button>
        </div>
        <p className="text-slate-500 dark:text-slate-400 mt-4 text-lg leading-relaxed italic pr-4">
          Customize your Cortex experience and application preferences.
        </p>
      </motion.div>

      <div className="space-y-8 pb-12">
        <section className="glass p-8 rounded-[2.5rem] border-white/50 dark:border-white/5 shadow-xl transition-colors">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase italic tracking-tighter">
            <Layout className="text-brand" size={20} />
            Appearance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'light', label: 'Light', icon: Sun },
              { id: 'dark', label: 'Dark', icon: Moon },
              { id: 'system', label: 'System', icon: Globe },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={cn(
                  "flex flex-col items-center gap-4 p-6 rounded-3xl border-2 transition-all",
                  theme === t.id 
                    ? "border-brand bg-brand/5 dark:bg-brand/10 text-brand shadow-inner" 
                    : "border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-600 hover:border-slate-200 dark:hover:border-white/10"
                )}
              >
                <t.icon size={24} />
                <span className="font-black uppercase tracking-widest text-[10px]">{t.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="glass p-8 rounded-[2.5rem] border-white/50 dark:border-white/5 shadow-xl transition-colors">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase italic tracking-tighter">
            <Cpu className="text-brand" size={20} />
            AI Preferences
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-brand shadow-sm">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="font-black text-slate-800 dark:text-white">Streaming Responses</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500 font-bold">Show AI responses as they are generated.</p>
                </div>
              </div>
              <Switch checked={streaming} onCheckedChange={setStreaming} />
            </div>
            <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group/item hover:border-brand/30 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center text-purple-500 shadow-sm group-hover/item:scale-110 transition-transform">
                  <Shield size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-black text-slate-800 dark:text-white">Advanced Reasoning</p>
                    <div className="bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800">Pro</div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-500 font-bold">Enable deeper analysis for complex queries.</p>
                </div>
              </div>
              <Switch checked={reasoning} onCheckedChange={(val) => {
                if (val) setShowPremiumModal(true);
                else setReasoning(false);
              }} />
            </div>
          </div>
        </section>

        <section className="glass p-8 rounded-[2.5rem] border-white/50 dark:border-white/5 shadow-xl transition-colors">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase italic tracking-tighter">
            <Bell className="text-brand" size={20} />
            Notifications
          </h3>
          <div className="space-y-4">
            {[
              { id: 'email', label: 'Email Notifications' },
              { id: 'alerts', label: 'Desktop Alerts' },
              { id: 'updates', label: 'Product Updates' },
              { id: 'security', label: 'Security Alerts' }
            ].map((item) => (
              <div key={item.id} className="flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-0 pl-4">
                <span className="font-bold text-slate-700 dark:text-slate-300">{item.label}</span>
                <Switch 
                  checked={notifications[item.id as keyof typeof notifications]} 
                  onCheckedChange={(val) => setNotifications(prev => ({ ...prev, [item.id]: val }))} 
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
