"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "success" | "warning" | "error";
  className?: string;
}

const barColors = {
  primary: "bg-primary-500",
  success: "bg-success",
  warning: "bg-warning",
  error: "bg-error",
};

const heights = {
  sm: "h-1.5",
  md: "h-2.5",
  lg: "h-4",
};

export function Progress({
  value,
  max = 100,
  label,
  showValue = false,
  size = "md",
  variant = "primary",
  className,
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn("w-full", className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between">
          {label && (
            <span className="text-xs font-medium text-text-secondary">
              {label}
            </span>
          )}
          {showValue && (
            <span className="text-xs font-medium text-text-tertiary">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <ProgressPrimitive.Root
        value={value}
        max={max}
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-bg-tertiary",
          heights[size]
        )}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            barColors[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </ProgressPrimitive.Root>
    </div>
  );
}
