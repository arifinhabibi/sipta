import { ArrowLeftIcon, HomeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

export default function NotFound() {
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
        <p
          className="relative z-10 text-xs font-medium uppercase tracking-[0.18em]"
          style={{ color: "var(--sipta-primary)" }}
        >
          Error · 404
        </p>
        <h1
          className="relative z-10 mt-3 text-6xl font-semibold tabular-nums tracking-tight"
          style={{
            color: "var(--sipta-foreground)",
            fontFamily: "var(--font-display-family)",
          }}
        >
          404
        </h1>
        <h2
          className="relative z-10 mt-3 text-xl font-semibold tracking-tight"
          style={{ color: "var(--sipta-foreground)" }}
        >
          Halaman tidak ditemukan
        </h2>
        <p
          className="relative z-10 mt-3 text-sm leading-relaxed"
          style={{ color: "var(--sipta-muted-fg)" }}
        >
          Sumber daya yang Anda tuju tidak tersedia atau sudah dipindahkan.
          Silakan kembali ke beranda untuk melanjutkan.
        </p>

        <div className="relative z-10 mt-8 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-3">
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors sm:w-auto"
            style={{
              background: "var(--sipta-primary)",
              color: "var(--sipta-primary-fg)",
            }}
            data-testid="notfound-home-button"
          >
            <HomeIcon className="h-4 w-4" />
            Kembali ke beranda
          </Link>
          <Link
            href="/"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors sm:w-auto"
            style={{
              background: "transparent",
              color: "var(--sipta-foreground)",
              border: "1px solid var(--sipta-border)",
            }}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Halaman sebelumnya
          </Link>
        </div>
      </div>
    </main>
  );
}
