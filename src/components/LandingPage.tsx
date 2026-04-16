import React, { useEffect, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { 
  BrainCircuit, Sparkles, Zap, Shield, 
  ArrowRight, MessageSquare, Image as ImageIcon, 
  Globe, Code, Cpu, ChevronRight, CheckCircle2,
  Play, Star, Users, Layout, Layers
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

  return (
    <div className="min-h-screen bg-[#f8f7ff] selection:bg-brand/30 relative">
      {/* Navigation */}
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4 transition-all duration-500",
        isScrolled ? "glass border-b border-white/20 py-3 shadow-lg" : "bg-transparent"
      )}>
        <div className="max-w-7xl mx-auto flex items-center justify-between w-full">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand/20 group-hover:rotate-12 transition-transform">
              <Sparkles size={24} />
            </div>
            <span className="font-black text-2xl tracking-tight text-slate-900">Cortex</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-bold text-slate-600 hover:text-brand transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-bold text-slate-600 hover:text-brand transition-colors">Pricing</a>
            <Button 
              onClick={() => navigate("/auth")}
              variant="ghost" 
              className="text-sm font-bold text-slate-900"
            >
              Log in
            </Button>
            <Button 
              onClick={() => navigate("/chat")}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 h-11 font-bold shadow-xl hover:scale-105 transition-all"
            >
              Get Started
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => navigate("/chat")}
          >
            <ArrowRight size={20} />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 md:pt-40 pb-16 md:pb-20 px-4 md:px-6 overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-brand/5 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-500/5 blur-[120px] rounded-full animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:40px_40px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20" />
        </div>

        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col items-center text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-4xl"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/5 border border-brand/10 text-brand text-[10px] md:text-xs font-black mb-8 uppercase tracking-widest">
                <Sparkles size={14} />
                <span>Cortex AI v2.5 is here</span>
              </div>
              <h1 className="text-5xl sm:text-7xl md:text-9xl font-black text-slate-900 tracking-tight leading-[0.85] mb-8">
                Intelligence <br />
                <span className="brand-text-gradient">Redefined.</span>
              </h1>
              <p className="text-lg md:text-2xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
                Experience the next generation of AI assistance. Cortex combines cutting-edge reasoning with creative power to help you build, learn, and create.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  onClick={() => navigate("/chat")}
                  className="w-full sm:w-auto h-16 px-12 bg-brand hover:bg-brand-dark text-white rounded-2xl font-black text-xl shadow-2xl shadow-brand/30 flex items-center gap-3 group transition-all hover:scale-105"
                >
                  Start Chatting
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  variant="outline"
                  className="w-full sm:w-auto h-16 px-12 rounded-2xl font-black text-xl border-slate-200 bg-white hover:bg-slate-50 shadow-lg flex items-center gap-3"
                >
                  <Play size={18} className="fill-slate-900" />
                  View Demo
                </Button>
              </div>
              
              <div className="mt-16 flex flex-col items-center gap-4">
                <div className="flex -space-x-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-slate-200 overflow-hidden shadow-xl">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="user" referrerPolicy="no-referrer" />
                    </div>
                  ))}
                </div>
                <div className="text-sm font-bold text-slate-500">
                  <span className="text-slate-900">5,000+</span> professionals joined this week
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="relative mt-20 w-full max-w-5xl"
            >
              <div className="relative z-10 glass rounded-[3rem] p-4 border-white/40 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] overflow-hidden group">
                <div className="bg-slate-900 rounded-[2.5rem] aspect-[16/10] flex flex-col overflow-hidden relative">
                  {/* Mock Chat UI */}
                  <div className="h-12 border-b border-white/10 flex items-center px-6 gap-3">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                    </div>
                    <div className="h-4 w-32 bg-white/10 rounded-full mx-auto" />
                  </div>
                  <div className="flex-1 p-8 space-y-6">
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 }}
                      className="flex gap-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-brand/20 shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-3/4 bg-white/10 rounded-lg" />
                        <div className="h-4 w-1/2 bg-white/5 rounded-lg" />
                      </div>
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.5 }}
                      className="flex gap-4 justify-end"
                    >
                      <div className="space-y-2 flex-1 flex flex-col items-end">
                        <div className="h-4 w-2/3 bg-brand/40 rounded-lg" />
                        <div className="h-4 w-1/3 bg-brand/20 rounded-lg" />
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-brand shrink-0" />
                    </motion.div>
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 2, duration: 1, repeat: Infinity, repeatType: "reverse" }}
                      className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4"
                    >
                      <div className="flex items-center gap-3">
                        <Sparkles className="text-brand" size={18} />
                        <div className="h-3 w-24 bg-brand/30 rounded-full" />
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 w-full bg-white/10 rounded-full" />
                        <div className="h-3 w-full bg-white/10 rounded-full" />
                        <div className="h-3 w-4/5 bg-white/5 rounded-full" />
                      </div>
                    </motion.div>
                  </div>
                  <div className="p-6 border-t border-white/10">
                    <div className="h-14 w-full bg-white/5 rounded-2xl border border-white/10 flex items-center px-6 justify-between">
                      <div className="h-4 w-48 bg-white/10 rounded-full" />
                      <div className="w-8 h-8 rounded-lg bg-brand flex items-center justify-center">
                        <ArrowRight size={16} className="text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating Decorative Elements */}
              <motion.div 
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-12 -left-12 glass p-6 rounded-3xl border-white/20 shadow-2xl hidden md:block"
              >
                <div className="w-12 h-12 bg-brand rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg"><BrainCircuit size={24} /></div>
                <div className="h-2 w-24 bg-slate-200 rounded-full mb-2" />
                <div className="h-2 w-16 bg-slate-100 rounded-full" />
              </motion.div>

              <motion.div 
                animate={{ y: [0, 20, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-12 -right-12 glass p-6 rounded-3xl border-white/20 shadow-2xl hidden md:block"
              >
                <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg"><ImageIcon size={24} /></div>
                <div className="h-2 w-32 bg-slate-200 rounded-full mb-2" />
                <div className="h-2 w-20 bg-slate-100 rounded-full" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 bg-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight">Everything you need to excel</h2>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto font-medium">Powerful tools designed to enhance your workflow and spark your creativity.</p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: f.delay, duration: 0.5 }}
                className="p-10 rounded-[3rem] bg-slate-50 hover:bg-white hover:shadow-2xl transition-all duration-500 group border border-transparent hover:border-slate-100"
              >
                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-6 transition-transform shadow-sm", f.bg, f.color)}>
                  <f.icon size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-4 tracking-tight">{f.title}</h3>
                <p className="text-slate-500 text-base leading-relaxed font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 px-6 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand/10 blur-[120px] -z-0" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-20 text-center">
            {[
              { val: "99%", label: "Accuracy Rate", icon: CheckCircle2 },
              { val: "2M+", label: "Users Worldwide", icon: Users },
              { val: "50+", label: "AI Models", icon: Layers },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-brand mb-6">
                  <stat.icon size={24} />
                </div>
                <div className="text-7xl font-black brand-text-gradient mb-4 tracking-tighter">{stat.val}</div>
                <div className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">Simple, Transparent Pricing</h2>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto">Choose the plan that fits your needs. No hidden fees.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Starter", price: "0", features: ["100 messages/month", "Standard models", "Web search", "Basic support"], btn: "Get Started", popular: false },
              { name: "Pro", price: "20", features: ["Unlimited messages", "Advanced models", "Priority support", "Early access"], btn: "Go Pro", popular: true },
              { name: "Enterprise", price: "Custom", features: ["Custom models", "Dedicated support", "SLA guarantee", "Team management"], btn: "Contact Sales", popular: false },
            ].map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "p-10 rounded-[3rem] border flex flex-col h-full relative transition-all duration-500 hover:scale-[1.02]",
                  plan.popular ? "border-brand ring-4 ring-brand/10 shadow-2xl shadow-brand/20 bg-white" : "border-slate-100 shadow-xl bg-slate-50/50"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/20">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-10">
                  <span className="text-4xl font-black text-slate-900">{plan.price === "Custom" ? "" : "$"}</span>
                  <span className="text-6xl font-black text-slate-900 tracking-tighter">{plan.price}</span>
                  <span className="text-slate-400 font-bold text-lg">{plan.price === "Custom" ? "" : "/mo"}</span>
                </div>
                <ul className="space-y-5 mb-12 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-slate-600 font-bold text-sm">
                      <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center text-brand">
                        <CheckCircle2 size={12} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => navigate("/auth")}
                  className={cn(
                    "w-full h-14 rounded-2xl font-black text-lg transition-all",
                    plan.popular ? "bg-brand hover:bg-brand-dark text-white shadow-xl shadow-brand/30" : "bg-slate-900 hover:bg-slate-800 text-white"
                  )}
                >
                  {plan.btn}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto glass rounded-[3rem] p-12 md:p-20 text-center border-white/40 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-brand/5 -z-10" />
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 leading-tight">
            Ready to experience <br /> the future?
          </h2>
          <p className="text-lg text-slate-500 mb-12 max-w-xl mx-auto">
            Join thousands of professionals and creatives who are already using Cortex to supercharge their work.
          </p>
          <Button 
            onClick={() => navigate("/chat")}
            className="h-16 px-12 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xl shadow-2xl flex items-center gap-3 mx-auto group"
          >
            Get Started for Free
            <ChevronRight className="group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-brand/20">
                C
              </div>
              <span className="text-2xl font-black tracking-tight">Cortex</span>
            </div>
            <p className="text-slate-400 font-bold leading-relaxed text-sm">
              Empowering human intelligence with advanced AI reasoning and creative synthesis. Join the evolution of work.
            </p>
          </div>
          <div>
            <h4 className="font-black mb-8 uppercase tracking-widest text-[10px] text-slate-500">Product</h4>
            <ul className="space-y-4 text-slate-400 font-bold text-sm">
              <li><a href="#features" className="hover:text-brand transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-brand transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-brand transition-colors">Models</a></li>
              <li><a href="#" className="hover:text-brand transition-colors">API Docs</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black mb-8 uppercase tracking-widest text-[10px] text-slate-500">Company</h4>
            <ul className="space-y-4 text-slate-400 font-bold text-sm">
              <li><a href="#" className="hover:text-brand transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-brand transition-colors">Our Blog</a></li>
              <li><a href="#" className="hover:text-brand transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-brand transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black mb-8 uppercase tracking-widest text-[10px] text-slate-500">Connect</h4>
            <ul className="space-y-4 text-slate-400 font-bold text-sm">
              <li><a href="#" className="hover:text-brand transition-colors">Twitter / X</a></li>
              <li><a href="#" className="hover:text-brand transition-colors">GitHub</a></li>
              <li><a href="#" className="hover:text-brand transition-colors">Discord</a></li>
              <li><a href="#" className="hover:text-brand transition-colors">LinkedIn</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-10 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-8 text-slate-500 text-[10px] font-black uppercase tracking-widest">
          <p>© 2026 Cortex AI. All rights reserved.</p>
          <div className="flex items-center gap-10">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
