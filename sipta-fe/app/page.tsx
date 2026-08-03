"use client";
import { useEffect, useState } from "react";
import HeaderComponent from "./components/HeaderComponent";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ErrorComponent from "./components/ErrorComponent";
import LoadingComponent from "./components/LoadingComponent";
import { useAuthStore } from "@/src/state/AuthStore";
import DashboardHeader from "./components/dashboard/DashboardHeader";
import ScheduleTabs from "./components/dashboard/ScheduleTabs";
import IncompleteSchedules from "./components/dashboard/IncompleteSchedules";

export default function TeacherDashboard() {
  const [localError, setLocalError] = useState<string | null>(null);
  const { user, isLoading, error: authError, clearError } = useAuthStore();


  // Clear auth error ketika component unmount
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      setLocalError(authError);
    }
  }, [authError]);

  // Show loading state dari auth store
  if (isLoading) {
    return <LoadingComponent />;
  }

  return (
    <ProtectedRoute allowedRoles={["teacher", "admin"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-20">
        <HeaderComponent />
        <main className="max-w-7xl mx-auto px-4 py-4">
          <DashboardHeader />

          {/* Error Banner */}
          {localError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-red-600">⚠️</span>
                  <p className="text-red-800 ml-2 text-sm">{localError}</p>
                </div>
                <button
                  onClick={() => {
                    setLocalError(null);
                    clearError();
                  }}
                  className="text-red-600 hover:text-red-800"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <ScheduleTabs />
          <IncompleteSchedules />
        </main>
      </div>
    </ProtectedRoute>
  );
}
