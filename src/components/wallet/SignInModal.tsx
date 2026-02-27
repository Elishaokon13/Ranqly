"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "@/components/ui";
import { cn } from "@/lib/utils";

// Simple brand icons (inline SVG)
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5", className)} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

type AuthMode = "signin" | "signup";
type Step = "choose" | "email" | "email-sent" | "connecting" | "success" | "error" | "rejected";

interface WalletOption {
  id: string;
  name: string;
  icon: string;
}

const wallets: WalletOption[] = [
  { id: "metamask", name: "MetaMask", icon: "🦊" },
  { id: "rainbow", name: "Rainbow", icon: "🌈" },
  { id: "coinbase", name: "Coinbase Wallet", icon: "🔵" },
  { id: "walletconnect", name: "WalletConnect", icon: "🔗" },
];

export interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (method: "social" | "email" | "wallet", id?: string, email?: string) => void;
}

export function SignInModal({ open, onOpenChange, onSuccess }: SignInModalProps) {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setStep("choose");
        setEmail("");
        setEmailError("");
        setSelectedWallet(null);
      }
      onOpenChange(isOpen);
    },
    [onOpenChange]
  );

  const handleSocial = useCallback(
    (provider: "google" | "x") => {
      setStep("connecting");
      setTimeout(() => {
        setStep("success");
        onSuccess?.("social");
        setTimeout(() => handleClose(false), 1500);
      }, 1500);
    },
    [onSuccess, handleClose]
  );

  const handleEmailSubmit = useCallback(() => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Please enter your email");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setEmailError("Please enter a valid email");
      return;
    }
    setEmailError("");
    setStep("email-sent");
    setTimeout(() => {
      setStep("success");
      onSuccess?.("email", undefined, trimmed);
      setTimeout(() => handleClose(false), 1500);
    }, 2000);
  }, [email, onSuccess, handleClose]);

  const handleWalletSelect = useCallback(
    async (walletId: string) => {
      setSelectedWallet(walletId);
      setStep("connecting");
      await new Promise((r) => setTimeout(r, 2000));
      const rand = Math.random();
      if (rand > 0.9) {
        setStep("error");
      } else if (rand > 0.8) {
        setStep("rejected");
      } else {
        setStep("success");
        onSuccess?.("wallet", walletId);
        setTimeout(() => handleClose(false), 1500);
      }
    },
    [onSuccess, handleClose]
  );

  const tryAgain = useCallback(() => {
    setStep("choose");
    setSelectedWallet(null);
  }, []);

  const isSignIn = mode === "signin";
  const title = isSignIn ? "Log in to Ranqly" : "Create your Ranqly account";
  const disclaimer = "By continuing, you agree to our Terms of Service and Privacy Policy.";

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <AnimatePresence mode="wait">
        {step === "choose" && (
          <motion.div
            key="choose"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ModalHeader>
              <ModalTitle>{title}</ModalTitle>
              <ModalDescription className="mt-1 text-xs text-text-tertiary">
                {disclaimer}{" "}
                <Link href="/terms" className="text-primary-400 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-primary-400 hover:underline">
                  Privacy Policy
                </Link>
                .
              </ModalDescription>
            </ModalHeader>
            <ModalBody className="space-y-3">
              {/* Social */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSocial("google")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border border-border-subtle",
                    "bg-bg-tertiary px-4 py-3 text-sm font-medium text-text-primary",
                    "transition-all hover:border-primary-500 hover:bg-bg-elevated"
                  )}
                >
                  <GoogleIcon />
                  Google
                </button>
                <button
                  type="button"
                  onClick={() => handleSocial("x")}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl border border-border-subtle",
                    "bg-bg-tertiary px-4 py-3 text-sm font-medium text-text-primary",
                    "transition-all hover:border-primary-500 hover:bg-bg-elevated"
                  )}
                >
                  <XIcon />
                  X
                </button>
              </div>

              {/* Email */}
              <button
                type="button"
                onClick={() => setStep("email")}
                className={cn(
                  "flex w-full items-center justify-center gap-2 rounded-xl border border-border-subtle",
                  "bg-bg-tertiary px-4 py-3 text-sm font-medium text-text-primary",
                  "transition-all hover:border-primary-500 hover:bg-bg-elevated"
                )}
              >
                <Mail className="h-5 w-5" />
                Continue with email
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1 bg-border-subtle" />
                <span className="text-xs text-text-tertiary">Or</span>
                <div className="h-px flex-1 bg-border-subtle" />
              </div>

              {/* Wallets */}
              <div className="space-y-2">
                {wallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    type="button"
                    onClick={() => handleWalletSelect(wallet.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border border-border-subtle",
                      "bg-bg-tertiary px-4 py-3 text-left text-sm font-medium text-text-primary",
                      "transition-all hover:border-primary-500 hover:bg-bg-elevated"
                    )}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-elevated text-lg">
                      {wallet.icon}
                    </span>
                    {wallet.name}
                  </button>
                ))}
              </div>
            </ModalBody>
            <ModalFooter className="flex-col items-stretch gap-3 border-t border-border-subtle pt-4">
              <p className="text-center text-sm text-text-secondary">
                {isSignIn ? (
                  <>
                    Don&apos;t have a Ranqly account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signup")}
                      className="font-semibold text-primary-400 hover:underline"
                    >
                      Sign up
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("signin")}
                      className="font-semibold text-primary-400 hover:underline"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </ModalFooter>
          </motion.div>
        )}

        {step === "email" && (
          <motion.div
            key="email"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
          >
            <ModalHeader>
              <button
                type="button"
                onClick={() => setStep("choose")}
                className="mb-2 flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary"
                aria-label="Back"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <ModalTitle>Continue with email</ModalTitle>
              <ModalDescription>
                Enter your email and we&apos;ll send you a sign-in link.
              </ModalDescription>
            </ModalHeader>
            <ModalBody>
              <Input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                error={emailError}
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleEmailSubmit()}
              />
            </ModalBody>
            <ModalFooter>
              <Button variant="primary" className="w-full" onClick={handleEmailSubmit}>
                Continue
              </Button>
            </ModalFooter>
          </motion.div>
        )}

        {step === "email-sent" && (
          <motion.div
            key="email-sent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-6 text-center"
          >
            <Mail className="h-12 w-12 text-primary-500" />
            <div>
              <p className="text-lg font-semibold text-text-primary">Check your inbox</p>
              <p className="mt-1 text-sm text-text-secondary">
                We sent a sign-in link to <span className="font-medium text-text-primary">{email}</span>
              </p>
            </div>
          </motion.div>
        )}

        {step === "connecting" && (
          <motion.div
            key="connecting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-8 text-center"
          >
            <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
            <div>
              <p className="text-lg font-semibold text-text-primary">
                {selectedWallet
                  ? `Connecting to ${wallets.find((w) => w.id === selectedWallet)?.name}...`
                  : "Connecting..."}
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Approve the request in your wallet or browser
              </p>
            </div>
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-8 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <CheckCircle2 className="h-12 w-12 text-success" />
            </motion.div>
            <div>
              <p className="text-lg font-semibold text-text-primary">You&apos;re in</p>
              <p className="mt-1 text-sm text-text-secondary">Welcome to Ranqly</p>
            </div>
          </motion.div>
        )}

        {step === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-8 text-center"
          >
            <AlertCircle className="h-12 w-12 text-error" />
            <div>
              <p className="text-lg font-semibold text-text-primary">Something went wrong</p>
              <p className="mt-1 text-sm text-text-secondary">Please try again.</p>
            </div>
            <Button variant="secondary" onClick={tryAgain}>
              Try again
            </Button>
          </motion.div>
        )}

        {step === "rejected" && (
          <motion.div
            key="rejected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-4 py-8 text-center"
          >
            <XCircle className="h-12 w-12 text-warning" />
            <div>
              <p className="text-lg font-semibold text-text-primary">Request cancelled</p>
              <p className="mt-1 text-sm text-text-secondary">
                You cancelled the connection. Try again when you&apos;re ready.
              </p>
            </div>
            <Button variant="secondary" onClick={tryAgain}>
              Try again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
