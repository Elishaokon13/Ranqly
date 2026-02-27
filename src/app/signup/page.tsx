"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AuthForm } from "@/components/auth/AuthForm";
import { RanqlyLogo } from "@/components/layout/RanqlyLogo";

export default function SignUpPage() {
  const { user, signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) router.replace("/dashboard");
  }, [user, router]);

  const handleSuccess = (
    method: "social" | "email" | "wallet",
    id?: string,
    email?: string
  ) => {
    signIn(method, id, email);
    router.push("/dashboard");
  };

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--navbar-height))] max-w-7xl flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/" className="mb-8">
        <RanqlyLogo size="md" className="text-text-primary" />
      </Link>
      <AuthForm mode="signup" onSuccess={handleSuccess} />
    </div>
  );
}
