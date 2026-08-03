// app/providers.tsx
"use client";

import { HeroUIProvider } from "@heroui/react";
import { useEffect } from "react";
import { setupAuthInterceptor } from "@/src/infrastructure/SetupInterceptor";
import { useAuthStore } from "@/src/state/AuthStore";
import { ThemeProvider } from "./components/ThemeProvider";

/**
 * Bootstraps auth (Zustand persistence) then wires the axios interceptor once
 * initialization has completed. This ordering is business-critical — see
 * docs/frontend-architecture/10-authentication-and-authorization.md.
 */
function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initializeAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized) {
      setupAuthInterceptor();
    }
  }, [isInitialized]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <HeroUIProvider>
        <AuthInitializer>{children}</AuthInitializer>
      </HeroUIProvider>
    </ThemeProvider>
  );
}
