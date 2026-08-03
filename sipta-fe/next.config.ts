import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // daftar domain atau pola URL yang diizinkan
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",                      // biarkan kosong kalau pakai default port
        pathname: "/storage/**",        // path file storage
      },
      {
        protocol: "https",
        hostname: "api-santrack-v1.argasolusi.com",
        port: "",                      // biarkan kosong kalau pakai default port
        pathname: "/storage/**",        // path file storage
      },
       {
        protocol: "https",
        hostname: "ximena-nondeficient-coralie.ngrok-free.dev",
        port: "",                      // biarkan kosong kalau pakai default port
        pathname: "/storage/**",        // path file storage
      },
    ],
  },
}

export default nextConfig;
