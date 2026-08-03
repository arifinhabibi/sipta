"use client";
import {
  BuildingLibraryIcon,
  CalendarIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import type React from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/src/state/AuthStore";

/**
 * Dashboard hero band. v2 redesign:
 *   - replaces loud blue→indigo gradient with an inset ambient tile
 *   - promotes teacher/school context; adds real-time clock with WIB tag
 *   - preserves original data source (localStorage `auth-storage`)
 */
const DashboardHeader: React.FC = () => {
  const [time, setTime] = useState(new Date());
  useAuthStore((s) => s.me); // preserve reactive re-render on getMe

  const [user, setUser] = useState({
    fullname: "",
    degree: "",
    email: "",
    photo: "",
    role: "",
  });
  const [instance, setInstance] = useState({
    name: "",
    description: "",
    type_institutions: "",
    logo: "",
  });
  const [academicYear, setAcademicYear] = useState({ name: "", periode: "" });

  const teacherName = user.fullname || "Selamat datang";
  const schoolName = instance.name || "SIPTA";

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const authData = localStorage.getItem("auth-storage");
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        setUser(parsed.state?.user || {});
        setInstance(parsed.state?.instance || {});
        setAcademicYear(parsed.state?.academic_year || {});
      } catch (_err) {
        toast.error("Gagal membaca data login.");
      }
    }
  }, []);

  const greeting = (() => {
    const h = time.getHours();
    if (h < 11) return "Selamat pagi";
    if (h < 15) return "Selamat siang";
    if (h < 18) return "Selamat sore";
    return "Selamat malam";
  })();

  return (
    <section
      className="relative mb-6 overflow-hidden rounded-2xl"
      style={{
        background:
          "linear-gradient(135deg, #4F46E5 0%, #6D28D9 55%, #7C3AED 100%)",
        color: "#FFFFFF",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "var(--shadow-md)",
      }}
      data-testid="dashboard-hero"
    >
      {/* Decorative subtle grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.35) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.35) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full opacity-30 blur-3xl"
        style={{ background: "rgba(255,255,255,0.7)" }}
      />

      <div className="relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] opacity-80">
            {greeting}
          </p>
          <h2
            className="mt-1.5 truncate text-xl font-semibold tracking-tight sm:text-2xl"
            style={{ fontFamily: "var(--font-display-family)" }}
            data-testid="dashboard-hero-name"
          >
            {teacherName}
            {user.degree ? (
              <span className="opacity-80"> {user.degree}</span>
            ) : null}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm opacity-90">
            <BuildingLibraryIcon className="h-4 w-4" aria-hidden="true" />
            <span className="truncate">{schoolName}</span>
            {academicYear.name && (
              <>
                <span aria-hidden="true" className="opacity-50">
                  ·
                </span>
                <span className="tabular-nums">
                  T.A. {academicYear.name}
                  {academicYear.periode ? ` (${academicYear.periode})` : ""}
                </span>
              </>
            )}
          </p>
        </div>

        <div
          className="flex items-center gap-3 rounded-xl px-3 py-2 sm:min-w-[210px]"
          style={{
            background: "rgba(255,255,255,0.10)",
            border: "1px solid rgba(255,255,255,0.20)",
            backdropFilter: "blur(8px)",
          }}
          data-testid="dashboard-hero-clock"
        >
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "rgba(255,255,255,0.14)" }}
          >
            <ClockIcon className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 leading-tight">
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-lg font-semibold tabular-nums tracking-tight"
                style={{ fontFamily: "var(--font-mono-family)" }}
              >
                {time.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <span className="text-[10px] font-medium opacity-70">WIB</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] opacity-85">
              <CalendarIcon className="h-3 w-3" aria-hidden="true" />
              <span>
                {time.toLocaleDateString("id-ID", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardHeader;
