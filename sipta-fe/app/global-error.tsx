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
    <html>
      <body>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="max-w-lg rounded-2xl bg-white p-8 shadow-lg border border-red-100">
            <p className="text-sm font-semibold uppercase tracking-wide text-red-600">
              Terjadi kesalahan
            </p>
            <h1 className="mt-3 text-2xl font-bold text-gray-900">
              Aplikasi mengalami gangguan sementara
            </h1>
            <p className="mt-3 text-sm text-gray-600">
              Kami sudah mencatat error ini. Silakan muat ulang halaman atau coba lagi beberapa saat.
            </p>
            <button
              onClick={() => reset()}
              className="mt-6 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Coba lagi
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
