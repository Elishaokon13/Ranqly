"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Compass, LogIn, LayoutDashboard, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { setExploreTourDone, isExploreTourDone } from "@/lib/onboardingStorage";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const STEP_COUNT = 3;

export function ExploreOnboardingTour() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [desktopWide, setDesktopWide] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setDesktopWide(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    if (user) {
      setExploreTourDone();
      setActive(false);
      return;
    }
    if (!isExploreTourDone()) setActive(true);
  }, [mounted, user]);

  const finish = useCallback(() => {
    setExploreTourDone();
    setActive(false);
  }, []);

  if (!mounted || !active || user) return null;

  const titles = ["Explore without signing in", "Ready to participate?", "Your dashboard"];

  const overlay = (
    <AnimatePresence>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="explore-tour-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-100 flex items-end justify-center bg-black/55 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-[2px] sm:items-center sm:p-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ type: "spring", stiffness: 380, damping: 28 }}
          className="relative w-full max-w-md rounded-2xl border border-border-medium bg-bg-elevated p-5 shadow-xl"
        >
          <button
            type="button"
            onClick={finish}
            className="absolute right-3 top-3 rounded-lg p-1.5 text-text-tertiary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
            aria-label="Skip tour"
          >
            <X className="h-4 w-4" />
          </button>

          {step === 0 && (
            <div className="pr-8">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <Compass className="h-5 w-5" />
              </div>
              <h2 id="explore-tour-title" className="font-display text-lg font-semibold text-text-primary">
                {titles[0]}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Browse live contests and open any detail page. Connect or sign in when you want to submit an entry,
                vote, or save progress—no account required just to look around.
              </p>
            </div>
          )}

          {step === 1 && (
            <div className="pr-8">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <LogIn className="h-5 w-5" />
              </div>
              <h2 id="explore-tour-title" className="font-display text-lg font-semibold text-text-primary">
                {titles[1]}
              </h2>
              {desktopWide ? (
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  Use the <strong className="text-text-primary">Connect wallet</strong> or{" "}
                  <strong className="text-text-primary">Sign in</strong> button in the header when you are ready.
                </p>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  Tap the <strong className="text-text-primary">menu</strong> (top right), then choose{" "}
                  <strong className="text-text-primary">Connect wallet</strong> or{" "}
                  <strong className="text-text-primary">Sign in</strong>.
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="pr-8">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                <LayoutDashboard className="h-5 w-5" />
              </div>
              <h2 id="explore-tour-title" className="font-display text-lg font-semibold text-text-primary">
                {titles[2]}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                After you sign in, open <strong className="text-text-primary">Dashboard</strong> from the menu for
                submissions, judging assignments, and settings.
              </p>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t border-border-subtle pt-4">
            <button
              type="button"
              onClick={finish}
              className="text-sm font-medium text-text-tertiary underline-offset-2 hover:text-text-secondary hover:underline"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep((s) => s - 1)}>
                  Back
                </Button>
              )}
              {step < STEP_COUNT - 1 ? (
                <Button type="button" size="sm" onClick={() => setStep((s) => s + 1)}>
                  Next
                </Button>
              ) : (
                <Button type="button" size="sm" onClick={finish}>
                  Got it
                </Button>
              )}
            </div>
          </div>

          <div className="mt-3 flex justify-center gap-1.5">
            {Array.from({ length: STEP_COUNT }).map((_, i) => (
              <span
                key={i}
                className={cn("h-1.5 w-1.5 rounded-full transition-colors", i === step ? "bg-primary-500" : "bg-border-medium")}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(overlay, document.body);
}
