"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          background: "#F7F7F5",
          color: "#0B0B0F",
          fontFamily:
            "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
          margin: 0,
        }}
      >
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1.5rem",
          }}
        >
          <div
            style={{
              maxWidth: 520,
              width: "100%",
              padding: "2rem",
              borderRadius: 20,
              background: "#FFFFFF",
              border: "1px solid #E7E5E1",
              boxShadow:
                "0 24px 48px -16px rgba(15,15,20,0.16), 0 12px 24px -8px rgba(15,15,20,0.08)",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#DC2626",
              }}
            >
              Terjadi kesalahan
            </p>
            <h1
              style={{
                margin: "12px 0 0",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: "-0.015em",
              }}
            >
              Aplikasi mengalami gangguan sementara
            </h1>
            <p
              style={{
                marginTop: 12,
                fontSize: 14,
                lineHeight: 1.6,
                color: "#6B6A6B",
              }}
            >
              Kami sudah mencatat error ini. Silakan muat ulang halaman atau
              coba lagi beberapa saat.
            </p>
            {error?.digest && (
              <p
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: "#8E8D8E",
                  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                }}
              >
                Ref: {error.digest}
              </p>
            )}
            <button
              type="button"
              onClick={() => reset()}
              style={{
                marginTop: 24,
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                borderRadius: 10,
                background: "#4F46E5",
                color: "#FFFFFF",
                padding: "10px 16px",
                fontSize: 14,
                fontWeight: 600,
                border: 0,
                cursor: "pointer",
              }}
            >
              Coba lagi
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
