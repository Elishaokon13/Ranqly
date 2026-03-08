import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-sm font-medium text-text-primary"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "h-(--input-height) w-full rounded-xl border bg-bg-secondary px-4 text-sm text-text-primary",
            "placeholder:text-text-disabled",
            "transition-colors duration-150",
            "focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-error focus:border-error focus:ring-error"
              : "border-border-subtle hover:border-border-medium",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${id}-error` : hint ? `${id}-hint` : undefined
          }
          {...props}
        />
        {error && (
          <p id={`${id}-error`} className="text-xs text-error" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${id}-hint`} className="text-xs text-text-tertiary">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
