import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Mail, Shield, Camera, Save, Key, Crown } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { useAuth } from "../App.tsx";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar.tsx";
import PremiumModal from "./PremiumModal.tsx";
import { toast } from "sonner";
import { cn } from "../lib/utils.ts";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateUser({ name });
    setIsSaving(false);
    toast.success("Profile updated successfully");
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 md:px-8 py-8 overflow-y-auto no-scrollbar">
      <PremiumModal isOpen={showPremiumModal} onOpenChange={setShowPremiumModal} />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 flex items-center gap-4">
          <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
            <User size={32} />
          </div>
          Profile Settings
        </h1>
        <p className="text-slate-500 mt-4 text-lg leading-relaxed">
          Manage your personal information and account security.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-8">
        <section className="glass p-8 rounded-[2.5rem] border-white/50 shadow-xl">
          <div className="flex flex-col md:flex-row items-center gap-8 mb-10">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-white shadow-2xl">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} />
                <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
              </Avatar>
              <Button 
                size="icon" 
                className="absolute bottom-0 right-0 rounded-full bg-brand hover:bg-brand-dark text-white shadow-lg" 
                onClick={() => setShowPremiumModal(true)}
              >
                <Camera size={18} />
              </Button>
            </div>
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-black text-slate-900">{user?.name}</h2>
              <p className="text-slate-500 font-bold">{user?.email}</p>
              <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest">
                <Shield size={12} />
                Verified Account
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-700 focus:ring-4 focus:ring-brand/10 focus:border-brand outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="email" 
                  defaultValue={user?.email}
                  disabled
                  className="w-full bg-slate-100 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 font-bold text-slate-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="mt-10 flex justify-end">
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="bg-brand hover:bg-brand-dark text-white rounded-2xl px-8 h-14 font-black shadow-xl shadow-brand/20 gap-3"
            >
              <Save size={20} />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </section>

        <section className="glass p-8 rounded-[2.5rem] border-white/50 shadow-xl">
          <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
            <Key size={20} className="text-brand" />
            Security
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <p className="font-black text-slate-800">Two-Factor Authentication</p>
                <p className="text-xs text-slate-500 font-bold">Add an extra layer of security to your account.</p>
              </div>
              <Button variant="outline" className="rounded-xl font-bold border-slate-200" onClick={() => toast.info("2FA configuration coming soon!")}>Enable</Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div>
                <p className="font-black text-slate-800">Change Password</p>
                <p className="text-xs text-slate-500 font-bold">Update your password regularly to stay secure.</p>
              </div>
              <Button variant="outline" className="rounded-xl font-bold border-slate-200" onClick={() => toast.info("Feature coming soon!")}>Update</Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
