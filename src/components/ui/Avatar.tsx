"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

export interface AvatarProps {
  src?: string;
  alt?: string;
  fallback?: string;
  size?: keyof typeof sizes;
  className?: string;
}

export function Avatar({
  src,
  alt,
  fallback,
  size = "md",
  className,
}: AvatarProps) {
  const initials = fallback
    || (alt
      ? alt
          .split(" ")
          .map((word) => word[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "?");

  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg-tertiary",
        sizes[size],
        className
      )}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={alt || ""}
          className="h-full w-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        className="flex h-full w-full items-center justify-center bg-primary-500/20 font-semibold text-primary-300"
        delayMs={300}
      >
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}

export function AvatarStack({
  avatars,
  max = 5,
  size = "sm",
}: {
  avatars: AvatarProps[];
  max?: number;
  size?: AvatarProps["size"];
}) {
  const shown = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {shown.map((avatar, i) => (
        <Avatar
          key={i}
          {...avatar}
          size={size}
          className="ring-2 ring-bg-primary"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            "relative inline-flex items-center justify-center rounded-full bg-bg-tertiary ring-2 ring-bg-primary",
            "text-xs font-medium text-text-secondary",
            sizes[size || "sm"]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
