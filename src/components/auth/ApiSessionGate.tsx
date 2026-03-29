"use client";

import { type ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAuthMe, getAuthToken, setAuthToken, isApiConfigured } from "@/lib/api";

interface ApiSessionGateProps {
  children: ReactNode;
}

function redirectToSignIn(router: ReturnType<typeof useRouter>, pathname: string | null) {
  const p = pathname || "/settings";
  router.replace(`/signin?redirect=${encodeURIComponent(p)}`);
}

/**
 * Validates JWT against GET /api/auth/me before rendering children.
 * Redirects to sign-in if the token is missing or rejected (stale session).
 */
export function ApiSessionGate({ children }: ApiSessionGateProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setReady(false);
      return;
    }
    let cancelled = false;
    setReady(false);
    void (async () => {
      if (!isApiConfigured()) {
        if (!cancelled) setReady(true);
        return;
      }
      const token = getAuthToken();
      if (!token) {
        signOut();
        redirectToSignIn(router, pathname);
        return;
      }
      const me = await fetchAuthMe();
      if (cancelled) return;
      if (!me) {
        setAuthToken(null);
        signOut();
        redirectToSignIn(router, pathname);
        return;
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, signOut, router, pathname]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState !== "visible" || !user?.id) return;
      void (async () => {
        if (!isApiConfigured()) return;
        const token = getAuthToken();
        if (!token) return;
        const me = await fetchAuthMe();
        if (!me) {
          setAuthToken(null);
          signOut();
          redirectToSignIn(router, pathname);
        }
      })();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [user?.id, signOut, router, pathname]);

  if (!user?.id || !ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
