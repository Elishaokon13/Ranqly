"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export function Select({
  value,
  onValueChange,
  placeholder = "Select...",
  label,
  error,
  children,
  className,
}: SelectProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-sm font-medium text-text-primary">{label}</label>
      )}
      <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
        <SelectPrimitive.Trigger
          className={cn(
            "inline-flex h-(--input-height) w-full items-center justify-between rounded-xl border bg-bg-secondary px-4 text-sm",
            "text-text-primary placeholder:text-text-disabled",
            "transition-colors duration-150",
            "focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
            "data-[placeholder]:text-text-disabled",
            error
              ? "border-error"
              : "border-border-subtle hover:border-border-medium"
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className="h-4 w-4 text-text-tertiary" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={4}
            className={cn(
              "z-50 max-h-60 min-w-[var(--radix-select-trigger-width)] overflow-hidden",
              "rounded-xl border border-border-subtle bg-bg-elevated shadow-lg",
              "animate-scale-in"
            )}
          >
            <SelectPrimitive.Viewport className="p-1">
              {children}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
      {error && (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function SelectItem({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <SelectPrimitive.Item
      value={value}
      className={cn(
        "relative flex cursor-pointer items-center rounded-lg px-3 py-2.5 pr-8 text-sm text-text-secondary",
        "outline-none transition-colors",
        "data-[highlighted]:bg-bg-tertiary data-[highlighted]:text-text-primary",
        "data-[state=checked]:text-primary-400",
        className
      )}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator className="absolute right-2">
        <Check className="h-4 w-4 text-primary-500" />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}
