"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        "flex gap-1 overflow-x-auto border-b border-border-subtle scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  );
}

export function TabsTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "relative shrink-0 px-3 py-2.5 text-sm font-medium text-text-tertiary sm:px-4",
        "transition-colors hover:text-text-primary",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500",
        "data-[state=active]:text-primary-400",
        "data-[state=active]:after:absolute data-[state=active]:after:inset-x-0 data-[state=active]:after:bottom-0",
        "data-[state=active]:after:h-0.5 data-[state=active]:after:bg-primary-500 data-[state=active]:after:rounded-full",
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

export function TabsContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn("mt-4 animate-fade-in focus:outline-none", className)}
      {...props}
    >
      {children}
    </TabsPrimitive.Content>
  );
}
