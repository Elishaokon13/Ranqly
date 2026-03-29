"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { isDashboardWelcomeDone, setDashboardWelcomeDone } from "@/lib/onboardingStorage";
import { Button } from "@/components/ui";

export function DashboardWelcomeBanner() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isDashboardWelcomeDone()) setVisible(true);
  }, [mounted]);

  const dismiss = () => {
    setDashboardWelcomeDone();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 overflow-hidden rounded-xl border border-primary-500/30 bg-primary-500/10"
        >
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-500/20 text-primary-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-text-primary">Welcome to your dashboard</p>
                <p className="mt-0.5 text-sm text-text-secondary">
                  Use the cards below to open submissions, judging, explore, leaderboard, and settings. Everything you
                  need after signing in lives here.
                </p>
              </div>
            </div>
            <Button type="button" size="sm" variant="secondary" className="shrink-0" onClick={dismiss}>
              Got it
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
