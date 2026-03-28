"use client";
/**
 * context/AuthContext.tsx
 * Stores the logged-in user in React context.
 * Reads token from localStorage on mount.
 */
import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, type AuthPayload } from "@/lib/api";

interface User {
  id: string;
  email: string;
  full_name?: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (data: AuthPayload) => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
  isAdmin: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]     = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Re-hydrate from localStorage token on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { setLoading(false); return; }
    api.auth.me()
      .then((u) => setUser(u))
      .catch(() => localStorage.removeItem("access_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((data: AuthPayload) => {
    localStorage.setItem("access_token", data.access_token);
    setUser({
      id: data.user_id,
      email: data.email,
      full_name: data.full_name,
      role: data.role,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
