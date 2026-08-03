"use client";
import {
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { useAuthStore } from "@/src/state/AuthStore";
import DashboardHeader from "./components/dashboard/DashboardHeader";
import IncompleteSchedules from "./components/dashboard/IncompleteSchedules";
import ScheduleTabs from "./components/dashboard/ScheduleTabs";
import HeaderComponent from "./components/HeaderComponent";
import LoadingComponent from "./components/LoadingComponent";
import { ProtectedRoute } from "./components/ProtectedRoute";

/**
 * Dashboard shell — same behavior as v1 (auth guard, error surface, clock
 * banner, tabbed schedule list, incomplete follow-ups). Redesigned canvas:
 *   - soft dotted background canvas instead of loud blue gradient
 *   - refined error banner with semantic tokens + iconography
 *   - preserved role restriction ["teacher", "admin"]
 */
export default function TeacherDashboard() {
  const [localError, setLocalError] = useState<string | null>(null);
  const { isLoading, error: authError, clearError } = useAuthStore();

  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  useEffect(() => {
    if (authError) setLocalError(authError);
  }, [authError]);

  if (isLoading) {
    return <LoadingComponent />;
  }

  return (
    <ProtectedRoute allowedRoles={["teacher", "admin"]}>
      <div
        className="min-h-screen pb-24"
        style={{ background: "var(--sipta-background)" }}
        data-testid="dashboard-shell"
      >
        <HeaderComponent />

        {/* Subtle ambient canvas */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-16 -z-0 h-72 sipta-dots-bg opacity-60"
        />

        <main
          className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6"
          data-testid="dashboard-main"
        >
          <DashboardHeader />

          {localError && (
            <div
              role="alert"
              className="mb-5 flex items-start justify-between gap-3 rounded-xl border p-4 animate-fade-in"
              style={{
                background: "var(--sipta-destructive-subtle)",
                borderColor:
                  "color-mix(in oklch, var(--sipta-destructive) 25%, var(--sipta-border))",
                color: "var(--sipta-destructive)",
              }}
              data-testid="dashboard-error-banner"
            >
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon
                  className="h-5 w-5 shrink-0"
                  aria-hidden="true"
                />
                <div className="text-sm leading-relaxed">
                  <p className="font-semibold">Perhatian</p>
                  <p
                    style={{
                      color:
                        "color-mix(in oklch, var(--sipta-destructive) 70%, var(--sipta-foreground))",
                    }}
                  >
                    {localError}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLocalError(null);
                  clearError();
                }}
                className="rounded-md p-1 transition-colors hover:bg-white/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sipta-destructive)]"
                aria-label="Tutup notifikasi"
                data-testid="dashboard-error-dismiss"
              >
                <XCircleIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          <ScheduleTabs />
          <IncompleteSchedules />
        </main>
      </div>
    </ProtectedRoute>
  );
}
