// src/context/AuthContext.tsx
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { IUser } from "@/types/user";

interface AuthContextType {
  user: IUser | null;
  isAuthenticated: boolean;
  login: (token: string, userData: IUser) => void;
  logout: () => void;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<IUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const login = (token: string, userData: IUser) => {
    localStorage.setItem("token", token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  };

  return <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
