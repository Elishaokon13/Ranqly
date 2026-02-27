"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import {
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalBody,
  ModalFooter,
  Button,
} from "@/components/ui";
import { cn } from "@/lib/utils";

type ConnectionState =
  | "idle"
  | "connecting"
  | "success"
  | "error"
  | "rejected";

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const wallets: WalletOption[] = [
  { id: "metamask", name: "MetaMask", icon: "🦊", color: "#E2761B" },
  { id: "rainbow", name: "Rainbow", icon: "🌈", color: "#001E59" },
  { id: "coinbase", name: "Coinbase Wallet", icon: "🔵", color: "#0052FF" },
  { id: "walletconnect", name: "WalletConnect", icon: "🔗", color: "#3B99FC" },
];

interface ConnectWalletModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnected?: (walletId: string) => void;
}

export function ConnectWalletModal({
  open,
  onOpenChange,
  onConnected,
}: ConnectWalletModalProps) {
  const [state, setState] = useState<ConnectionState>("idle");
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  const handleReset = useCallback(() => {
    setState("idle");
    setSelectedWallet(null);
  }, []);

  const handleClose = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) handleReset();
      onOpenChange(isOpen);
    },
    [onOpenChange, handleReset]
  );

  const handleSelectWallet = useCallback(
    async (walletId: string) => {
      setSelectedWallet(walletId);
      setState("connecting");

      // Simulate wallet connection
      await new Promise((r) => setTimeout(r, 2000));

      // Simulate random outcome (mostly success)
      const rand = Math.random();
      if (rand > 0.85) {
        setState("rejected");
      } else if (rand > 0.95) {
        setState("error");
      } else {
        setState("success");
        onConnected?.(walletId);
        // Auto-close after success
        setTimeout(() => handleClose(false), 1500);
      }
    },
    [onConnected, handleClose]
  );

  return (
    <Modal open={open} onOpenChange={handleClose}>
      <AnimatePresence mode="wait">
        {state === "idle" && (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ModalHeader>
              <ModalTitle>Connect Your Wallet</ModalTitle>
              <ModalDescription>
                Choose your preferred wallet
              </ModalDescription>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-2">
                {wallets.map((wallet) => (
                  <button
                    key={wallet.id}
                    onClick={() => handleSelectWallet(wallet.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border border-border-subtle",
                      "bg-bg-tertiary px-4 py-3 text-left",
                      "transition-all duration-150",
                      "hover:-translate-y-0.5 hover:border-primary-500 hover:shadow-md",
                      "active:translate-y-0 active:shadow-sm"
                    )}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-bg-elevated text-lg">
                      {wallet.icon}
                    </span>
                    <span className="text-sm font-medium text-text-primary">
                      {wallet.name}
                    </span>
                  </button>
                ))}
              </div>
            </ModalBody>
            <ModalFooter className="justify-center">
              <p className="text-xs text-text-tertiary">
                New to crypto?{" "}
                <a
                  href="https://ethereum.org/wallets"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:underline"
                >
                  Learn More
                  <ExternalLink className="ml-0.5 inline h-3 w-3" />
                </a>
              </p>
            </ModalFooter>
          </motion.div>
        )}

        {state === "connecting" && (
          <motion.div
            key="connecting"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-4 py-8 text-center"
          >
            <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
            <div>
              <p className="text-lg font-semibold text-text-primary">
                Connecting to{" "}
                {wallets.find((w) => w.id === selectedWallet)?.name}...
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Check your wallet popup to approve the connection
              </p>
            </div>
          </motion.div>
        )}

        {state === "success" && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
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
              <p className="text-lg font-semibold text-text-primary">
                Connected!
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Your wallet is now connected to Ranqly
              </p>
              <p className="mt-2 font-mono text-xs text-text-tertiary">
                0x1234...5678
              </p>
            </div>
          </motion.div>
        )}

        {state === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-4 py-8 text-center"
          >
            <AlertCircle className="h-12 w-12 text-error" />
            <div>
              <p className="text-lg font-semibold text-text-primary">
                Connection Failed
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Something went wrong. Please try again.
              </p>
            </div>
            <Button variant="secondary" onClick={handleReset}>
              Try Again
            </Button>
          </motion.div>
        )}

        {state === "rejected" && (
          <motion.div
            key="rejected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center gap-4 py-8 text-center"
          >
            <XCircle className="h-12 w-12 text-warning" />
            <div>
              <p className="text-lg font-semibold text-text-primary">
                Request Rejected
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                You cancelled the connection in your wallet.
              </p>
            </div>
            <Button variant="secondary" onClick={handleReset}>
              Try Again
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}
