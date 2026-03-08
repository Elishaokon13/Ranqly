"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, LogIn, LogOut, CircleUser } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { SignInModal } from "@/components/wallet";
import { RanqlyLogo } from "./RanqlyLogo";

const navLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/how-it-works", label: "How It Works" },
];

const mobileMenuLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/settings", label: "Settings" },
  { href: "/help", label: "Help" },
];

const signedInMobileLinks = [
  { href: "/dashboard", label: "Dashboard" },
  ...mobileMenuLinks,
];

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const { user, signIn, signOut } = useAuth();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-bg-primary/80 backdrop-blur-xl">
        <nav
          className="mx-auto flex h-(--navbar-height) max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
          aria-label="Main navigation"
        >
          {/* Logo */}
          <RanqlyLogo href="/" size="md" className="text-text-primary" />

          {/* Desktop Nav Links */}
          <div className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium text-text-secondary",
                  "transition-colors hover:bg-bg-tertiary hover:text-text-primary",
                  "focus-visible:outline-2 focus-visible:outline-primary-500"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop Right Side */}
          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    "flex h-(--button-height-md) w-(--button-height-md) items-center justify-center rounded-full",
                    "text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary",
                    "focus-visible:outline-2 focus-visible:outline-primary-500"
                  )}
                  aria-label="Dashboard / Profile"
                >
                  <CircleUser className="h-6 w-6" />
                </Link>
                <button
                  onClick={() => signOut()}
                  className={cn(
                    "inline-flex h-(--button-height-md) items-center gap-2 rounded-xl",
                    "border border-border-subtle bg-transparent px-5 text-sm font-medium text-text-secondary",
                    "hover:bg-bg-tertiary hover:text-text-primary transition-colors"
                  )}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => setSignInModalOpen(true)}
                className={cn(
                  "inline-flex h-(--button-height-md) items-center gap-2 rounded-xl",
                  "bg-primary-500 px-5 text-sm font-semibold text-white",
                  "transition-all hover:bg-primary-600 hover:shadow-glow-primary",
                  "active:scale-[0.98]"
                )}
              >
                <LogIn className="h-4 w-4" />
                Sign in
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border-subtle bg-bg-secondary md:hidden">
            <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-1">
                {(user ? signedInMobileLinks : mobileMenuLinks).map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-lg px-4 py-3 text-sm font-medium text-text-secondary",
                      "transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-4 border-t border-border-subtle pt-4">
                {user ? (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className={cn(
                      "inline-flex h-(--button-height-md) w-full items-center justify-center gap-2 rounded-xl",
                      "border border-border-subtle bg-transparent px-5 text-sm font-medium text-text-secondary"
                    )}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setSignInModalOpen(true);
                    }}
                    className={cn(
                      "inline-flex h-(--button-height-md) w-full items-center justify-center gap-2 rounded-xl",
                      "bg-primary-500 px-5 text-sm font-semibold text-white",
                      "transition-all hover:bg-primary-600"
                    )}
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <SignInModal
        open={signInModalOpen}
        onOpenChange={setSignInModalOpen}
        onSuccess={(method, id, email) => {
          signIn(method, id, email);
        }}
      />
    </>
  );
}
