"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppKit } from "@reown/appkit/react";
import { Icon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { SignInModal } from "@/components/wallet";
import { RanqlyLogo } from "./RanqlyLogo";
import { isApiConfigured } from "@/lib/api";

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
  const { open: openAppKit, disconnect } = useAppKit();
  const useWalletAuth = isApiConfigured();

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border-subtle bg-bg-primary/80 backdrop-blur-xl">
        <nav
          className="mx-auto flex h-(--navbar-height) max-w-site items-center justify-between px-4 sm:px-6 lg:px-8"
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
                  <Icon name="user" size="lg" className="text-current" />
                </Link>
                <button
                  onClick={() => {
                    if (user?.method === "wallet") disconnect?.();
                    signOut();
                  }}
                  className={cn(
                    "inline-flex h-(--button-height-md) items-center gap-2 rounded-xl",
                    "border border-border-subtle bg-transparent px-5 text-sm font-medium text-text-secondary",
                    "hover:bg-bg-tertiary hover:text-text-primary transition-colors"
                  )}
                >
                  <Icon name="log-out" size="sm" className="text-current" />
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => (useWalletAuth ? openAppKit() : setSignInModalOpen(true))}
                className={cn(
                  "inline-flex h-(--button-height-md) items-center gap-2 rounded-xl",
                  "bg-primary-500 px-5 text-sm font-semibold text-white",
                  "transition-all hover:bg-primary-600 hover:shadow-glow-primary",
                  "active:scale-[0.98]"
                )}
              >
                <Icon name="log-in" size="sm" className="text-current" />
                {useWalletAuth ? "Connect wallet" : "Sign in"}
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
              <Icon name="close" size="sm" className="text-current" />
            ) : (
              <Icon name="menu" size="sm" className="text-current" />
            )}
          </button>
        </nav>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-border-subtle bg-bg-secondary md:hidden">
            <div className="mx-auto max-w-site px-4 py-4 sm:px-6">
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
                      if (user?.method === "wallet") disconnect?.();
                      signOut();
                    }}
                    className={cn(
                      "inline-flex h-(--button-height-md) w-full items-center justify-center gap-2 rounded-xl",
                      "border border-border-subtle bg-transparent px-5 text-sm font-medium text-text-secondary"
                    )}
                  >
                    <Icon name="log-out" size="sm" className="text-current" />
                    Sign out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      useWalletAuth ? openAppKit() : setSignInModalOpen(true);
                    }}
                    className={cn(
                      "inline-flex h-(--button-height-md) w-full items-center justify-center gap-2 rounded-xl",
                      "bg-primary-500 px-5 text-sm font-semibold text-white",
                      "transition-all hover:bg-primary-600"
                    )}
                  >
                    <Icon name="log-in" size="sm" className="text-current" />
                    {useWalletAuth ? "Connect wallet" : "Sign in"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {!useWalletAuth && (
        <SignInModal
          open={signInModalOpen}
          onOpenChange={setSignInModalOpen}
          onSuccess={(method, id, email) => {
            signIn(method, id, email);
          }}
        />
      )}
    </>
  );
}
