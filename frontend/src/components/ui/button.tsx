"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

/**
 * Base button used by the animated dialogs.
 *
 * Styled with Retentio's CSS custom properties rather than fixed Tailwind
 * palette colours so it follows light/dark mode automatically.
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-xl font-semibold transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer border",
          {
            "bg-[var(--solid-btn-bg)] text-[var(--solid-btn-text)] border-transparent hover:opacity-90":
              variant === "default",
            "bg-[var(--danger-bg)] text-[var(--danger-text)] border-[var(--danger-border)] hover:opacity-90":
              variant === "destructive",
            "border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-raised)]":
              variant === "outline",
            "bg-[var(--bg-raised)] text-[var(--text-primary)] border-transparent hover:opacity-90":
              variant === "secondary",
            "border-transparent bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-raised)]":
              variant === "ghost",
            "border-transparent bg-transparent text-[var(--text-primary)] underline-offset-4 hover:underline":
              variant === "link",
          },
          {
            "h-10 px-4 text-[13px]": size === "default",
            "h-8 rounded-lg px-3 text-[12px]": size === "sm",
            "h-12 rounded-2xl px-6 text-[14px]": size === "lg",
            "h-10 w-10 p-0": size === "icon",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
