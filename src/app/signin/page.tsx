"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/auth/AuthForm";
import { RanqlyLogo } from "@/components/layout/RanqlyLogo";

function safeRedirect(path: string | null): string {
  if (!path || typeof path !== "string") return "/dashboard";
  if (!path.startsWith("/") || path.startsWith("//")) return "/dashboard";
  return path;
}

export default function SignInPage() {
  const { user, signIn, pathToDefaultRedirect } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"));

  useEffect(() => {
    if (user) {
      const target = redirect === "/dashboard" && user.path
        ? pathToDefaultRedirect(user.path)
        : redirect;
      router.replace(target);
    }
  }, [user, router, redirect, pathToDefaultRedirect]);

  const handleSuccess = (
    method: "social" | "email" | "wallet",
    id?: string,
    email?: string
  ) => {
    const newUser = signIn(method, id, email);
    const target = redirect === "/dashboard" && newUser?.path
      ? pathToDefaultRedirect(newUser.path)
      : redirect;
    router.push(target);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--navbar-height))] max-w-site flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/" className="mb-8">
        <RanqlyLogo size="md" className="text-text-primary" />
      </Link>
      <AuthForm mode="signin" onSuccess={handleSuccess} redirectTo={redirect !== "/dashboard" ? redirect : undefined} />
    </div>
  );
}
