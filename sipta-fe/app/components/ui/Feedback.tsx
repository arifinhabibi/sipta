"use client";

import { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

/* --------------------- EmptyState --------------------- */

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  testId?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  testId,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--sipta-border)] px-6 py-10 text-center",
        className,
      )}
      data-testid={testId ?? "empty-state"}
    >
      {icon && (
        <div
          className="mb-3 flex h-12 w-12 items-center justify-center rounded-full text-[var(--sipta-muted-fg)]"
          style={{ background: "var(--sipta-surface-3)" }}
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <h3
        className="text-sm font-semibold text-[var(--sipta-foreground)]"
        style={{ fontFamily: "var(--font-display-family)" }}
      >
        {title}
      </h3>
      {description && (
        <p className="mt-1.5 max-w-sm text-xs text-[var(--sipta-muted-fg)]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/* --------------------- Skeleton --------------------- */

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("sipta-skeleton h-4 w-full", className)} {...props} />;
}

/* --------------------- Tabs (uncontrolled-lite) --------------------- */

export interface TabItem<T extends string = string> {
  id: T;
  label: string;
  icon?: ReactNode;
  count?: number;
  disabled?: boolean;
  testId?: string;
}

export interface TabsProps<T extends string> {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
  className?: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
  className,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border border-[var(--sipta-border)] bg-[var(--sipta-surface-2)] p-1",
        className,
      )}
    >
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={active}
            aria-controls={`tabpanel-${item.id}`}
            id={`tab-${item.id}`}
            disabled={item.disabled}
            onClick={() => onChange(item.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sipta-primary)]",
              active
                ? "bg-[var(--sipta-surface)] text-[var(--sipta-foreground)] shadow-[var(--shadow-xs)]"
                : "text-[var(--sipta-muted-fg)] hover:text-[var(--sipta-foreground)]",
              item.disabled && "opacity-50 cursor-not-allowed",
            )}
            data-testid={item.testId}
          >
            {item.icon}
            <span>{item.label}</span>
            {typeof item.count === "number" && (
              <span
                className="tabular-nums rounded px-1.5 py-0.5 text-[10px] font-semibold"
                style={{
                  background: active ? "var(--sipta-primary-subtle)" : "var(--sipta-surface-3)",
                  color: active ? "var(--sipta-primary)" : "var(--sipta-muted-fg)",
                }}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* --------------------- Alert --------------------- */

export type AlertTone = "info" | "success" | "warning" | "destructive";

export interface AlertProps {
  tone?: AlertTone;
  title?: string;
  icon?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
  testId?: string;
}

const alertToneMap: Record<AlertTone, { bg: string; fg: string; border: string }> = {
  info: {
    bg: "var(--sipta-info-subtle)",
    fg: "var(--sipta-info)",
    border: "color-mix(in oklch, var(--sipta-info) 25%, var(--sipta-border))",
  },
  success: {
    bg: "var(--sipta-success-subtle)",
    fg: "var(--sipta-success)",
    border: "color-mix(in oklch, var(--sipta-success) 25%, var(--sipta-border))",
  },
  warning: {
    bg: "var(--sipta-warning-subtle)",
    fg: "var(--sipta-warning)",
    border: "color-mix(in oklch, var(--sipta-warning) 25%, var(--sipta-border))",
  },
  destructive: {
    bg: "var(--sipta-destructive-subtle)",
    fg: "var(--sipta-destructive)",
    border: "color-mix(in oklch, var(--sipta-destructive) 25%, var(--sipta-border))",
  },
};

export function Alert({
  tone = "info",
  title,
  icon,
  children,
  action,
  onDismiss,
  className,
  testId,
}: AlertProps) {
  const t = alertToneMap[tone];
  return (
    <div
      role="alert"
      className={cn("flex items-start gap-3 rounded-xl border p-3.5", className)}
      style={{ background: t.bg, borderColor: t.border }}
      data-testid={testId}
    >
      {icon && (
        <span className="mt-0.5 shrink-0" style={{ color: t.fg }} aria-hidden="true">
          {icon}
        </span>
      )}
      <div className="min-w-0 flex-1 text-sm">
        {title && (
          <p className="font-semibold" style={{ color: "var(--sipta-foreground)" }}>
            {title}
          </p>
        )}
        {children && (
          <div
            className="leading-relaxed"
            style={{
              color: `color-mix(in oklch, ${t.fg} 60%, var(--sipta-foreground))`,
            }}
          >
            {children}
          </div>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md p-1 opacity-70 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2"
          style={{ color: t.fg, ["--tw-ring-color" as any]: t.fg }}
          aria-label="Tutup notifikasi"
        >
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
            <path
              d="M6 6l8 8M14 6l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
