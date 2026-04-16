import React from "react";
import { motion } from "framer-motion";
import { Crown, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button.tsx";
import { 
  Dialog, DialogContent 
} from "./ui/dialog.tsx";

interface PremiumModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PremiumModal({ isOpen, onOpenChange }: PremiumModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand/20 blur-[100px] -mr-32 -mt-32" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-brand rounded-xl flex items-center justify-center mb-6 shadow-xl shadow-brand/20">
              <Crown size={24} />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-2">Upgrade to Cortex Pro</h2>
            <p className="text-slate-400 font-medium">Unlock the full potential of creative intelligence.</p>
          </div>
        </div>
        <div className="p-8 bg-white">
          <div className="space-y-4 mb-8">
            {[
              "Unlimited high-speed reasoning",
              "Advanced image generation models",
              "Priority access to new features",
              "100GB secure cloud storage",
              "Custom AI personalities"
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 size={12} />
                </div>
                <span className="text-sm font-bold text-slate-600">{feature}</span>
              </div>
            ))}
          </div>
          <Button className="w-full bg-brand hover:bg-brand-dark text-white rounded-2xl py-7 font-black text-lg shadow-xl shadow-brand/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
            Start 7-Day Free Trial
          </Button>
          <p className="text-center text-[10px] text-slate-400 mt-4 font-bold uppercase tracking-widest">
            Then $19.99/month. Cancel anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
