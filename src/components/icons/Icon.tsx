"use client";

import React from "react";
import { iconPaths } from "./iconPaths";
import { cn } from "@/lib/utils";

export type IconName = keyof typeof iconPaths;

export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

const iconSizeMap: Record<IconSize, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
  "2xl": 64,
};

/** Ranqly custom icon — stroke 2px, round cap/join, currentColor. Spec §3. */
export const Icon: React.FC<{
  name: IconName;
  size?: IconSize;
  className?: string;
  strokeWidth?: number;
}> = ({ name, size = "md", className, strokeWidth }) => {
  const sizePx = iconSizeMap[size];
  const paths = iconPaths[name];
  if (!paths) return null;
  const pathArray = Array.isArray(paths) ? paths : [paths];
  const stroke = strokeWidth ?? (size === "xs" || size === "sm" ? 1.5 : 2);

  return (
    <svg
      width={sizePx}
      height={sizePx}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      {pathArray.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
};

export default Icon;
