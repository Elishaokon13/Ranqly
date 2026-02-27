import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-bg-tertiary text-text-secondary border-border-subtle",
  primary: "bg-primary-500/15 text-primary-300 border-primary-500/30",
  success: "bg-success/15 text-accent-400 border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  error: "bg-error/15 text-error border-error/30",
  info: "bg-info/15 text-primary-300 border-info/30",
  hot: "bg-error/20 text-error border-error/40",
};

const sizes = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", {
            "bg-text-secondary": variant === "default",
            "bg-primary-400": variant === "primary" || variant === "info",
            "bg-success": variant === "success",
            "bg-warning": variant === "warning",
            "bg-error": variant === "error" || variant === "hot",
          })}
        />
      )}
      {children}
    </span>
  );
}
