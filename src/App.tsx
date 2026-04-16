import React, { createContext, useContext, useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import AuthPage from "./components/AuthPage.tsx";
import LandingPage from "./components/LandingPage.tsx";
import ChatInterface from "./components/ChatInterface.tsx";
import ImageGen from "./components/ImageGen.tsx";
import Sidebar from "./components/Sidebar.tsx";
import Explore from "./components/Explore.tsx";
import Library from "./components/Library.tsx";
import Files from "./components/Files.tsx";
import History from "./components/History.tsx";
import api from "./lib/api.ts";

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error("Failed to parse user from localStorage", e);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  const login = (token: string, user: User) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
};

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen w-full bg-[#f8f7ff]">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="flex h-screen w-full overflow-hidden">
                    <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
                    <main className="flex-1 relative overflow-hidden">
                      <Routes>
                        <Route path="/chat" element={<ChatInterface setIsSidebarOpen={setIsSidebarOpen} />} />
                        <Route path="/chat/:id" element={<ChatInterface setIsSidebarOpen={setIsSidebarOpen} />} />
                        <Route path="/image" element={<ImageGen />} />
                        <Route path="/explore" element={<Explore />} />
                        <Route path="/library" element={<Library />} />
                        <Route path="/files" element={<Files />} />
                        <Route path="/history" element={<History />} />
                      </Routes>
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
        <Toaster position="top-right" richColors />
      </Router>
    </AuthProvider>
  );
}
