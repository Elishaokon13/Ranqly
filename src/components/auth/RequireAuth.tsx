"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui";
import { LogIn, Lock } from "lucide-react";

interface RequireAuthProps {
  children: React.ReactNode;
  /** Optional message for the sign-in prompt */
  message?: string;
}

/**
 * Renders children only when the user is signed in.
 * Otherwise shows a sign-in prompt with links to /signin and /signup.
 */
export function RequireAuth({ children, message }: RequireAuthProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="flex flex-col items-center rounded-2xl border border-border-subtle bg-bg-secondary p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-tertiary">
            <Lock className="h-7 w-7 text-text-tertiary" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold text-text-primary">
            Sign in required
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {message ?? "You need to sign in to do this. Create an account or sign in to continue."}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/signin" className="inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" />
                Sign in
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/signup">Create account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
