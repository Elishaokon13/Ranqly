import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
};

export interface SpinnerProps {
  size?: keyof typeof sizes;
  className?: string;
  label?: string;
}

export function Spinner({ size = "md", className, label }: SpinnerProps) {
  return (
    <div
      className={cn("inline-flex flex-col items-center gap-2", className)}
      role="status"
      aria-label={label || "Loading"}
    >
      <Loader2 className={cn("animate-spin text-primary-500", sizes[size])} />
      {label && (
        <span className="text-sm text-text-secondary">{label}</span>
      )}
      <span className="sr-only">{label || "Loading"}</span>
    </div>
  );
}

export function PageLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <Spinner size="lg" label={label} />
    </div>
  );
}
