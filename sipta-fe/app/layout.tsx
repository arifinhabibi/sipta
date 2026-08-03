import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// @ts-ignore: Handle side-effect import for global CSS in Next.js app directory
import "./globals.css";
// import "leaflet/dist/leaflet.css";
import { Providers } from "./providers";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIPTA",
  description: "Sistem Informasi Pembelajaran TPA Arrahman",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          {children}
          <Toaster position="top-center" reverseOrder={false} />
        </Providers>
      </body>
    </html>
  );
}
