"use client";

import { type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  trigger?: ReactNode;
}

export function Modal({ open, onOpenChange, children, trigger }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      {trigger && <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>}
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed top-1/2 left-1/2 z-50 w-full max-w-[420px] -translate-x-1/2 -translate-y-1/2",
            "rounded-2xl border border-border-subtle bg-bg-secondary p-6 shadow-xl",
            "data-[state=open]:animate-scale-in",
            "focus:outline-none"
          )}
        >
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function ModalHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mb-6 flex items-start justify-between", className)}
      {...props}
    >
      <div>{children}</div>
      <Dialog.Close
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center rounded-lg",
          "text-text-tertiary transition-colors",
          "hover:bg-bg-tertiary hover:text-text-primary"
        )}
        aria-label="Close"
      >
        <X className="h-4 w-4" />
      </Dialog.Close>
    </div>
  );
}

export function ModalTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <Dialog.Title
      className={cn("text-xl font-semibold text-text-primary font-display", className)}
      {...props}
    >
      {children}
    </Dialog.Title>
  );
}

export function ModalDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <Dialog.Description
      className={cn("mt-1 text-sm text-text-secondary", className)}
      {...props}
    >
      {children}
    </Dialog.Description>
  );
}

export function ModalBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(className)} {...props}>
      {children}
    </div>
  );
}

export function ModalFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-6 flex items-center justify-end gap-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}
