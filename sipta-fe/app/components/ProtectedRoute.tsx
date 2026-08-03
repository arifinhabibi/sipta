// components/ProtectedRoute.tsx
"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation"; // ✅ TAMBAHKAN
import toast from "react-hot-toast";
import { useAuthStore } from "@/src/state/AuthStore";
import LoadingComponent from "./LoadingComponent";

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<Props> = ({
  children,
  allowedRoles = ["admin"],
}) => {
  const router = useRouter();
  const pathname = usePathname(); // ✅ DAPATKAN CURRENT PATH
  const { user, token, isInitialized, checkTokenValidity } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  // ✅ SKIP AUTH CHECK JIKA DI LOGIN PAGE
  const isLoginPage = pathname === "/auth/login";

  useEffect(() => {
    // ✅ JANGAN CHECK JIKA DI LOGIN PAGE
    if (isLoginPage) {
      // console.log("🟡 ProtectedRoute: Skipping auth check on login page");
      setIsChecking(false);
      return;
    }

    const authenticateAndCheckAccess = async () => {
      if (!isInitialized) {
        // console.log("⏳ Waiting for auth initialization...");
        return;
      }

      // console.log("🔐 ProtectedRoute: Checking access...", {
      //   hasToken: !!token,
      //   hasUser: !!user,
      //   isInitialized,
      // });

      try {
        // 1. Check jika ada token
        if (!token) {
          // console.log("🚫 No token found, redirecting to login");
          toast.error("Please login to access this page");
          router.replace("/auth/login");
          return;
        }

        // 2. Check token validity - ✅ COMMENT DULU
        // const isValid = await checkTokenValidity();
        // console.log("✅ Token validity:", isValid);
        // if (!isValid) {
        //   toast.error("Session expired, please login again");
        //   router.replace("/auth/login");
        //   return;
        // }

        // 3. Check user data
        if (!user) {
          // console.log("🚫 No user data found");
          toast.error("User data not found, please login again");
          router.replace("/auth/login");
          return;
        }

        // 4. Check role permissions
        if (!allowedRoles.includes(user.role)) {
          // console.log(`🚫 Role ${user.role} not allowed`);
          toast.error(`Access denied for role: ${user.role}`);
          router.replace("/403");
          return;
        }

        // 5. All checks passed
        // console.log("✅ Access granted to", user.role);
        setIsChecking(false);
      } catch (error) {
        console.error("❌ Auth check failed:", error);
        toast.error("Authentication failed, please login again");
        router.replace("/auth/login");
      }
    };

    authenticateAndCheckAccess();
  }, [
    isInitialized,
    checkTokenValidity,
    user,
    token,
    router,
    allowedRoles,
    isLoginPage,
  ]);

  // ✅ SKIP RENDERING JIKA DI LOGIN PAGE
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isChecking || !isInitialized) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};

const LoadingSpinner = () => (
  <LoadingComponent />
);
