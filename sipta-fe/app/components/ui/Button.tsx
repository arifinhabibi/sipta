"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "destructive" | "subtle";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 font-medium select-none rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sipta-surface)] disabled:cursor-not-allowed disabled:opacity-60";

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-3.5 text-sm",
  lg: "h-11 px-5 text-sm",
  icon: "h-9 w-9",
};

const variantClass: Record<Variant, string> = {
  primary:
    "bg-[var(--sipta-primary)] text-[var(--sipta-primary-fg)] hover:bg-[var(--sipta-primary-hover)] focus-visible:ring-[var(--sipta-primary)] shadow-[var(--shadow-sm)]",
  secondary:
    "bg-[var(--sipta-surface-3)] text-[var(--sipta-foreground)] hover:bg-[color-mix(in_oklch,var(--sipta-surface-3)_60%,var(--sipta-border))] focus-visible:ring-[var(--sipta-primary)]",
  outline:
    "bg-[var(--sipta-surface)] text-[var(--sipta-foreground)] border border-[var(--sipta-border)] hover:bg-[var(--sipta-surface-3)] focus-visible:ring-[var(--sipta-primary)]",
  ghost:
    "text-[var(--sipta-foreground)] hover:bg-[var(--sipta-surface-3)] focus-visible:ring-[var(--sipta-primary)]",
  destructive:
    "bg-[var(--sipta-destructive)] text-[var(--sipta-destructive-fg)] hover:brightness-95 focus-visible:ring-[var(--sipta-destructive)] shadow-[var(--shadow-sm)]",
  subtle:
    "bg-[var(--sipta-primary-subtle)] text-[var(--sipta-primary)] hover:bg-[color-mix(in_oklch,var(--sipta-primary-subtle)_75%,var(--sipta-primary-subtle-2))] focus-visible:ring-[var(--sipta-primary)]",
};

/**
 * Primary button primitive for the redesigned surfaces. Provides a small,
 * predictable prop surface (`variant`, `size`, `loading`, icon slots) and
 * inherits accessible focus + disabled semantics.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    leadingIcon,
    trailingIcon,
    fullWidth = false,
    className,
    children,
    disabled,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, sizes[size], variantClass[variant], fullWidth && "w-full", className)}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current/30 border-t-current"
        />
      )}
      {!loading && leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  );
});
