"use client";

import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";
import { useTheme } from "./ThemeProvider";

interface ThemeToggleProps {
  className?: string;
  variant?: "ghost" | "solid";
}

/**
 * Compact icon-button theme toggle. Consumed by HeaderComponent.
 * Preserves keyboard access + aria semantics + visible focus.
 */
export default function ThemeToggle({
  className = "",
  variant = "ghost",
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const base =
    "inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sipta-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sipta-surface)]";
  const variants = {
    ghost:
      "text-[var(--sipta-muted-fg)] hover:text-[var(--sipta-foreground)] hover:bg-[var(--sipta-surface-3)]",
    solid:
      "bg-[var(--sipta-surface)] border border-[var(--sipta-border)] text-[var(--sipta-foreground)] hover:bg-[var(--sipta-surface-3)]",
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`${base} ${variants[variant]} ${className}`}
      aria-label={isDark ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      aria-pressed={isDark}
      title={isDark ? "Mode terang" : "Mode gelap"}
      data-testid="theme-toggle"
    >
      {isDark ? (
        <SunIcon className="h-5 w-5" aria-hidden="true" />
      ) : (
        <MoonIcon className="h-5 w-5" aria-hidden="true" />
      )}
    </button>
  );
}
