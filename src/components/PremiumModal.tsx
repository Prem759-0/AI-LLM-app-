import React from "react";
import { motion } from "framer-motion";
import { Crown, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from "./ui/dialog.tsx";

import api from "../lib/api.ts";
import { toast } from "sonner";

interface PremiumModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PremiumModal({ isOpen, onOpenChange }: PremiumModalProps) {
  const [loading, setLoading] = React.useState<string | null>(null);

  const plans = [
    {
      id: "synapse",
      name: "Synapse",
      price: "$24",
      desc: "For advanced creators",
      features: ["Unlimited Flow", "Advanced Reasoning", "Priority Latency", "Neural Web Search"],
      color: "from-brand to-purple-600"
    },
    {
      id: "nexus",
      name: "Nexus",
      price: "$99",
      desc: "For neural pioneers",
      features: ["Custom Model Training", "SSO & Security Hub", "VIP Support", "Team Workspaces"],
      color: "from-amber-500 to-orange-600"
    }
  ];

  const handleUpgrade = async (planId: string) => {
    try {
      setLoading(planId);
      const res = await api.post("billing/create-checkout-session", { plan: planId });
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: any) {
      toast.error(err.message || "Neural gateway failure. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl dark:bg-[#0b0c14]">
        <div className="bg-slate-900 dark:bg-black p-8 text-white relative overflow-hidden text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/20 blur-[100px] -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/10 blur-[80px] -ml-24 -mb-24" />
          
          <div className="relative z-10">
            <DialogHeader className="p-0 space-y-0">
              <div className="w-16 h-16 bg-gradient-to-br from-brand to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl mx-auto ring-4 ring-brand/20">
                <Crown size={32} />
              </div>
              <DialogTitle className="text-4xl font-black tracking-tighter mb-2 uppercase italic leading-none">
                Elevate Your Intelligence
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mx-auto">
                Access the full Cortex Neural Lattice
              </DialogDescription>
            </DialogHeader>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-900/50">
          {plans.map((plan) => (
            <div 
              key={plan.id}
              className="flex flex-col p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 hover:border-brand/30 transition-all group"
            >
              <div className="mb-6">
                <div className={`inline-block px-3 py-1 rounded-full bg-gradient-to-r ${plan.color} text-white text-[8px] font-black uppercase tracking-[0.2em] mb-4`}>
                  {plan.name} Tier
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black tracking-tighter dark:text-white italic">{plan.price}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/mo</span>
                </div>
                <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-tight">{plan.desc}</p>
              </div>

              <div className="space-y-3 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 size={10} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tight">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                disabled={loading !== null}
                onClick={() => handleUpgrade(plan.id)}
                className={`w-full bg-gradient-to-r ${plan.color} text-white rounded-2xl py-6 font-black text-xs uppercase tracking-widest shadow-xl opacity-90 hover:opacity-100 transition-all hover:scale-105 active:scale-95`}
              >
                {loading === plan.id ? "Initiating..." : `Select ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-slate-100 dark:bg-black/40 border-t border-slate-200 dark:border-white/5 text-center">
          <p className="text-[8px] text-slate-400 font-bold uppercase tracking-[0.3em]">
            7-day trial available for new pioneers. Secured by Stripe.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
