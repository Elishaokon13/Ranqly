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

export default function SignUpPage() {
  const { user, signIn } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"));

  const pathFromRedirect =
    redirect === "/dashboard/organizer"
      ? "organizer"
      : redirect === "/judge"
        ? "judge"
        : undefined;

  useEffect(() => {
    if (user) router.replace(redirect);
  }, [user, router, redirect]);

  const handleSuccess = (
    method: "social" | "email" | "wallet",
    id?: string,
    email?: string
  ) => {
    signIn(method, id, email, pathFromRedirect);
    router.push(redirect);
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--navbar-height))] max-w-site flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/" className="mb-8">
        <RanqlyLogo size="md" className="text-text-primary" />
      </Link>
      <AuthForm mode="signup" onSuccess={handleSuccess} redirectTo={redirect !== "/dashboard" ? redirect : undefined} />
    </div>
  );
}
