import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { 
  BrainCircuit, Sparkles, Zap, Shield, 
  ArrowRight, MessageSquare, Image as ImageIcon, 
  Globe, Code, Cpu, ChevronRight, CheckCircle2,
  Play, Star, Users, Layout, Layers, Menu,
  ShieldCheck, Box, Wand2, Brain
} from "lucide-react";
import { Button } from "./ui/button.tsx";
import { cn } from "../lib/utils.ts";

export default function LandingPage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      title: "Advanced Intelligence",
      desc: "Powered by the latest Gemini models for unparalleled reasoning and creativity.",
      icon: BrainCircuit,
      color: "text-blue-500",
      bg: "bg-blue-50",
      delay: 0.1
    },
    {
      title: "Creative Studio",
      desc: "Generate stunning visuals and artwork directly within your conversation.",
      icon: ImageIcon,
      color: "text-purple-500",
      bg: "bg-purple-50",
      delay: 0.2
    },
    {
      title: "Lightning Fast",
      desc: "Real-time streaming responses that keep up with your train of thought.",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-50",
      delay: 0.3
    },
    {
      title: "Secure & Private",
      desc: "Your data is encrypted and your conversations are yours alone.",
      icon: Shield,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      delay: 0.4
    }
  ];

  const handlePlanInitiate = (plan: string) => {
    if (plan === 'node') {
      navigate('/chat');
    } else {
      // For paid plans, we try to go to checkout directly or via auth if not logged in
      navigate('/billing?plan=' + plan);
    }
  };

  return (
    <div className="min-h-screen bg-[#02040a] selection:bg-brand/30 relative text-white selection:text-white">
      {/* Dynamic Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-brand/10 blur-[150px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-purple-600/10 blur-[150px] rounded-full animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:40px_40px] opacity-20" />
      </div>

      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 px-4 md:px-8 py-6 transition-all duration-500",
        isScrolled ? "bg-black/60 backdrop-blur-xl border-b border-white/10 py-4 shadow-2xl" : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 group cursor-pointer" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="w-11 h-11 bg-brand rounded-[1rem] flex items-center justify-center text-white font-bold shadow-lg shadow-brand/20 group-hover:rotate-[15deg] transition-all duration-500 bg-gradient-to-br from-brand to-purple-600">
              <Sparkles size={24} />
            </div>
            <span className="font-black text-2xl tracking-tighter text-white uppercase italic">Cortex</span>
          </motion.div>
          
          <div className="hidden md:flex items-center gap-10">
            {['Features', 'Intelligence', 'Workflow', 'Pricing'].map((item, i) => (
              <motion.a 
                key={item}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                href={`#${item.toLowerCase()}`} 
                className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white transition-colors"
              >
                {item}
              </motion.a>
            ))}
            <div className="h-6 w-[1px] bg-white/10 mx-2" />
            <Button 
              onClick={() => navigate("/auth")}
              variant="ghost" 
              className="text-xs font-black uppercase tracking-[0.2em] text-white hover:bg-white/5"
            >
              Sign In
            </Button>
            <Button 
              onClick={() => navigate("/chat")}
              className="bg-white text-black hover:bg-slate-200 rounded-full px-8 h-12 font-black uppercase text-[10px] tracking-widest shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:scale-105 active:scale-95 transition-all"
            >
              Start Chatting
            </Button>
          </div>

          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-white"
            onClick={() => navigate("/chat")}
          >
            <Menu size={24} />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 md:pt-40 pb-16 md:pb-24 px-4 overflow-hidden min-h-[90vh] md:min-h-screen flex items-center">
        {/* Floating Particles/Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                x: Math.random() * 100 + "%", 
                y: Math.random() * 100 + "%",
                opacity: 0 
              }}
              animate={{ 
                x: [null, Math.random() * 100 + "%"],
                y: [null, Math.random() * 100 + "%"],
                opacity: [0, 0.2, 0],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 20 + Math.random() * 20, 
                repeat: Infinity,
                ease: "linear"
              }}
              className="absolute w-32 h-32 md:w-64 md:h-64 rounded-full bg-brand/5 blur-3xl lg:blur-[100px]"
            />
          ))}
        </div>

        <div className="max-w-7xl mx-auto w-full relative">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-5xl"
            >
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-3 px-4 md:px-6 py-2 rounded-full bg-white/5 border border-white/10 text-brand text-[8px] md:text-[10px] font-black mb-6 md:mb-12 uppercase tracking-[0.2em] md:tracking-[0.3em] shadow-inner"
              >
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-brand animate-ping" />
                <span>Next-Gen Intelligence Engine</span>
              </motion.div>
              
              <h1 className="text-[14vw] sm:text-[10vw] md:text-[8vw] font-black text-white tracking-tighter leading-[0.8] mb-8 md:mb-12 uppercase italic">
                Beyond <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand via-purple-400 to-indigo-400 animate-gradient-x">Creation.</span>
              </h1>

              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 1 }}
                className="text-base md:text-2xl text-slate-400 max-w-2xl md:max-w-3xl mx-auto mb-10 md:mb-16 leading-relaxed font-medium tracking-tight px-4"
              >
                Experience the shift in human-AI collaboration. Cortex isn't just a chatbot—it's an extension of your own cognitive potential.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 px-4"
              >
                <Button 
                  onClick={() => navigate("/chat")}
                  className="w-full sm:w-auto h-16 md:h-20 px-8 md:px-16 bg-brand hover:bg-brand-dark text-white rounded-2xl font-black text-lg md:text-xl shadow-[0_20px_50px_rgba(124,58,237,0.3)] flex items-center justify-center gap-4 group transition-all hover:scale-105 active:scale-95 uppercase italic tracking-tighter"
                >
                  Enter Neural Core
                  <ArrowRight className="group-hover:translate-x-2 transition-transform" />
                </Button>
                <Button 
                  onClick={() => navigate("/chat")}
                  variant="outline"
                  className="w-full sm:w-auto h-16 md:h-20 px-8 md:px-16 rounded-2xl font-black text-lg md:text-xl border-white/10 bg-white/5 text-white hover:bg-white/10 backdrop-blur-md flex items-center justify-center gap-4 group transition-all"
                >
                  <Play size={20} className="fill-white group-hover:scale-110 transition-transform" />
                  Experience Demo
                </Button>
              </motion.div>
            </motion.div>

            {/* Interactive Preview Container */}
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 1.5, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="relative mt-20 md:mt-32 w-full max-w-6xl group px-4 md:px-0"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-brand to-purple-600 rounded-[2rem] md:rounded-[4rem] blur opacity-25 group-hover:opacity-40 transition-opacity duration-1000" />
              <div className="relative z-10 glass-dark rounded-[2rem] md:rounded-[3.5rem] p-3 md:p-6 border border-white/10 shadow-2xl overflow-hidden">
                <div className="bg-[#0f111a] rounded-[1.5rem] md:rounded-[2.5rem] aspect-video md:aspect-[16/9] flex flex-col overflow-hidden relative shadow-inner">
                  {/* Decorative Header */}
                  <div className="h-14 border-b border-white/5 flex items-center px-10 gap-4 bg-white/[0.02]">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/30" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/30" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/30" />
                    </div>
                    <div className="h-5 w-48 bg-white/5 rounded-full mx-auto animate-pulse" />
                    <div className="flex gap-4">
                      <div className="w-6 h-6 rounded-lg bg-white/5" />
                      <div className="w-6 h-6 rounded-lg bg-white/5" />
                    </div>
                  </div>
                  
                  {/* Visual Content Area - Refined Active Chat UI */}
                  <div className="flex-1 p-10 flex flex-col gap-6 overflow-hidden">
                    {[
                      { role: 'ai', text: 'Analyzing neural architecture... vectors mapped.' },
                      { role: 'user', text: 'Optimize the synthesis protocol for high-latency nodes.' },
                      { role: 'ai', text: 'Recalibrating throughput... implementation ready.' }
                    ].map((m, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 2 + (i * 1.2), duration: 0.8 }}
                        className={cn(
                          "flex gap-4 items-start",
                          m.role === 'user' ? "flex-row-reverse" : "flex-row"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                          m.role === 'ai' ? "bg-brand/20 border-brand/30 text-brand" : "bg-white/10 border-white/10 text-slate-300"
                        )}>
                          {m.role === 'ai' ? <Sparkles size={18} /> : <div className="text-xs font-black uppercase">U</div>}
                        </div>
                        <div className={cn(
                          "max-w-[70%] p-5 rounded-3xl text-sm leading-relaxed border shadow-2xl backdrop-blur-sm",
                          m.role === 'ai' ? "bg-slate-800/80 text-slate-300 border-white/5" : "bg-brand/30 text-white border-brand/40"
                        )}>
                          {m.text}
                          {i === 2 && (
                            <motion.div 
                              className="mt-3 flex gap-1"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: 5 }}
                            >
                              <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce" />
                              <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce delay-75" />
                              <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce delay-150" />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Input Bar Preview */}
                  <div className="p-8 border-t border-white/5 bg-white/[0.01]">
                    <div className="h-20 w-full bg-white/5 rounded-3xl border border-white/10 flex items-center px-8 shadow-2xl relative group/input">
                      <div className="flex items-center gap-6 flex-1">
                        <Sparkles size={24} className="text-brand animate-pulse" />
                        <div className="text-lg font-medium text-slate-500 italic uppercase tracking-wider">Synthesizing query...</div>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-brand flex items-center justify-center shadow-lg shadow-brand/40 group-hover/input:scale-110 transition-transform">
                        <ArrowRight size={20} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Ticker */}
      <section className="py-16 border-y border-white/5 bg-black/40 backdrop-blur-md">
         <div className="max-w-7xl mx-auto px-6 overflow-hidden relative">
            <motion.div 
              animate={{ x: [0, -1000] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              className="flex items-center gap-32 whitespace-nowrap"
            >
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="flex items-center gap-8">
                  <div className="text-4xl font-black italic tracking-tighter text-white/20 uppercase">Aura Model v.1</div>
                  <Sparkles size={24} className="text-brand/30" />
                  <div className="text-4xl font-black italic tracking-tighter text-white/20 uppercase">Neural Synthesis</div>
                  <Cpu size={24} className="text-purple-500/30" />
                  <div className="text-4xl font-black italic tracking-tighter text-white/20 uppercase">Hyper-Scaling</div>
                </div>
              ))}
            </motion.div>
         </div>
      </section>

      {/* Feature Bento Grid */}
      <section id="features" className="py-40 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-32">
             <div className="max-w-2xl">
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  className="text-brand font-black text-xs uppercase tracking-[0.4em] mb-6"
                >
                  Core Capabilities
                </motion.div>
                <h2 className="text-6xl md:text-8xl font-black text-white tracking-tighter leading-[0.8] uppercase italic">
                   Architected <br /> for Impact.
                </h2>
             </div>
             <p className="text-lg md:text-xl text-slate-400 max-w-md font-medium leading-relaxed">
                We've rebuilt the foundational elements of AI interaction to prioritize speed, depth, and creative freedom.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[900px]">
            {/* Main Feature */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="md:col-span-8 md:row-span-2 glass-dark p-12 rounded-[3.5rem] border border-white/10 flex flex-col justify-between group overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-brand/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div>
                 <div className="w-20 h-20 bg-brand/20 rounded-[1.5rem] flex items-center justify-center text-brand mb-12 shadow-inner">
                    <BrainCircuit size={40} />
                 </div>
                 <h3 className="text-5xl font-black text-white mb-6 tracking-tighter uppercase italic">Neural Reasoning</h3>
                 <p className="text-xl text-slate-400 max-w-sm font-medium leading-relaxed">
                    Our proprietary reasoning chain analyzes context deeper than standard LLMs, delivering precise insights for complex problem solving.
                 </p>
              </div>
              <div className="mt-12 pt-12 border-t border-white/5 grid grid-cols-3 gap-8">
                 {[
                   { val: "10K+", label: "Context Window" },
                   { val: "20ms", label: "Latency" },
                   { val: "99%", label: "Accuracy" }
                 ].map(stat => (
                   <div key={stat.label}>
                      <div className="text-3xl font-black text-white italic">{stat.val}</div>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{stat.label}</div>
                   </div>
                 ))}
              </div>
            </motion.div>

            {/* Side Feature 1 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="md:col-span-4 glass-dark p-10 rounded-[3.5rem] border border-white/10 flex flex-col justify-end bg-gradient-to-br from-purple-900/10 to-transparent"
            >
               <ImageIcon className="text-purple-400 mb-8" size={32} />
               <h3 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase italic">Visual Synthesis</h3>
               <p className="text-slate-400 font-medium">Generate cinema-grade visuals instantly within your chat stream.</p>
            </motion.div>

            {/* Side Feature 2 */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="md:col-span-4 glass-dark p-10 rounded-[3.5rem] border border-white/10 flex flex-col justify-end bg-gradient-to-br from-indigo-900/10 to-transparent"
            >
               <Shield className="text-indigo-400 mb-8" size={32} />
               <h3 className="text-3xl font-black text-white mb-4 tracking-tighter uppercase italic">Fortress Security</h3>
               <p className="text-slate-400 font-medium">Conversations are hardware-encrypted and processed on-edge where possible.</p>
            </motion.div>

            {/* Bottom Row Highlights */}
            <motion.div 
              whileHover={{ y: -10 }}
              className="md:col-span-6 glass-dark p-10 rounded-[3.5rem] border border-white/10 flex items-center justify-between"
            >
               <div>
                  <h3 className="text-2xl font-black text-white mb-2 tracking-tighter uppercase italic">Multi-Modal Core</h3>
                  <p className="text-sm text-slate-400">Audio, Video, and Image native.</p>
               </div>
               <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10" />)}
               </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -10 }}
              className="md:col-span-6 bg-brand p-1 rounded-[3.5rem] shadow-[0_20px_40px_rgba(124,58,237,0.3)] group cursor-pointer"
            >
               <div className="w-full h-full bg-slate-900 rounded-[3.2rem] flex items-center justify-center p-10 group-hover:bg-brand transition-colors duration-500">
                  <span className="text-xl font-black text-white uppercase italic tracking-tighter group-hover:scale-110 transition-transform flex items-center gap-4">
                     Explore All Capabilities
                     <ArrowRight size={20} />
                  </span>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing: Pure Minimalist */}
      <section id="pricing" className="py-40 px-6 bg-white text-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-32">
            <h2 className="text-6xl md:text-8xl font-black text-black tracking-tighter leading-[0.8] mb-8 uppercase italic">Pricing <br /> without friction.</h2>
            <p className="text-xl text-slate-500 font-medium italic">Scalable plans for every stage of intelligence.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { name: "Node", price: "0", features: ["15 Message Synthesis", "4 Image Generations", "4 File Contexts", "Standard Latency"], active: false },
              { name: "Synapse", price: "24", features: ["Unlimited Flow", "Advanced Reasoning", "Priority Latency", "Neural Web Search"], active: true },
              { name: "Nexus", price: "99", features: ["Custom Models", "SSO & Security Hub", "VIP Support", "Team Workspaces"], active: false },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "p-12 rounded-[4rem] border transition-all duration-500 group",
                  plan.active 
                    ? "bg-black text-white border-transparent shadow-[0_40px_80px_rgba(0,0,0,0.2)] scale-105 z-10" 
                    : "bg-white border-slate-100 shadow-xl hover:shadow-2xl translate-y-4"
                )}
              >
                <div className="text-xs font-black uppercase tracking-[0.4em] mb-12 opacity-50">{plan.name}</div>
                <div className="flex items-baseline gap-2 mb-16">
                  <span className="text-7xl font-black tracking-tighter italic">${plan.price}</span>
                  <span className="text-sm font-black opacity-50 uppercase tracking-widest">/mo</span>
                </div>
                <ul className="space-y-6 mb-16">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-4 text-sm font-bold opacity-80 uppercase tracking-tight">
                      <div className={cn("w-1.5 h-1.5 rounded-full", plan.active ? "bg-brand" : "bg-slate-300")} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => handlePlanInitiate(plan.name.toLowerCase())}
                  className={cn(
                    "w-full h-16 rounded-3xl font-black text-sm uppercase tracking-widest transition-all",
                    plan.active ? "bg-brand hover:bg-white hover:text-black text-white" : "bg-black text-white hover:bg-slate-800"
                  )}
                >
                  Initiate {plan.name} Plan
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-40 px-6 relative overflow-hidden bg-black flex items-center justify-center">
        <div className="absolute inset-0 bg-brand/5 blur-[120px]" />
        <div className="max-w-4xl mx-auto text-center relative z-10 px-4">
          <motion.div
             initial={{ opacity: 0, scale: 0.8 }}
             whileInView={{ opacity: 1, scale: 1 }}
             viewport={{ once: true }}
          >
             <h2 className="text-[12vw] md:text-[8vw] font-black text-white tracking-tighter leading-[0.8] mb-16 uppercase italic">
                Connect your <br /> mind.
             </h2>
             <Button 
               onClick={() => navigate("/chat")}
               className="h-24 px-20 bg-brand hover:bg-brand-dark text-white rounded-3xl font-black text-2xl shadow-[0_20px_60px_rgba(124,58,237,0.4)] flex items-center gap-6 mx-auto group uppercase italic tracking-tighter"
             >
               Start Your Evolution
               <ArrowRight size={24} className="group-hover:translate-x-3 transition-transform" />
             </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <section className="py-40 px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-24"
          >
            <h2 className="text-5xl md:text-8xl font-black text-white uppercase italic tracking-tighter mb-8 leading-none">
              The Neural <span className="brand-text-gradient">Advantage</span>
            </h2>
            <p className="text-slate-400 text-xl md:text-2xl font-medium max-w-3xl mx-auto leading-relaxed">
              Precision-engineered tools for the next generation of digital pioneers. Built to scale with your ambition.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: BrainCircuit, 
                title: "Deep Reasoning", 
                desc: "Recursive chain-of-thought processing for problems that demand absolute analytical precision." 
              },
              { 
                icon: Zap, 
                title: "Flash Response", 
                desc: "Sub-millisecond latency for real-time creative flow and lightning-fast iteration cycles." 
              },
              { 
                icon: ShieldCheck, 
                title: "Neural Privacy", 
                desc: "Military-grade encryption for all interactions. Your cognitive data remains exclusively yours." 
              },
              { 
                icon: Globe, 
                title: "Global Context", 
                desc: "Instant access to real-time global knowledge without the constraints of traditional search." 
              },
              { 
                icon: Box, 
                title: "Multi-Modal", 
                desc: "Seamlessly transition between text, image, and code with a unified, high-bandwidth neural model." 
              },
              { 
                icon: Wand2, 
                title: "Adaptive Learning", 
                desc: "Continually evolves to match your specific cognitive patterns, preferences, and unique workflows." 
              }
            ].map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.6 }}
                className="glass-dark p-12 rounded-[4rem] border-white/5 hover:border-brand/30 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-brand/10 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-brand/20 transition-colors" />
                <div className="w-20 h-20 rounded-[2rem] bg-white/5 flex items-center justify-center text-brand mb-10 group-hover:scale-110 transition-transform shadow-inner">
                  <f.icon size={40} />
                </div>
                <h3 className="text-3xl font-black text-white mb-6 uppercase italic tracking-tighter">{f.title}</h3>
                <p className="text-slate-400 text-lg font-medium leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-24 px-8 bg-[#02040a] border-t border-white/5 relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20">
          <div className="lg:col-span-5 flex flex-col items-start italic">
            <div className="flex items-center gap-3 mb-10 group cursor-pointer" onClick={() => navigate("/")}>
              <div className="w-14 h-14 bg-brand rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-brand/40 group-hover:scale-110 transition-transform">
                <Sparkles size={32} />
              </div>
              <span className="text-4xl font-black tracking-tighter uppercase text-white group-hover:brand-text-gradient transition-all">Cortex</span>
            </div>
            <p className="text-slate-500 font-bold leading-relaxed text-lg max-w-sm mb-12">
              Engineered for those who refuse to wait for the future. Cortex is the definitive synthesis of speed and deep intelligence.
            </p>
            <div className="flex items-center gap-10">
               {['Twitter', 'Discord', 'Github', 'LinkedIn'].map(s => (
                 <a key={s} href="#" className="text-xs font-black uppercase tracking-[0.2em] text-slate-600 hover:text-white transition-all transform hover:-translate-y-1">{s}</a>
               ))}
            </div>
          </div>
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-16">
            <div>
              <h4 className="font-black mb-10 uppercase tracking-[0.4em] text-xs text-slate-600">Core</h4>
              <ul className="space-y-6 text-slate-400 font-black text-xs uppercase tracking-widest">
                <li><a href="#" className="hover:text-brand transition-colors">Neural Hub</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Visual SDK</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">API Lattice</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black mb-10 uppercase tracking-[0.4em] text-xs text-slate-600">Intel</h4>
              <ul className="space-y-6 text-slate-400 font-black text-xs uppercase tracking-widest">
                <li><a href="#" className="hover:text-brand transition-colors">Papers</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Nexus Docs</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Broadcast</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black mb-10 uppercase tracking-[0.4em] text-xs text-slate-600">Company</h4>
              <ul className="space-y-6 text-slate-400 font-black text-xs uppercase tracking-widest">
                <li><a href="#" className="hover:text-brand transition-colors">About</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-brand transition-colors">Ethics</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-40 pt-16 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-12 text-slate-600 text-[10px] font-black uppercase tracking-[0.5em]">
          <p>© 2026 Cortex Neural Systems. Engineered for the infinite.</p>
          <div className="flex items-center gap-16">
            <a href="#" className="hover:text-white transition-all">Privacy</a>
            <a href="#" className="hover:text-white transition-all">Terms</a>
            <a href="#" className="hover:text-white transition-all">Governance</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
