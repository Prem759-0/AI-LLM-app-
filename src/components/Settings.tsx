import React from "react";
import { motion } from "framer-motion";
import { Settings, Moon, Sun, Bell, Globe, Cpu, Zap, Shield } from "lucide-react";
import { Button } from "./ui/button.tsx";

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 md:px-8 py-8 overflow-y-auto no-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 flex items-center gap-4">
          <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
            <Settings size={32} />
          </div>
          Settings
        </h1>
        <p className="text-slate-500 mt-4 text-lg leading-relaxed">
          Customize your Cortex experience and application preferences.
        </p>
      </motion.div>

      <div className="space-y-8">
        <section className="glass p-8 rounded-[2.5rem] border-white/50 shadow-xl">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <Layout className="text-brand" size={20} />
            Appearance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { id: 'light', label: 'Light', icon: Sun, active: true },
              { id: 'dark', label: 'Dark', icon: Moon, active: false },
              { id: 'system', label: 'System', icon: Globe, active: false },
            ].map((theme) => (
              <button
                key={theme.id}
                className={cn(
                  "flex flex-col items-center gap-4 p-6 rounded-3xl border-2 transition-all",
                  theme.active 
                    ? "border-brand bg-brand/5 text-brand" 
                    : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                )}
              >
                <theme.icon size={24} />
                <span className="font-black uppercase tracking-widest text-[10px]">{theme.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="glass p-8 rounded-[2.5rem] border-white/50 shadow-xl">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <Cpu className="text-brand" size={20} />
            AI Preferences
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-brand shadow-sm">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="font-black text-slate-800">Streaming Responses</p>
                  <p className="text-xs text-slate-500 font-bold">Show AI responses as they are generated.</p>
                </div>
              </div>
              <div className="w-12 h-6 bg-brand rounded-full relative cursor-pointer">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between p-6 rounded-3xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-purple-500 shadow-sm">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="font-black text-slate-800">Advanced Reasoning</p>
                  <p className="text-xs text-slate-500 font-bold">Enable deeper analysis for complex queries.</p>
                </div>
              </div>
              <div className="w-12 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        </section>

        <section className="glass p-8 rounded-[2.5rem] border-white/50 shadow-xl">
          <h3 className="text-xl font-black text-slate-900 mb-8 flex items-center gap-3">
            <Bell className="text-brand" size={20} />
            Notifications
          </h3>
          <div className="space-y-4">
            {['Email Notifications', 'Desktop Alerts', 'Product Updates', 'Security Alerts'].map((item) => (
              <div key={item} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <span className="font-bold text-slate-700">{item}</span>
                <div className="w-10 h-5 bg-slate-200 rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-0.5 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

import { Layout } from "lucide-react";
import { cn } from "../lib/utils.ts";
