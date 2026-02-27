import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "@/lib/utils";

export interface SeparatorProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
  label?: string;
}

export function Separator({
  orientation = "horizontal",
  className,
  label,
}: SeparatorProps) {
  if (label) {
    return (
      <div className="flex items-center gap-3">
        <SeparatorPrimitive.Root
          orientation="horizontal"
          className={cn("h-px flex-1 bg-border-subtle", className)}
        />
        <span className="text-xs font-medium text-text-disabled">{label}</span>
        <SeparatorPrimitive.Root
          orientation="horizontal"
          className={cn("h-px flex-1 bg-border-subtle", className)}
        />
      </div>
    );
  }

  return (
    <SeparatorPrimitive.Root
      orientation={orientation}
      className={cn(
        orientation === "horizontal" ? "h-px w-full" : "h-full w-px",
        "bg-border-subtle",
        className
      )}
    />
  );
}
