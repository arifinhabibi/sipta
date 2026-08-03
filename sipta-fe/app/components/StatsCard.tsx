"use client";
import type { ReactElement } from "react";

interface StatsCardProps {
  icon: ReactElement;
  label: string;
  value: string | number;
  /** Tailwind border-l-* utility for legacy compat (e.g. `border-blue-500`). */
  color: string;
  subtitle?: string;
  /** Optional trend indicator (%). Positive = success, negative = destructive. */
  trend?: number;
  /** Optional data-testid override for stable e2e selectors. */
  testId?: string;
}

/**
 * Metric card used across dashboard, reports, and profile summaries.
 * Keeps the same 5-prop signature (`icon`, `label`, `value`, `color`,
 * `subtitle`) so every existing call site continues to work — while
 * upgrading typography, spacing, and layer semantics to the redesign.
 */
const StatsCard: React.FC<StatsCardProps> = ({
  icon,
  label,
  value,
  color,
  subtitle,
  trend,
  testId,
}) => {
  const trendColor =
    typeof trend === "number"
      ? trend >= 0
        ? "text-emerald-600"
        : "text-red-600"
      : "text-gray-500";

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border border-l-4 ${color} p-4 transition-all duration-200 sipta-card-hover`}
      style={{
        background: "var(--sipta-surface)",
        borderColor: "var(--sipta-border)",
      }}
      data-testid={testId ?? "stats-card"}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p
            className="text-[11px] font-medium uppercase tracking-wide"
            style={{ color: "var(--sipta-muted-fg)" }}
          >
            {label}
          </p>
          <p
            className="mt-2 text-2xl font-semibold leading-none tracking-tight tabular-nums"
            style={{
              color: "var(--sipta-foreground)",
              fontFamily: "var(--font-display-family)",
            }}
          >
            {value}
          </p>
          {subtitle && (
            <p
              className="mt-1.5 text-xs"
              style={{ color: "var(--sipta-muted-fg)" }}
            >
              {subtitle}
            </p>
          )}
          {typeof trend === "number" && (
            <p
              className={`mt-2 text-xs font-medium ${trendColor} tabular-nums`}
            >
              {trend >= 0 ? "+" : ""}
              {trend.toFixed(1)}%
            </p>
          )}
        </div>
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-[1.03]"
          style={{
            background: "var(--sipta-primary-subtle)",
            color: "var(--sipta-primary)",
          }}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>

      {/* Subtle bottom line — decorative accent */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--sipta-primary), transparent)",
        }}
      />
    </div>
  );
};

export default StatsCard;
