import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import type React from "react";

interface ErrorProps {
  setError: (condition: string | null) => void;
  error: string;
}

/**
 * Full-screen error state with a clear retry affordance. Uses semantic tokens
 * so it adapts to dark mode automatically. Preserves the original callback
 * contract: calling `setError(null)` triggers retry / clears the error.
 */
const ErrorComponent: React.FC<ErrorProps> = ({ setError, error }) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--sipta-background)" }}
      role="alert"
      aria-live="assertive"
      data-testid="error-component"
    >
      <div
        className="relative w-full max-w-md rounded-2xl p-8 text-center"
        style={{
          background: "var(--sipta-surface)",
          border: "1px solid var(--sipta-border)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background: "var(--sipta-destructive-subtle)",
            color: "var(--sipta-destructive)",
          }}
          aria-hidden="true"
        >
          <ExclamationTriangleIcon className="h-7 w-7" />
        </div>

        <h3
          className="text-lg font-semibold tracking-tight"
          style={{
            color: "var(--sipta-foreground)",
            fontFamily: "var(--font-display-family)",
          }}
        >
          Gagal memuat data
        </h3>
        <p
          className="mt-2 text-sm leading-relaxed"
          style={{ color: "var(--sipta-muted-fg)" }}
        >
          {error}
        </p>

        <div className="mt-6 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setError(null)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: "var(--sipta-primary)",
              color: "var(--sipta-primary-fg)",
              ["--tw-ring-color" as any]: "var(--sipta-primary)",
            }}
            data-testid="error-retry-button"
          >
            <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
            Coba lagi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorComponent;
