import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-primary-500 text-white hover:bg-primary-600 hover:shadow-glow-primary active:bg-primary-700",
  secondary:
    "bg-bg-tertiary text-text-primary border border-border-subtle hover:bg-bg-elevated hover:border-border-medium",
  ghost:
    "bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary",
  danger:
    "bg-error text-white hover:bg-red-600 active:bg-red-700",
  outline:
    "bg-transparent text-primary-500 border border-primary-500 hover:bg-primary-500/10",
  success:
    "bg-success text-white hover:bg-accent-600 active:bg-accent-700",
};

const sizes = {
  sm: "h-(--button-height-sm) px-3 text-xs gap-1.5 rounded-lg",
  md: "h-(--button-height-md) px-5 text-sm gap-2 rounded-xl",
  lg: "h-(--button-height-lg) px-6 text-base gap-2.5 rounded-xl",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      asChild = false,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    const sharedClassName = cn(
      "inline-flex items-center justify-center font-semibold",
      "transition-all duration-150 ease-out",
      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
      "disabled:pointer-events-none disabled:opacity-50",
      "active:scale-[0.98]",
      variants[variant],
      sizes[size],
      className
    );

    // When asChild, Slot expects exactly one child element — don't inject extra nodes
    if (asChild) {
      return (
        <Slot ref={ref} className={sharedClassName} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={sharedClassName}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
