"use client";

import {
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  CalendarIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
  HomeIcon,
  UserCircleIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/src/state/AuthStore";
import { useConfirmDialog } from "./ui";
import ThemeToggle from "./ThemeToggle";

/* ------------------------------------------------------------------ */
/*  HeaderComponent — SIPTA v2 shell                                   */
/*                                                                    */
/*  Preserves 100% of behavior from v1:                                */
/*   - navigation destinations, roles, active-route detection         */
/*   - profile dropdown, logout confirmation, toast semantics         */
/*   - localStorage `auth-storage` read for cached identity           */
/*   - useAuthStore.logout side effects                               */
/*                                                                    */
/*  Visual redesign:                                                  */
/*   - replaces loud blue/indigo gradient with a subtle top-bar shell */
/*   - adds sticky border + hairline separator                        */
/*   - adds theme toggle, mobile drawer, refined focus rings          */
/*   - uses semantic CSS-var tokens (light + dark aware)              */
/* ------------------------------------------------------------------ */

interface NavItem {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  testId: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", Icon: HomeIcon, testId: "nav-dashboard" },
  {
    href: "/teachers",
    label: "Guru",
    Icon: UserGroupIcon,
    adminOnly: true,
    testId: "nav-teachers",
  },
  {
    href: "/classroom",
    label: "Kelas",
    Icon: AcademicCapIcon,
    testId: "nav-classroom",
  },
  {
    href: "/schedules",
    label: "Jadwal",
    Icon: CalendarIcon,
    testId: "nav-schedules",
  },
  {
    href: "/reports",
    label: "Laporan",
    Icon: ClipboardDocumentListIcon,
    testId: "nav-reports",
  },
];

function HeaderComponent() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { confirm, confirmationDialog } = useConfirmDialog();

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
  const { logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

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

  const handleLogoutClick = async () => {
    setIsProfileOpen(false);
    const confirmed = await confirm({
      title: "Konfirmasi keluar",
      description:
        "Anda akan keluar dari sesi ini. Login kembali diperlukan untuk mengakses SIPTA.",
      confirmLabel: "Ya, keluar",
      tone: "destructive",
      testId: "logout-confirm-dialog",
    });
    if (confirmed) handleConfirmLogout();
  };

  const handleConfirmLogout = () => {
    try {
      const resp: any = logout();
      if (resp?.success !== false) {
        toast.success(resp?.message || "Berhasil keluar dari akun.");
        setTimeout(() => router.push("/auth/login"), 1200);
      } else {
        toast.error("Logout gagal. Coba lagi.");
      }
    } catch (_err) {
      toast.error("Terjadi kesalahan saat logout.");
    }
  };

  const isActiveRoute = (route: string) => pathname === route;
  const visibleNav = NAV_ITEMS.filter(
    (n) => !n.adminOnly || user.role === "admin",
  );

  const roleLabel = (role: string) => {
    const roles: Record<string, string> = {
      admin: "Administrator",
      teacher: "Guru",
      superadmin: "Super Admin",
    };
    return roles[role] || "Pengguna";
  };

  const initials =
    (user.fullname || "?")
      .split(" ")
      .map((p) => p.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <>
      <header
        className="sticky top-0 z-40 backdrop-blur-md"
        style={{
          background:
            "color-mix(in oklch, var(--sipta-surface) 88%, transparent)",
          borderBottom: "1px solid var(--sipta-border)",
        }}
        data-testid="app-header"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Brand */}
          <Link
            href="/"
            className="flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sipta-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sipta-surface)] rounded-lg"
            data-testid="header-brand"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{
                background:
                  "linear-gradient(135deg, var(--sipta-primary), color-mix(in oklch, var(--sipta-accent) 55%, var(--sipta-primary)))",
                boxShadow:
                  "var(--shadow-sm), inset 0 0 0 1px rgba(255,255,255,0.12)",
                color: "var(--sipta-primary-fg)",
              }}
              aria-hidden="true"
            >
              <AcademicCapIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0 leading-tight">
              <div
                className="truncate text-sm font-semibold tracking-tight sm:text-base"
                style={{
                  color: "var(--sipta-foreground)",
                  fontFamily: "var(--font-display-family)",
                }}
              >
                {instance.type_institutions
                  ? `${instance.type_institutions.toUpperCase()} `
                  : "SIPTA "}
                {instance.name
                  ? instance.name.charAt(0).toUpperCase() +
                    instance.name.slice(1)
                  : "System"}
              </div>
              <div
                className="hidden text-[11px] sm:block"
                style={{ color: "var(--sipta-muted-fg)" }}
              >
                {academicYear.name
                  ? `T.A. ${academicYear.name} · ${academicYear.periode || "—"}`
                  : instance.description || "Sistem Manajemen Pendidikan"}
              </div>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Navigasi utama"
          >
            {visibleNav.map(({ href, label, Icon, testId }) => {
              const active = isActiveRoute(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className="group relative inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                  style={{
                    color: active
                      ? "var(--sipta-foreground)"
                      : "var(--sipta-muted-fg)",
                    background: active
                      ? "var(--sipta-surface-3)"
                      : "transparent",
                  }}
                  data-testid={testId}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span>{label}</span>
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-3 -bottom-[15px] h-0.5 rounded-full"
                      style={{ background: "var(--sipta-primary)" }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right cluster */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle />

            {/* Profile menu */}
            <div className="relative">
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sipta-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--sipta-surface)]"
                style={{
                  border: "1px solid var(--sipta-border)",
                  background: "var(--sipta-surface)",
                }}
                onClick={() => setIsProfileOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={isProfileOpen}
                data-testid="header-profile-button"
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-md text-[11px] font-semibold"
                  style={{
                    background: "var(--sipta-primary-subtle)",
                    color: "var(--sipta-primary)",
                  }}
                  aria-hidden="true"
                >
                  {initials}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span
                    className="block max-w-[120px] truncate text-xs font-semibold"
                    style={{ color: "var(--sipta-foreground)" }}
                  >
                    {user.fullname || "Guest"}
                  </span>
                  <span
                    className="block text-[10px]"
                    style={{ color: "var(--sipta-muted-fg)" }}
                  >
                    {roleLabel(user.role)}
                  </span>
                </span>
                <ChevronDownIcon
                  className={`h-4 w-4 transition-transform ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                  style={{ color: "var(--sipta-muted-fg)" }}
                  aria-hidden="true"
                />
              </button>

              {isProfileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-72 origin-top-right overflow-hidden rounded-xl animate-fade-in"
                  style={{
                    background: "var(--sipta-surface-elevated)",
                    border: "1px solid var(--sipta-border)",
                    boxShadow: "var(--shadow-lg)",
                  }}
                  data-testid="header-profile-menu"
                >
                  <div
                    className="p-4"
                    style={{ borderBottom: "1px solid var(--sipta-border)" }}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-semibold"
                        style={{
                          background: "var(--sipta-primary-subtle)",
                          color: "var(--sipta-primary)",
                        }}
                        aria-hidden="true"
                      >
                        {initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div
                          className="truncate text-sm font-semibold"
                          style={{ color: "var(--sipta-foreground)" }}
                        >
                          {user.fullname} {user.degree}
                        </div>
                        <div
                          className="truncate text-xs"
                          style={{ color: "var(--sipta-muted-fg)" }}
                        >
                          {user.email}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
                        style={{
                          background: "var(--sipta-primary-subtle)",
                          color: "var(--sipta-primary)",
                        }}
                      >
                        {roleLabel(user.role)}
                      </span>
                      {academicYear.name && (
                        <span
                          className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium tabular-nums"
                          style={{
                            background: "var(--sipta-surface-3)",
                            color: "var(--sipta-muted-fg)",
                          }}
                        >
                          T.A. {academicYear.name}
                          {academicYear.periode
                            ? ` · ${academicYear.periode}`
                            : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-1.5">
                    <Link
                      href="/profile"
                      role="menuitem"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm transition-colors"
                      style={{ color: "var(--sipta-foreground)" }}
                      data-testid="header-profile-link"
                    >
                      <UserCircleIcon className="h-5 w-5" aria-hidden="true" />
                      <span>Profil saya</span>
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogoutClick}
                      className="flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors"
                      style={{ color: "var(--sipta-destructive)" }}
                      data-testid="header-logout-button"
                    >
                      <ArrowRightOnRectangleIcon
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                      <span>Keluar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="ml-1 inline-flex h-9 w-9 items-center justify-center rounded-lg md:hidden transition-colors"
              style={{
                border: "1px solid var(--sipta-border)",
                color: "var(--sipta-foreground)",
                background: "var(--sipta-surface)",
              }}
              aria-label={mobileOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              data-testid="header-mobile-toggle"
            >
              {mobileOpen ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <Bars3Icon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <nav
            id="mobile-nav"
            className="md:hidden animate-fade-in"
            aria-label="Navigasi mobile"
            style={{
              background: "var(--sipta-surface)",
              borderTop: "1px solid var(--sipta-border)",
            }}
            data-testid="mobile-nav"
          >
            <ul className="mx-auto grid max-w-7xl gap-1 px-3 py-3 sm:px-4">
              {visibleNav.map(({ href, label, Icon, testId }) => {
                const active = isActiveRoute(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
                      style={{
                        color: active
                          ? "var(--sipta-foreground)"
                          : "var(--sipta-muted-fg)",
                        background: active
                          ? "var(--sipta-primary-subtle)"
                          : "transparent",
                      }}
                      data-testid={`mobile-${testId}`}
                    >
                      <Icon
                        className={
                          active
                            ? "h-5 w-5 text-[var(--sipta-primary)]"
                            : "h-5 w-5 text-[var(--sipta-muted-fg)]"
                        }
                      />
                      <span>{label}</span>
                      {active && (
                        <span
                          className="ml-auto h-1.5 w-1.5 rounded-full"
                          style={{ background: "var(--sipta-primary)" }}
                          aria-hidden="true"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {/* Overlay to close profile menu */}
        {isProfileOpen && (
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsProfileOpen(false)}
            aria-hidden="true"
          />
        )}
      </header>

      {confirmationDialog}
    </>
  );
}

export default HeaderComponent;
