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

/** User path determines default landing after sign-in when no redirect param is present. */
export type UserPath = "creator" | "judge" | "organizer";

export interface User {
  id: string;
  method: "social" | "email" | "wallet";
  email?: string;
  walletId?: string;
  /** Display name from API (User.name). */
  name?: string;
  avatarUrl?: string;
  /** Account type / path: creator (submit & earn), judge (score entries), organizer (run contests). */
  path?: UserPath;
}

function pathToDefaultRedirect(path: UserPath): string {
  switch (path) {
    case "organizer":
      return "/dashboard/organizer";
    case "judge":
      return "/judge";
    default:
      return "/dashboard";
  }
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  /** Returns the user after sign-in (so callers can use user.path for redirect). */
  signIn: (method: "social" | "email" | "wallet", id?: string, email?: string, path?: UserPath) => User;
  signOut: () => void;
  /** Update the current user's path (creator / judge / organizer). Persisted. */
  updateUserPath: (path: UserPath) => void;
  /** Merge server user (wallet session) into local user after /api/auth/me. */
  mergeWalletProfileFromApi: (me: {
    id: string;
    walletAddress: string | null;
    email: string | null;
    name: string | null;
    avatarUrl: string | null;
  }) => void;
  /** Update name / email / avatar in local session after profile save. */
  updateUserProfile: (partial: Pick<User, "name" | "email" | "avatarUrl">) => void;
  /** Default redirect for a given path (e.g. organizer → /dashboard/organizer). */
  pathToDefaultRedirect: (path: UserPath) => string;
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
    (method: "social" | "email" | "wallet", id?: string, email?: string, path?: UserPath): User => {
      const newUser: User = {
        id: id ?? `user-${method}-${Date.now()}`,
        method,
        ...(email && { email }),
        ...(method === "wallet" && id && { walletId: id }),
        ...(path && { path }),
      };
      setUser(newUser);
      saveUser(newUser);
      return newUser;
    },
    []
  );

  const signOut = useCallback(() => {
    setUser(null);
    saveUser(null);
  }, []);

  const mergeWalletProfileFromApi = useCallback(
    (me: {
      id: string;
      walletAddress: string | null;
      email: string | null;
      name: string | null;
      avatarUrl: string | null;
    }) => {
      setUser((prev) => {
        if (prev && prev.method !== "wallet") return prev;
        const next: User = {
          id: me.id,
          method: "wallet",
          walletId: me.walletAddress ?? prev?.walletId,
          name: me.name ?? prev?.name,
          avatarUrl: me.avatarUrl ?? prev?.avatarUrl,
          ...(prev?.path ? { path: prev.path } : {}),
          ...(me.email != null && me.email !== "" ? { email: me.email } : prev?.email ? { email: prev.email } : {}),
        };
        saveUser(next);
        return next;
      });
    },
    []
  );

  const updateUserProfile = useCallback((partial: Pick<User, "name" | "email" | "avatarUrl">) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...partial };
      saveUser(next);
      return next;
    });
  }, []);

  const updateUserPath = useCallback((path: UserPath) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, path };
      saveUser(next);
      return next;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signOut,
        updateUserPath,
        mergeWalletProfileFromApi,
        updateUserProfile,
        pathToDefaultRedirect,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
