import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  BrainCircuit, Sparkles, Zap, Shield, 
  ArrowRight, MessageSquare, Image as ImageIcon, 
  Globe, Code, Cpu, ChevronRight, CheckCircle2
} from "lucide-react";
import { Button } from "./ui/button.tsx";
import { cn } from "../lib/utils.ts";

export default function LandingPage() {
  const navigate = useNavigate();

  const features = [
    {
      title: "Advanced Intelligence",
      desc: "Powered by the latest Gemini models for unparalleled reasoning and creativity.",
      icon: BrainCircuit,
      color: "text-blue-500",
      bg: "bg-blue-50"
    },
    {
      title: "Creative Studio",
      desc: "Generate stunning visuals and artwork directly within your conversation.",
      icon: ImageIcon,
      color: "text-purple-500",
      bg: "bg-purple-50"
    },
    {
      title: "Lightning Fast",
      desc: "Real-time streaming responses that keep up with your train of thought.",
      icon: Zap,
      color: "text-amber-500",
      bg: "bg-amber-50"
    },
    {
      title: "Secure & Private",
      desc: "Your data is encrypted and your conversations are yours alone.",
      icon: Shield,
      color: "text-emerald-500",
      bg: "bg-emerald-50"
    }
  ];

  return (
    <div className="min-h-screen bg-[#f8f7ff] overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass border-b border-white/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-brand rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-brand/20">
            C
          </div>
          <span className="font-bold text-2xl tracking-tight text-slate-900">Cortex</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-medium text-slate-600 hover:text-brand transition-colors">Features</a>
          <a href="#about" className="text-sm font-medium text-slate-600 hover:text-brand transition-colors">About</a>
          <Button 
            onClick={() => navigate("/auth")}
            variant="ghost" 
            className="text-sm font-bold text-slate-900"
          >
            Log in
          </Button>
          <Button 
            onClick={() => navigate("/chat")}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-6 font-bold shadow-xl"
          >
            Get Started
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full animate-pulse delay-700" />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/5 border border-brand/10 text-brand text-xs font-bold mb-8">
              <Sparkles size={14} />
              <span>Introducing Cortex v2.5</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tight leading-[0.9] mb-8">
              Intelligence <br />
              <span className="brand-text-gradient">Redefined.</span>
            </h1>
            <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-12 leading-relaxed">
              Experience the next generation of AI assistance. Cortex combines cutting-edge reasoning with creative power to help you build, learn, and create.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button 
                onClick={() => navigate("/chat")}
                className="w-full sm:w-auto h-14 px-10 bg-brand hover:bg-brand-dark text-white rounded-2xl font-bold text-lg shadow-2xl shadow-brand/30 flex items-center gap-2 group"
              >
                Start Chatting
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="outline"
                className="w-full sm:w-auto h-14 px-10 rounded-2xl font-bold text-lg border-slate-200 bg-white hover:bg-slate-50"
              >
                View Demo
              </Button>
            </div>
          </motion.div>

          {/* App Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mt-20 relative"
          >
            <div className="glass rounded-[3rem] p-4 border-white/40 shadow-2xl max-w-5xl mx-auto overflow-hidden">
              <div className="bg-slate-900 rounded-[2.5rem] aspect-video flex items-center justify-center overflow-hidden relative">
                <img 
                  src="https://picsum.photos/seed/cortex/1920/1080" 
                  alt="App Preview" 
                  className="w-full h-full object-cover opacity-50"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform">
                    <ChevronRight size={40} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything you need to excel</h2>
            <p className="text-slate-500 max-w-xl mx-auto">Powerful tools designed to enhance your workflow and spark your creativity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[2.5rem] bg-slate-50 hover:bg-white hover:shadow-xl transition-all group"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-sm", f.bg, f.color)}>
                  <f.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 px-6 bg-slate-900 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-brand/10 blur-[120px] -z-0" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div>
              <div className="text-6xl font-black brand-text-gradient mb-2">99%</div>
              <div className="text-slate-400 font-medium uppercase tracking-widest text-xs">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-6xl font-black brand-text-gradient mb-2">2M+</div>
              <div className="text-slate-400 font-medium uppercase tracking-widest text-xs">Users Worldwide</div>
            </div>
            <div>
              <div className="text-6xl font-black brand-text-gradient mb-2">50+</div>
              <div className="text-slate-400 font-medium uppercase tracking-widest text-xs">AI Models</div>
            </div>
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
