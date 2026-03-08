"use client";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  description,
  id,
  disabled,
  className,
}: CheckboxProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <CheckboxPrimitive.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border",
          "transition-colors duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:border-primary-500 data-[state=checked]:bg-primary-500",
          "data-[state=unchecked]:border-border-medium data-[state=unchecked]:bg-bg-secondary"
        )}
      >
        <CheckboxPrimitive.Indicator>
          <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {(label || description) && (
        <div className="flex flex-col gap-0.5">
          {label && (
            <label
              htmlFor={id}
              className="cursor-pointer text-sm font-medium text-text-primary"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-xs text-text-tertiary">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}
