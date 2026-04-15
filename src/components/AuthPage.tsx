import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../App.tsx";
import api from "../lib/api.ts";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const endpoint = isLogin ? "/auth/login" : "/auth/signup";
    console.log(`Attempting ${isLogin ? 'Login' : 'Signup'} at ${endpoint}`);
    
    try {
      const res = await api.post(endpoint, { email, password, name });
      login(res.data.token, res.data.user);
      toast.success(isLogin ? "Welcome back!" : "Account created successfully!");
      navigate("/");
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || "Something went wrong";
      console.error("Auth Error:", errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center bg-[#f8f7ff] p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass p-8 rounded-[2.5rem] shadow-2xl border-white/50 relative z-10"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center text-white shadow-xl mb-4">
            <Sparkles size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Cortex AI</h1>
          <p className="text-slate-500 mt-2 font-medium">
            {isLogin ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="relative"
            >
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-brand"
                required={!isLogin}
              />
            </motion.div>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-brand"
              required
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-12 rounded-xl bg-white/50 border-slate-200 focus:ring-brand"
              required
            />
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition-all shadow-lg group"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="flex items-center gap-2">
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button 
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-slate-500 hover:text-brand transition-colors font-semibold underline underline-offset-4"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
