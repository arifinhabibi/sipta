import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  Geist,
  Geist_Mono,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Display font — Bricolage Grotesque: distinctive, characterful,
// modern-fintech feeling without being generic (avoids Inter/Roboto/Space Grotesk).
const bricolage = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Tabular monospace for numeric-heavy analytics content.
const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "SIPTA — Sistem Informasi Pembelajaran TPA Arrahman",
  description:
    "Manajemen guru, kelas, jadwal, absensi, dan laporan performa siswa dalam satu antarmuka analitik modern.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// No-FOUC theme bootstrap. Runs before React hydrates so the correct
// theme class is on <html> before first paint.
const themeBootstrap = `
(function () {
  try {
    var stored = localStorage.getItem('sipta-theme');
    var systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (systemDark ? 'dark' : 'light');
    var root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    root.setAttribute('data-theme', theme);
  } catch (e) { /* ignore */ }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bricolage.variable} ${jetbrains.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster
            position="top-center"
            reverseOrder={false}
            toastOptions={{
              style: {
                background: "var(--sipta-surface-elevated)",
                color: "var(--sipta-foreground)",
                border: "1px solid var(--sipta-border)",
                boxShadow: "var(--shadow-lg)",
                borderRadius: "12px",
                fontSize: "0.875rem",
                padding: "10px 14px",
              },
              success: {
                iconTheme: {
                  primary: "var(--sipta-success)",
                  secondary: "var(--sipta-surface)",
                },
              },
              error: {
                iconTheme: {
                  primary: "var(--sipta-destructive)",
                  secondary: "var(--sipta-surface)",
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
