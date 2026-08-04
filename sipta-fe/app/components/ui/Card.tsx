"use client";

import { forwardRef, HTMLAttributes } from "react";
import { cn } from "./cn";

/* -------------------------- Card --------------------------- */

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "surface" | "elevated" | "outline" | "subtle";
  padding?: "none" | "sm" | "md" | "lg";
}

const padMap: Record<NonNullable<CardProps["padding"]>, string> = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

const variantMap: Record<NonNullable<CardProps["variant"]>, string> = {
  surface:
    "bg-[var(--sipta-surface)] border border-[var(--sipta-border)]",
  elevated:
    "bg-[var(--sipta-surface-elevated)] border border-[var(--sipta-border)] shadow-[var(--shadow-md)]",
  outline:
    "bg-transparent border border-[var(--sipta-border)]",
  subtle:
    "bg-[var(--sipta-surface-2)] border border-[var(--sipta-border-subtle)]",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "surface", padding = "md", className, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cn("rounded-xl", variantMap[variant], padMap[padding], className)}
      {...props}
    />
  );
});

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-start justify-between gap-3 border-b border-[var(--sipta-border)] pb-4 mb-4", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-base font-semibold tracking-tight text-[var(--sipta-foreground)]",
        className,
      )}
      style={{ fontFamily: "var(--font-display-family)" }}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1 text-sm text-[var(--sipta-muted-fg)]", className)} {...props} />
  );
}

/* -------------------------- Badge -------------------------- */

export type BadgeTone =
  | "neutral"
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "accent";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
  size?: "sm" | "md";
  dot?: boolean;
  outline?: boolean;
}

const toneMap: Record<BadgeTone, string> = {
  neutral: "bg-[var(--sipta-surface-3)] text-[var(--sipta-muted-fg)]",
  primary: "bg-[var(--sipta-primary-subtle)] text-[var(--sipta-primary)]",
  success: "bg-[var(--sipta-success-subtle)] text-[var(--sipta-success)]",
  warning: "bg-[var(--sipta-warning-subtle)] text-[var(--sipta-warning)]",
  destructive: "bg-[var(--sipta-destructive-subtle)] text-[var(--sipta-destructive)]",
  info: "bg-[var(--sipta-info-subtle)] text-[var(--sipta-info)]",
  accent: "bg-[var(--sipta-accent-subtle)] text-[var(--sipta-accent)]",
};

const toneOutline: Record<BadgeTone, string> = {
  neutral: "border border-[var(--sipta-border-strong)] text-[var(--sipta-muted-fg)]",
  primary: "border border-[var(--sipta-primary)] text-[var(--sipta-primary)]",
  success: "border border-[var(--sipta-success)] text-[var(--sipta-success)]",
  warning: "border border-[var(--sipta-warning)] text-[var(--sipta-warning)]",
  destructive: "border border-[var(--sipta-destructive)] text-[var(--sipta-destructive)]",
  info: "border border-[var(--sipta-info)] text-[var(--sipta-info)]",
  accent: "border border-[var(--sipta-accent)] text-[var(--sipta-accent)]",
};

const dotToneMap: Record<BadgeTone, string> = {
  neutral: "bg-[var(--sipta-muted-fg)]",
  primary: "bg-[var(--sipta-primary)]",
  success: "bg-[var(--sipta-success)]",
  warning: "bg-[var(--sipta-warning)]",
  destructive: "bg-[var(--sipta-destructive)]",
  info: "bg-[var(--sipta-info)]",
  accent: "bg-[var(--sipta-accent)]",
};

export function Badge({
  tone = "neutral",
  size = "sm",
  dot,
  outline,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        outline ? toneOutline[tone] : toneMap[tone],
        className,
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("inline-block h-1.5 w-1.5 rounded-full", dotToneMap[tone])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
