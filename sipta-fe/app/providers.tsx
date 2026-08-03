// app/providers.tsx
"use client";

import { useEffect } from "react";
import { HeroUIProvider } from "@heroui/react";
import { useAuthStore } from "@/src/state/AuthStore";
import { setupAuthInterceptor } from "@/src/infrastructure/SetupInterceptor";

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { initializeAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    // console.log("🔐 Initializing auth state...");
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (isInitialized) {
      // console.log("🔄 Setting up auth interceptors...");
      setupAuthInterceptor();
    }
  }, [isInitialized]);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <HeroUIProvider>
      <AuthInitializer>{children}</AuthInitializer>
    </HeroUIProvider>
  );
}
