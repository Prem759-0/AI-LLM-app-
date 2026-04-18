/// <reference types="vite/client" />
import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { ClerkProvider, SignIn, SignUp, SignedIn, SignedOut, useUser, useAuth as useClerkAuth, AuthenticateWithRedirectCallback } from "@clerk/clerk-react";
import AuthPage from "./components/AuthPage.tsx";
import LandingPage from "./components/LandingPage.tsx";
import ChatInterface from "./components/ChatInterface.tsx";
import ImageGen from "./components/ImageGen.tsx";
import Sidebar from "./components/Sidebar.tsx";
import Explore from "./components/Explore.tsx";
import Library from "./components/Library.tsx";
import Files from "./components/Files.tsx";
import History from "./components/History.tsx";
import Profile from "./components/Profile.tsx";
import SettingsPage from "./components/Settings.tsx";
import Billing from "./components/Billing.tsx";
import api, { setAuthToken } from "./lib/api.ts";
import { cn } from "./lib/utils.ts";
import { Settings } from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string;
  isPro: boolean;
  usage: any;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
  loading: boolean;
}

interface ThemeContextType {
  theme: string;
  setTheme: (theme: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);
const ThemeContext = createContext<ThemeContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut, getToken } = useClerkAuth();
  const [userData, setUserData] = useState<{ isPro: boolean; usage: any } | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const syncToken = async () => {
    try {
      if (clerkUser) {
        const token = await getToken();
        setAuthToken(token);
        if (token) localStorage.setItem("token", token);
        // Fetch additional user data from our backend
        const res = await api.get('billing/status').catch(e => {
          console.error("Billing status fetch failed", e);
          return { data: { isPro: false, usage: { messages: 0, images: 0 } } };
        });
        setUserData(res.data);
      } else {
        setAuthToken(null);
        localStorage.removeItem("token");
        setUserData(null);
      }
    } catch (err) {
      console.error("Clerk Token Sync Error:", err);
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    syncToken();
  }, [clerkUser, getToken]);

  const user = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || "",
    name: clerkUser.fullName || clerkUser.username || "User",
    isPro: userData?.isPro || false,
    usage: userData?.usage
  } : null;

  const logout = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Clerk Signout Error:", err);
      // Fallback for failed remote signout
      setAuthToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login: () => {}, updateUser: () => {}, logout, loading: !isLoaded }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#f8f7ff]">
      <div className="w-10 h-10 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
};

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  if (!PUBLISHABLE_KEY) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 p-8 text-center">
        <div className="w-16 h-16 bg-brand/10 text-brand rounded-2xl flex items-center justify-center mb-6">
          <Settings size={32} className="animate-spin-slow" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 mb-2">Configure Clerk Authentication</h1>
        <p className="text-slate-500 max-w-md mb-8">
          To start using Neural Genesis, please add your <b>VITE_CLERK_PUBLISHABLE_KEY</b> and <b>CLERK_SECRET_KEY</b> in the AI Studio Settings menu.
        </p>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-left w-full max-w-md">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Setup Instructions</h2>
          <ol className="text-sm text-slate-600 space-y-3 font-medium">
            <li>1. Visit <a href="https://dashboard.clerk.com" target="_blank" className="text-brand hover:underline font-bold">dashboard.clerk.com</a></li>
            <li>2. Copy your <b>API Keys</b></li>
            <li>3. Paste them into the <b>Settings icon</b> on the right side of AI Studio</li>
            <li>4. Restart the preview</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <ClerkProviderWithNavigation>
        <AuthProvider>
          <ThemeContext.Provider value={{ theme, setTheme }}>
            <div className={cn(
              "min-h-screen w-full transition-colors duration-500", 
              theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
                ? "bg-slate-950" 
                : "bg-[#f8f7ff]"
            )}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth/*" element={<AuthPage />} />
                <Route path="/sso-callback" element={<AuthenticateWithRedirectCallback />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <div className="flex h-screen w-full overflow-hidden">
                        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                        <main className="flex-1 relative overflow-hidden">
                          <Routes>
                            <Route path="/chat" element={<ChatInterface isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />} />
                            <Route path="/chat/:id" element={<ChatInterface isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />} />
                            <Route path="/image" element={<ImageGen />} />
                            <Route path="/explore" element={<Explore />} />
                            <Route path="/library" element={<Library />} />
                            <Route path="/files" element={<Files />} />
                            <Route path="/history" element={<History />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/settings" element={<SettingsPage />} />
                            <Route path="/billing" element={<Billing />} />
                          </Routes>
                        </main>
                      </div>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
            <Toaster position="top-right" richColors theme={theme === 'dark' ? 'dark' : 'light'} />
          </ThemeContext.Provider>
        </AuthProvider>
      </ClerkProviderWithNavigation>
    </Router>
  );
}

function ClerkProviderWithNavigation({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY}
      key={PUBLISHABLE_KEY || 'no-key'}
      routerPush={(to) => navigate(to)}
      routerReplace={(to) => navigate(to, { replace: true })}
      // In this specialized environment, forcing the ClerkJS version helps ensure iframe compatibility
      clerkJSUrl="https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js"
      appearance={{
        layout: {
          socialButtonsVariant: "iconButton",
          socialButtonsPlacement: "bottom",
          showOptionalFields: true,
        }
      }}
    >
      {children}
    </ClerkProvider>
  );
}
