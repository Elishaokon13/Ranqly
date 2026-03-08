"use client";

import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cn } from "@/lib/utils";

export interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  label?: string;
  children: React.ReactNode;
  className?: string;
}

export function RadioGroup({
  value,
  onValueChange,
  label,
  children,
  className,
}: RadioGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <span className="text-sm font-medium text-text-primary">{label}</span>
      )}
      <RadioGroupPrimitive.Root
        value={value}
        onValueChange={onValueChange}
        className={cn("flex flex-col gap-2.5", className)}
      >
        {children}
      </RadioGroupPrimitive.Root>
    </div>
  );
}

export interface RadioGroupItemProps {
  value: string;
  label: string;
  description?: string;
  id?: string;
  disabled?: boolean;
}

export function RadioGroupItem({
  value,
  label,
  description,
  id,
  disabled,
}: RadioGroupItemProps) {
  return (
    <div className="flex items-start gap-3">
      <RadioGroupPrimitive.Item
        id={id || value}
        value={value}
        disabled={disabled}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
          "transition-colors duration-150",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=checked]:border-primary-500",
          "data-[state=unchecked]:border-border-medium"
        )}
      >
        <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
          <span className="h-2.5 w-2.5 rounded-full bg-primary-500" />
        </RadioGroupPrimitive.Indicator>
      </RadioGroupPrimitive.Item>
      <div className="flex flex-col gap-0.5">
        <label
          htmlFor={id || value}
          className="cursor-pointer text-sm font-medium text-text-primary"
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-text-tertiary">{description}</p>
        )}
      </div>
    </div>
  );
}
