/**
 * Loading state used across the app shell (dashboard bootstrap, protected
 * route guard, etc.). Design-system compliant: uses semantic tokens so it
 * adapts in both light and dark modes.
 */
function LoadingComponent({ label = "Memuat data…" }: { label?: string }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "var(--sipta-background)" }}
      data-testid="loading-component"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-6 text-center">
        {/* Layered rings — softer than a raw spinner */}
        <div className="relative h-14 w-14" aria-hidden="true">
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background:
                "conic-gradient(from 180deg, transparent 0deg, var(--sipta-primary) 320deg, transparent 360deg)",
              maskImage: "radial-gradient(circle, transparent 55%, black 56%)",
              WebkitMaskImage:
                "radial-gradient(circle, transparent 55%, black 56%)",
              animation: "spin 1.1s linear infinite",
            }}
          />
          <span
            className="absolute inset-[6px] rounded-full"
            style={{
              border: "1px solid var(--sipta-border)",
              background: "var(--sipta-surface)",
            }}
          />
          <span
            className="absolute inset-[14px] rounded-full"
            style={{
              background: "var(--sipta-primary)",
              opacity: 0.85,
              animation: "pulse-soft 1.6s ease-in-out infinite",
            }}
          />
        </div>

        <div className="space-y-1.5">
          <p
            className="text-sm font-medium"
            style={{ color: "var(--sipta-foreground)" }}
          >
            {label}
          </p>
          <p className="text-xs" style={{ color: "var(--sipta-muted-fg)" }}>
            Menyiapkan antarmuka SIPTA
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoadingComponent;
