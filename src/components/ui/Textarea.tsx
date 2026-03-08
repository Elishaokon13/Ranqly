import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  charCount?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, charCount, maxLength, id, ...props }, ref) => {
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
        <textarea
          ref={ref}
          id={id}
          className={cn(
            "min-h-[120px] w-full resize-y rounded-xl border bg-bg-secondary px-4 py-3 text-sm text-text-primary",
            "placeholder:text-text-disabled",
            "transition-colors duration-150",
            "focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error
              ? "border-error focus:border-error focus:ring-error"
              : "border-border-subtle hover:border-border-medium",
            className
          )}
          maxLength={maxLength}
          aria-invalid={!!error}
          {...props}
        />
        <div className="flex items-center justify-between">
          <div>
            {error && (
              <p className="text-xs text-error" role="alert">
                {error}
              </p>
            )}
            {hint && !error && (
              <p className="text-xs text-text-tertiary">{hint}</p>
            )}
          </div>
          {maxLength !== undefined && (
            <p
              className={cn(
                "text-xs",
                charCount !== undefined && charCount > maxLength
                  ? "text-error"
                  : "text-text-tertiary"
              )}
            >
              {charCount ?? 0} / {maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
