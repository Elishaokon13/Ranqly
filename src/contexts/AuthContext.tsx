"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "ranqly_user";

export interface User {
  id: string;
  method: "social" | "email" | "wallet";
  email?: string;
  walletId?: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  signIn: (method: "social" | "email" | "wallet", id?: string, email?: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function saveUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(loadStoredUser());
    setIsLoading(false);
  }, []);

  const signIn = useCallback(
    (method: "social" | "email" | "wallet", id?: string, email?: string) => {
      const newUser: User = {
        id: id ?? `user-${method}-${Date.now()}`,
        method,
        ...(email && { email }),
        ...(method === "wallet" && id && { walletId: id }),
      };
      setUser(newUser);
      saveUser(newUser);
    },
    []
  );

  const signOut = useCallback(() => {
    setUser(null);
    saveUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
