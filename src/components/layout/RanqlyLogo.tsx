"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

/** Ranqly logo: single transparent image (symbol + wordmark), sized so wordmark matches reference. */
export function RanqlyLogo({
  className,
  size = "md",
  href = "/",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
  href?: string;
}) {
  const height = size === "sm" ? 20 : size === "md" ? 28 : 36;
  const width = size === "sm" ? 80 : size === "md" ? 110 : 140;
  const content = (
    <span
      className="relative inline-block shrink-0"
      style={{ width, height }}
    >
      <Image
        src="/ranqly-logo-full.png"
        alt="Ranqly"
        fill
        className="object-contain object-left"
        sizes="(max-width: 768px) 120px, 160px"
        priority
      />
    </span>
  );

  const wrapperClass = cn(
    "inline-flex items-center",
    href && "transition-opacity hover:opacity-90",
    className
  );

  if (href) {
    return (
      <Link href={href} className={wrapperClass} aria-label="Ranqly home">
        {content}
      </Link>
    );
  }
  return <span className={wrapperClass}>{content}</span>;
}
