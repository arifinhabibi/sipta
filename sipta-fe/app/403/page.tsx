import { HomeIcon, ShieldExclamationIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function Forbidden() {
  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: "var(--sipta-background)" }}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-3xl p-10 text-center sipta-ambient-glow"
        style={{
          background: "var(--sipta-surface)",
          border: "1px solid var(--sipta-border)",
          boxShadow: "var(--shadow-xl)",
        }}
      >
        <div
          className="relative z-10 mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background: "var(--sipta-warning-subtle)",
            color: "var(--sipta-warning)",
          }}
          aria-hidden="true"
        >
          <ShieldExclamationIcon className="h-7 w-7" />
        </div>

        <p
          className="relative z-10 mt-4 text-xs font-medium uppercase tracking-[0.18em]"
          style={{ color: "var(--sipta-warning)" }}
        >
          Akses ditolak · 403
        </p>
        <h1
          className="relative z-10 mt-2 text-5xl font-semibold tabular-nums tracking-tight"
          style={{
            color: "var(--sipta-foreground)",
            fontFamily: "var(--font-display-family)",
          }}
        >
          403
        </h1>
        <h2
          className="relative z-10 mt-3 text-xl font-semibold tracking-tight"
          style={{ color: "var(--sipta-foreground)" }}
        >
          Anda tidak memiliki izin akses
        </h2>
        <p
          className="relative z-10 mt-3 text-sm leading-relaxed"
          style={{ color: "var(--sipta-muted-fg)" }}
        >
          Halaman ini terbatas untuk peran tertentu. Hubungi administrator jika
          Anda merasa seharusnya memiliki akses.
        </p>

        <Link
          href="/"
          className="relative z-10 mt-8 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors"
          style={{
            background: "var(--sipta-primary)",
            color: "var(--sipta-primary-fg)",
          }}
          data-testid="forbidden-home-button"
        >
          <HomeIcon className="h-4 w-4" />
          Kembali ke beranda
        </Link>
      </div>
    </main>
  );
}
