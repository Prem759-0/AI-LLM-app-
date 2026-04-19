import React, { useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle2, Zap, Star, Shield, History, Download } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { Progress } from "./ui/progress.tsx";
import PremiumModal from "./PremiumModal.tsx";
import api from "../lib/api.ts";
import { toast } from "sonner";
import { useAuth } from "../App.tsx";
import { useSearchParams } from "react-router-dom";

export default function Billing() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-trigger plan from URL
  React.useEffect(() => {
    const plan = searchParams.get("plan");
    if (plan && !user?.isPro) {
      handleUpgrade(plan);
    }
  }, []);

  // Derived usage
  const messagesUsed = user?.usage?.messages || 0;
  const messagesLimit = user?.isPro ? Infinity : 15;
  const imagesUsed = user?.usage?.images || 0;
  const imagesLimit = user?.isPro ? Infinity : 4;

  const handleUpgrade = async (planType = "synapse") => {
    try {
      setLoading(true);
      const res = await api.post("billing/create-checkout-session", { plan: planType });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 md:px-8 py-8 overflow-y-auto no-scrollbar bg-[#fcfcff] dark:bg-[#0b0c14] transition-colors duration-500">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white flex items-center gap-4 italic tracking-tighter uppercase">
          <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
            <CreditCard size={32} />
          </div>
          Neural Billing
        </h1>
        <p className="text-slate-500 dark:text-slate-500 mt-4 text-lg leading-relaxed font-medium">
          Manage your neural bandwidth, payment vectors, and synthesis history.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 gap-8">
        <section className="glass dark:bg-slate-900/50 p-8 rounded-[2.5rem] border-white/50 dark:border-white/5 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 text-brand text-[10px] font-black uppercase tracking-widest mb-4">
                Current State
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">{user?.isPro ? "Neural Synapse" : "Neural Node"}</h2>
              <p className="text-slate-500 dark:text-slate-500 font-bold mt-1 uppercase text-[10px] tracking-widest">
                {user?.isPro ? "Full high-bandwidth neural access enabled." : "Foundational synthesis capacity active."}
              </p>
            </div>
            {!user?.isPro && (
              <div className="flex gap-2">
                <Button 
                  disabled={loading}
                  onClick={() => handleUpgrade("synapse")}
                  className="bg-brand hover:bg-brand-dark text-white rounded-2xl px-6 h-14 font-black shadow-xl uppercase tracking-widest text-xs"
                >
                  {loading ? "..." : "Sync Synapse"}
                </Button>
                <Button 
                  disabled={loading}
                  onClick={() => handleUpgrade("nexus")}
                  variant="outline"
                  className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200 dark:border-white/10 rounded-2xl px-6 h-14 font-black shadow-lg uppercase tracking-widest text-xs"
                >
                   Sync Nexus
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 dark:bg-white/5 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Zap size={12} className="text-brand" />
                    Messages
                  </div>
                  <span className="text-[10px] font-black text-brand uppercase tracking-widest">
                    {messagesUsed} / {user?.isPro ? "∞" : messagesLimit}
                  </span>
                </div>
                <Progress value={user?.isPro ? 100 : (messagesUsed / messagesLimit) * 100} className="h-2 bg-white dark:bg-slate-900" />
              </div>

              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 dark:bg-white/5 dark:border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    <Star size={12} className="text-amber-500" />
                    Images
                  </div>
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">
                    {imagesUsed} / {user?.isPro ? "∞" : imagesLimit}
                  </span>
                </div>
                <Progress value={user?.isPro ? 100 : (imagesUsed / imagesLimit) * 100} className="h-2 bg-white dark:bg-slate-900" />
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="glass dark:bg-slate-900/50 p-8 rounded-[2.5rem] border-white/50 dark:border-white/5 shadow-xl transition-colors">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3 italic tracking-tighter uppercase">
              <Star size={20} className="text-amber-500" />
              Pro Features
            </h3>
            <ul className="space-y-4">
              {[
                "Unlimited messages",
                "Priority model access",
                "Advanced image generation",
                "Early access to new features",
                "Priority support"
              ].map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>
          </section>

          <section className="glass dark:bg-slate-900/50 p-8 rounded-[2.5rem] border-white/50 dark:border-white/5 shadow-xl transition-colors">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3 italic tracking-tighter uppercase">
              <Shield size={20} className="text-brand" />
              Payment Method
            </h3>
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-between transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-white/10 flex items-center justify-center">
                  <div className="w-6 h-4 bg-slate-200 dark:bg-slate-700 rounded-sm" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">•••• 4242</p>
                  <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">Expires 12/28</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-slate-400 hover:text-brand transition-colors">
                <History size={18} />
              </Button>
            </div>
            <Button variant="outline" className="w-full mt-6 rounded-2xl h-12 border-slate-200 dark:border-white/10 font-black text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
              Update Method
            </Button>
          </section>
        </div>

        <section className="glass dark:bg-slate-900/50 p-8 rounded-[2.5rem] border-white/50 dark:border-white/5 shadow-xl">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase italic tracking-tighter">
            <History size={20} className="text-brand" />
            Synthesis History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5">
                  <th className="pb-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Timestamp</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Credits</th>
                  <th className="pb-4 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">Status</th>
                  <th className="pb-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {[
                  { date: "Apr 1, 2026", amount: "$0.00", status: "Success" },
                  { date: "Mar 1, 2026", amount: "$0.00", status: "Success" },
                ].map((invoice, i) => (
                  <tr key={i} className="group transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                    <td className="py-4 text-sm font-bold text-slate-700 dark:text-slate-400">{invoice.date}</td>
                    <td className="py-4 text-sm font-black text-slate-900 dark:text-slate-200 tracking-tighter italic">{invoice.amount}</td>
                    <td className="py-4">
                      <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-brand rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                        <Download size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      <PremiumModal isOpen={showPremiumModal} onOpenChange={setShowPremiumModal} />
    </div>
  );
}
