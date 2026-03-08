"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  PenTool,
  Building2,
  Compass,
  Twitter,
  Github,
  BookOpen,
  Coins,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button, Badge, Separator } from "@/components/ui";
import { cn } from "@/lib/utils";

type UserPath = "creator" | "organizer" | "exploring" | null;

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const TOTAL_STEPS = 4;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            i <= current
              ? "w-6 bg-primary-500"
              : "w-2 bg-border-medium"
          )}
        />
      ))}
    </div>
  );
}

export function OnboardingModal({
  open,
  onOpenChange,
  onComplete,
}: OnboardingModalProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selectedPath, setSelectedPath] = useState<UserPath>(null);
  const [connectedSocials, setConnectedSocials] = useState<string[]>([]);

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleComplete = () => {
    onComplete?.();
    onOpenChange(false);
    // Reset for next time
    setTimeout(() => {
      setStep(0);
      setSelectedPath(null);
      setConnectedSocials([]);
    }, 300);
  };

  const toggleSocial = (social: string) => {
    setConnectedSocials((prev) =>
      prev.includes(social) ? prev.filter((s) => s !== social) : [...prev, social]
    );
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-full max-w-[500px] -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-border-subtle bg-bg-secondary shadow-xl",
            "data-[state=open]:animate-scale-in",
            "focus:outline-none",
            "overflow-hidden"
          )}
        >
          {/* Progress */}
          <div className="px-6 pt-6">
            <StepDots current={step} total={TOTAL_STEPS} />
          </div>

          {/* Step Content */}
          <div className="relative min-h-[320px] px-6 py-6">
            <AnimatePresence mode="wait" custom={direction}>
              {step === 0 && (
                <motion.div
                  key="step-0"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500/15">
                    <Sparkles className="h-8 w-8 text-primary-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-text-primary font-display">
                    Welcome to Ranqly!
                  </h2>
                  <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-secondary">
                    You&apos;re about to join the fairest content platform in Web3.
                    Let&apos;s get you started in just a few steps.
                  </p>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step-1"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-xl font-bold text-text-primary font-display text-center mb-2">
                    What brings you to Ranqly?
                  </h2>
                  <p className="text-sm text-text-secondary text-center mb-6">
                    This helps us personalize your experience.
                  </p>
                  <div className="space-y-2">
                    {[
                      {
                        id: "creator" as const,
                        icon: PenTool,
                        title: "I'm a Creator",
                        desc: "Earn through contests by submitting great content",
                      },
                      {
                        id: "organizer" as const,
                        icon: Building2,
                        title: "I'm an Organizer",
                        desc: "Launch contests to discover great content",
                      },
                      {
                        id: "exploring" as const,
                        icon: Compass,
                        title: "Just exploring",
                        desc: "Looking around to learn more about Ranqly",
                      },
                    ].map((option) => (
                      <button
                        key={option.id}
                        onClick={() => setSelectedPath(option.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
                          selectedPath === option.id
                            ? "border-primary-500 bg-primary-500/10"
                            : "border-border-subtle bg-bg-tertiary hover:border-border-medium"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                            selectedPath === option.id
                              ? "bg-primary-500 text-white"
                              : "bg-bg-elevated text-text-tertiary"
                          )}
                        >
                          <option.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            {option.title}
                          </p>
                          <p className="text-xs text-text-tertiary">
                            {option.desc}
                          </p>
                        </div>
                        {selectedPath === option.id && (
                          <Check className="ml-auto h-4 w-4 text-primary-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step-2"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="text-xl font-bold text-text-primary font-display text-center mb-2">
                    Connect Social Accounts
                  </h2>
                  <p className="text-sm text-text-secondary text-center mb-6">
                    Link your accounts to build your creator profile.
                  </p>
                  <div className="space-y-2">
                    {[
                      { id: "twitter", icon: Twitter, name: "Twitter", label: "optional" },
                      { id: "github", icon: Github, name: "GitHub", label: "optional" },
                      { id: "medium", icon: BookOpen, name: "Medium", label: "optional" },
                    ].map((social) => {
                      const isConnected = connectedSocials.includes(social.id);
                      return (
                        <button
                          key={social.id}
                          onClick={() => toggleSocial(social.id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl border px-4 py-3.5 transition-all",
                            isConnected
                              ? "border-success/30 bg-success/5"
                              : "border-border-subtle bg-bg-tertiary hover:border-border-medium"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <social.icon
                              className={cn(
                                "h-5 w-5",
                                isConnected ? "text-success" : "text-text-tertiary"
                              )}
                            />
                            <div className="text-left">
                              <p className="text-sm font-medium text-text-primary">
                                {isConnected ? `Connected` : `Connect ${social.name}`}
                              </p>
                              <p className="text-xs text-text-disabled">
                                {social.label}
                              </p>
                            </div>
                          </div>
                          {isConnected ? (
                            <Check className="h-4 w-4 text-success" />
                          ) : (
                            <ArrowRight className="h-4 w-4 text-text-disabled" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-4 text-center text-xs text-text-disabled">
                    This helps us build your creator profile and reputation.
                  </p>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step-3"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-500/15">
                    <Coins className="h-8 w-8 text-accent-400" />
                  </div>
                  <h2 className="text-xl font-bold text-text-primary font-display">
                    Get Your Voting NFT
                  </h2>
                  <p className="mt-2 max-w-sm text-sm text-text-secondary">
                    Want to vote in contests? Mint your Proof-of-Impact NFT for
                    just <span className="font-semibold text-text-primary">$0.70</span>.
                  </p>

                  <div className="mt-5 w-full rounded-xl border border-border-subtle bg-bg-tertiary p-4">
                    <ul className="space-y-2 text-left text-sm text-text-secondary">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success" />
                        Vote in unlimited contests
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success" />
                        Earn rewards for good judging
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success" />
                        One wallet = One vote (prevents sybils)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-success" />
                        Soulbound (non-transferable)
                      </li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Navigation */}
          <div className="flex items-center justify-between border-t border-border-subtle px-6 py-4">
            {step > 0 ? (
              <Button variant="ghost" size="sm" onClick={goBack}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS - 1 ? (
              <div className="flex gap-2">
                {step === 2 && (
                  <Button variant="ghost" size="sm" onClick={goNext}>
                    Skip
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={goNext}
                  disabled={step === 1 && !selectedPath}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleComplete}>
                  Maybe Later
                </Button>
                <Button variant="success" size="sm" onClick={handleComplete}>
                  <Coins className="h-4 w-4" />
                  Mint Now
                </Button>
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
