import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Sparkles, ShieldCheck, AtSign } from "lucide-react";
import { useSignIn, useSignUp } from "@clerk/clerk-react";
import { Button } from "./ui/button.tsx";
import { Input } from "./ui/input.tsx";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Verification state
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  
  const { isLoaded: isSignInLoaded, signIn, setActive: setSignInActive } = useSignIn();
  const { isLoaded: isSignUpLoaded, signUp, setActive: setSignUpActive } = useSignUp();
  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!isSignInLoaded) return;
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === "complete") {
        await setSignInActive({ session: result.createdSessionId });
        toast.success("Welcome back!");
        navigate("/");
      } else if (result.status === "needs_first_factor") {
        // Handle cases where email verification is required during sign in
        const emailFactor = result.supportedFirstFactors.find(
          (f: any) => f.strategy === "email_code"
        );
        
        if (emailFactor) {
          await signIn.prepareFirstFactor({
            strategy: "email_code",
            emailAddressId: (emailFactor as any).emailAddressId,
          });
          setVerifying(true);
          toast.info("Verification code sent to your email.");
        } else {
          toast.error("Please complete your sign-in on your dashboard or check your security settings.");
        }
      } else if (result.status === "needs_second_factor") {
        toast.info("Multi-factor authentication required. Please use the verification code sent to your second factor device.");
        // Note: Full MFA UI would require more fields, but we'll point the user to their security settings for now
        setVerifying(true);
      } else {
        console.log("Login result status:", result.status);
        toast.error(`Sign in requires additional steps: ${result.status}. Please check your email for any instructions.`);
      }
    } catch (err: any) {
      console.error(err);
      const firstError = err.errors?.[0];
      if (firstError?.code === "form_identifier_not_found" || firstError?.message?.includes("Couldn't find your account")) {
        toast.error("Account not found", {
          description: "Check your email address or click 'Create an account' below.",
          duration: 5000,
        });
      } else if (firstError?.code === "strategy_for_user_invalid") {
        toast.error("Verification method not supported for this account. Try another way.");
      } else {
        toast.error(firstError?.message || "Failed to sign in");
      }
    }
  };

  const handleSocialLogin = async (strategy: "oauth_google" | "oauth_github") => {
    if (!isSignInLoaded) return;
    try {
      setLoading(true);
      await signIn.authenticateWithRedirect({
        strategy,
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: "/",
      });
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to start social login.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!isSignUpLoaded) return;
    try {
      // 1. Create the sign up attempt
      const result = await signUp.create({
        emailAddress: email,
        password,
        username: username || email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 1000),
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
      });

      // 2. Check if we need to verify email
      if (result.status === "missing_requirements") {
        if (result.unverifiedFields.includes("email_address")) {
          await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
          setVerifying(true);
          toast.info("A 6-digit verification code was sent to your email.");
        } else {
          toast.error("Missing requirements: " + result.unverifiedFields.join(", "));
        }
      } else if (result.status === "complete") {
        await setSignUpActive({ session: result.createdSessionId });
        toast.success("Account created successfully!");
        navigate("/");
      }
    } catch (err: any) {
      console.error(err);
      const firstError = err.errors?.[0];
      if (firstError?.code === "form_identifier_exists" || firstError?.message?.includes("address is taken")) {
        toast.error("This email is already in use. Try signing in instead.");
        setIsLogin(true);
      } else {
        toast.error(firstError?.message || "Failed to create account");
      }
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        if (!isSignInLoaded) return;
        const result = await signIn.attemptFirstFactor({
          strategy: "email_code",
          code,
        });
        if (result.status === "complete") {
          await setSignInActive({ session: result.createdSessionId });
          toast.success("Identity verified! Welcome.");
          navigate("/");
        } else {
          toast.error("Verification incomplete. Status: " + result.status);
        }
      } else {
        if (!isSignUpLoaded) return;
        const result = await signUp.attemptEmailAddressVerification({
          code,
        });

        if (result.status === "complete") {
          await setSignUpActive({ session: result.createdSessionId });
          toast.success("Email verified! Account created.");
          navigate("/");
        } else {
          console.log("Verification result:", result);
          toast.error("Verification failed. Please try again.");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.errors?.[0]?.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isLogin) {
      await handleLogin();
    } else {
      await handleSignup();
    }
    setLoading(false);
  };

  const resendCode = async () => {
    try {
      if (isLogin) {
        if (!isSignInLoaded) return;
        const factor = signIn.supportedFirstFactors.find((f: any) => f.strategy === "email_code");
        if (factor) {
          await signIn.prepareFirstFactor({ strategy: "email_code", emailAddressId: (factor as any).emailAddressId });
          toast.success("A new code has been sent.");
        }
      } else {
        if (!isSignUpLoaded) return;
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        toast.success("A new code has been sent.");
      }
    } catch (err: any) {
      toast.error("Failed to resend code. Please try again later.");
    }
  };

  if (verifying) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-[#fcfcff] p-4 relative overflow-hidden">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md relative z-10 font-sans">
          <div className="glass p-8 md:p-10 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border-white/60 backdrop-blur-2xl">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck size={32} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Check your email</h1>
              <p className="text-slate-500 mt-2 font-medium text-center">We've sent a 6-digit code to <span className="text-slate-900 font-bold">{email}</span></p>
            </div>
            
            <form onSubmit={verifyCode} className="space-y-6">
              <div className="space-y-2">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="h-16 text-center text-xl sm:text-2xl tracking-[0.2em] sm:tracking-[0.5em] font-black rounded-2xl bg-white/50 border-slate-100 focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all max-w-full overflow-hidden"
                    required
                  />
                </div>
              </div>
              
              <Button disabled={loading} className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black transition-all shadow-lg">
                {loading ? "Verifying..." : "Verify Identity"}
              </Button>
            </form>

            <div className="mt-8 space-y-4">
              <button onClick={resendCode} className="w-full text-xs text-brand font-black uppercase tracking-widest hover:underline transition-all text-center">
                Didn't get the code? Resend
              </button>
              
              <button onClick={() => setVerifying(false)} className="w-full text-xs text-slate-400 font-black uppercase tracking-widest hover:text-slate-600 transition-colors text-center">
                Back to sign {isLogin ? "in" : "up"}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#fcfcff] p-4 relative overflow-hidden font-sans">
      {/* Container for Clerk bot protection (Turnstile) */}
      <div id="clerk-captcha" className="fixed bottom-0 left-0 w-0 h-0 overflow-hidden pointer-events-none opacity-0"></div>
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-brand/10 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, -45, 0],
            x: [0, -30, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[120px]" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass p-8 md:p-10 rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] border-white/60 backdrop-blur-2xl">
          <div className="flex flex-col items-center mb-10">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              className="w-20 h-20 bg-brand rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-brand/30 mb-6"
            >
              <Sparkles size={40} />
            </motion.div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Cortex AI</h1>
            <p className="text-slate-500 mt-3 font-bold text-center">
              {isLogin ? "Unlock the power of intelligence" : "Join the future of conversation"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-1.5"
              >
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={18} />
                  <Input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-white/50 border-slate-100 focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all font-bold text-slate-700"
                    required={!isLogin}
                  />
                </div>
              </motion.div>
            )}

            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-1.5"
              >
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Username</label>
                <div className="relative group">
                  <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={18} />
                  <Input
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-12 h-14 rounded-2xl bg-white/50 border-slate-100 focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all font-bold text-slate-700"
                    required={!isLogin}
                  />
                </div>
              </motion.div>
            )}
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={18} />
                <Input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-14 rounded-2xl bg-white/50 border-slate-100 focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all font-bold text-slate-700"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                {isLogin && (
                  <button type="button" className="text-[10px] font-black text-brand uppercase tracking-widest hover:underline">Forgot?</button>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand transition-colors" size={18} />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-14 rounded-2xl bg-white/50 border-slate-100 focus:ring-4 focus:ring-brand/10 focus:border-brand transition-all font-bold text-slate-700"
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black transition-all shadow-xl shadow-slate-900/10 group mt-4 overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand/0 via-white/10 to-brand/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {loading ? (
                <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="flex items-center justify-center gap-2 relative z-10">
                  {isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-8">
            <div className="relative mb-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100"></div>
              </div>
              <div className="relative flex justify-center text-[10px] font-black uppercase tracking-widest">
                <span className="bg-white/50 px-4 text-slate-400 backdrop-blur-sm">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={() => handleSocialLogin("oauth_google")}
                className="h-12 rounded-xl border-slate-100 font-bold text-slate-600 hover:bg-slate-50 transition-colors gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1c-2.97 0-5.46.98-7.28 2.66l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleSocialLogin("oauth_github")}
                className="h-12 rounded-xl border-slate-100 font-bold text-slate-600 hover:bg-slate-50 transition-colors gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                GitHub
              </Button>
            </div>
          </div>

          <div className="mt-10 text-center">
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setVerifying(false);
              }}
              className="text-xs text-slate-400 hover:text-brand transition-colors font-black uppercase tracking-widest"
            >
              {isLogin ? (
                <>New to Cortex? <span className="text-brand ml-1">Create an account</span></>
              ) : (
                <>Already have an account? <span className="text-brand ml-1">Sign in</span></>
              )}
            </button>
          </div>
        </div>
        
        <p className="text-center text-[10px] font-bold text-slate-400 mt-8 uppercase tracking-widest">
          By continuing, you agree to our <button className="hover:text-slate-600 underline">Terms</button> and <button className="hover:text-slate-600 underline">Privacy Policy</button>
        </p>
      </motion.div>
    </div>
  );
}