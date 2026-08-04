"use client";

import { CalendarDaysIcon, LockClosedIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";
import type { AcademicYear } from "@/src/domain/AcademicYearEntity";
import { Badge, cn } from "@/app/components/ui";

export interface SemesterSelectorProps {
  academicYears: AcademicYear[];
  selectedId?: string;
  onChange: (id: string) => void;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * SemesterSelector — read-only academic-year picker for the student report.
 *
 * Purpose (per docs/frontend-architecture/21-semester-student-report.md):
 *   Allow an authorized user to select any available semester of the current
 *   instance without touching the operational active semester. Never invokes
 *   `setActiveAcademicYear`. Emits the selection via `onChange(academic_year_id)`;
 *   the parent page is responsible for URL synchronization.
 *
 * Rules honored:
 *   - Options come from the academic-year API (UUIDs, not labels).
 *   - The active term is visually distinguished but selection is unrestricted.
 *   - Closed terms are labelled explicitly ("Arsip").
 */
export function SemesterSelector({
  academicYears,
  selectedId,
  onChange,
  loading,
  disabled,
  className,
}: SemesterSelectorProps) {
  // Sort: active first, then newest by start date. This matches user mental model.
  const ordered = [...academicYears].sort((a, b) => {
    if (a.is_active !== b.is_active) return a.is_active ? -1 : 1;
    const ta = new Date(a.start_periode).getTime();
    const tb = new Date(b.start_periode).getTime();
    return tb - ta;
  });

  const selected = ordered.find((y) => y.id === selectedId);
  const isSkeleton = loading && ordered.length === 0;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-[var(--sipta-border)] bg-[var(--sipta-surface)] p-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      data-testid="semester-selector"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{
            background: "var(--sipta-primary-subtle)",
            color: "var(--sipta-primary)",
          }}
          aria-hidden="true"
        >
          <CalendarDaysIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p
            className="text-[11px] font-semibold uppercase tracking-wide text-[var(--sipta-muted-fg)]"
          >
            Semester Laporan
          </p>
          <p
            className="mt-0.5 flex items-center gap-2 text-sm font-semibold text-[var(--sipta-foreground)]"
            style={{ fontFamily: "var(--font-display-family)" }}
            data-testid="semester-selector-active-label"
          >
            {isSkeleton ? (
              <span className="sipta-skeleton inline-block h-4 w-32 rounded" aria-hidden="true" />
            ) : selected ? (
              <>
                <span>T.A. {selected.name}</span>
                <span className="text-[var(--sipta-muted-fg)]">·</span>
                <span className="capitalize">{selected.periode}</span>
                {selected.is_active ? (
                  <Badge tone="success" dot data-testid="semester-active-badge">
                    <CheckBadgeIcon className="h-3 w-3" />
                    Semester aktif
                  </Badge>
                ) : selected.status === "closed" ? (
                  <Badge tone="neutral" data-testid="semester-archive-badge">
                    <LockClosedIcon className="h-3 w-3" />
                    Arsip
                  </Badge>
                ) : (
                  <Badge tone="warning" data-testid="semester-draft-badge">
                    Draft
                  </Badge>
                )}
              </>
            ) : (
              <span className="text-[var(--sipta-muted-fg)]">Belum dipilih</span>
            )}
          </p>
        </div>
      </div>

      <label className="w-full sm:w-72" htmlFor="semester-selector-select">
        <span className="sr-only">Pilih semester</span>
        <div
          className={cn(
            "relative flex h-10 items-center rounded-lg border bg-[var(--sipta-surface)] focus-within:ring-2 focus-within:ring-[var(--sipta-primary)]",
            "border-[var(--sipta-border)]",
            (disabled || loading) && "opacity-60",
          )}
        >
          <select
            id="semester-selector-select"
            value={selectedId ?? ""}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || loading || ordered.length === 0}
            className="w-full appearance-none bg-transparent px-3 pr-9 text-sm text-[var(--sipta-foreground)] outline-none"
            data-testid="semester-selector-select"
          >
            {ordered.length === 0 && (
              <option value="" disabled>
                {loading ? "Memuat semester…" : "Tidak ada semester"}
              </option>
            )}
            {ordered.map((y) => (
              <option key={y.id} value={y.id}>
                {`T.A. ${y.name} · ${y.periode}${
                  y.is_active
                    ? " (aktif)"
                    : y.status === "closed"
                      ? " (arsip)"
                      : ""
                }`}
              </option>
            ))}
          </select>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute right-3 h-4 w-4 text-[var(--sipta-muted-fg)]"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M6 8l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </label>
    </div>
  );
}

export default SemesterSelector;
