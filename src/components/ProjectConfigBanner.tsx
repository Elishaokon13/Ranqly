"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { isReownProjectConfigured } from "@/lib/site";

const DISMISS_KEY = "ranqly_dismiss_reown_banner";

export function ProjectConfigBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  const dismiss = useCallback(() => {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }, []);

  if (!mounted || dismissed || isReownProjectConfigured()) return null;

  return (
    <div
      role="status"
      className="relative z-[60] border-b border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100"
    >
      <p className="mx-auto max-w-3xl">
        Wallet connect needs a free{" "}
        <Link
          href="https://dashboard.reown.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-amber-200 underline underline-offset-2 hover:text-white"
        >
          Reown project ID
        </Link>
        . Add{" "}
        <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs text-amber-50">
          NEXT_PUBLIC_PROJECT_ID=…
        </code>{" "}
        to <code className="rounded bg-black/30 px-1.5 py-0.5 text-xs">.env.local</code> and restart the dev server.
        For a public tunnel URL, add that origin under your Reown project domains.
      </p>
      <button
        type="button"
        onClick={dismiss}
        className="mt-2 text-xs text-amber-200/80 underline hover:text-white"
      >
        Dismiss for this session
      </button>
    </div>
  );
}
