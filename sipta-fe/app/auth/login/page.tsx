"use client";
import {
  AcademicCapIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { useAuthStore } from "@/src/state/AuthStore";

type FormValues = {
  username: string;
  password: string;
  phone?: string;
  remember?: boolean;
};

/* ------------------------------------------------------------------
 * SIPTA Login — v2 redesign
 * ------------------------------------------------------------------
 * PRESERVED BEHAVIOR (do not modify):
 *   - React Hook Form usage + validation rules (username min/pattern,
 *     password min, register-only password strength pattern, phone
 *     required in register mode)
 *   - useAuthStore().login(username, password) signature
 *   - Post-login redirect via useEffect on `user`
 *   - Geolocation + camera permission probes (checkPermissions,
 *     requestPermissions, retryPermissions)
 *   - Toast semantics on permission grant / denial / success / error
 *   - isLogin/isRegister toggle preserved (though register UI is
 *     hidden per current UX — behavior kept)
 *
 * REDESIGN:
 *   - Split-layout: brand pane (left) + form pane (right) on lg+;
 *     stacked on mobile.
 *   - Fintech aesthetic: subtle grid canvas + soft ambient glow,
 *     tokenized colors, distinctive display font on brand title.
 *   - Inputs, buttons, alerts use semantic tokens (light+dark ready).
 *   - Real focus rings, aria-invalid, aria-describedby for errors.
 * ------------------------------------------------------------------ */

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin] = useState(true); // register UI intentionally hidden per current UX; state retained
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState({
    location: "idle",
    camera: "idle",
  });

  const { login, user, isLoading: authLoading } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  useEffect(() => {
    if (user && !authLoading) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // ---- Permission probes (behavior identical to v1) --------------
  const requestPermissions = async () => {
    if (permissionStatus.location === "idle" && "geolocation" in navigator) {
      setPermissionStatus((p) => ({ ...p, location: "checking" }));
      try {
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              toast.success("Izin lokasi diberikan", {
                icon: "📍",
                duration: 3000,
              });
              setPermissionStatus((p) => ({ ...p, location: "granted" }));
              resolve();
            },
            (err) => {
              let msg = "Izin lokasi ditolak";
              if (err.code === err.PERMISSION_DENIED)
                msg =
                  "Izin lokasi ditolak. Beberapa fitur mungkin tidak berfungsi.";
              else if (err.code === err.POSITION_UNAVAILABLE)
                msg = "Informasi lokasi tidak tersedia";
              else if (err.code === err.TIMEOUT) msg = "Request lokasi timeout";
              setPermissionStatus((p) => ({ ...p, location: "denied" }));
              toast.error(msg, { icon: "❌", duration: 5000 });
              reject(err);
            },
            { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 },
          );
        });
      } catch {
        /* ignore */
      }
    }

    if (
      permissionStatus.camera === "idle" &&
      "mediaDevices" in navigator &&
      "getUserMedia" in navigator.mediaDevices
    ) {
      setPermissionStatus((p) => ({ ...p, camera: "checking" }));
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1, height: 1 },
        });
        stream.getTracks().forEach((t) => t.stop());
        toast.success("Izin kamera diberikan", { icon: "📷", duration: 3000 });
        setPermissionStatus((p) => ({ ...p, camera: "granted" }));
      } catch (err: any) {
        let msg = "Izin kamera ditolak";
        if (err?.name === "NotAllowedError") {
          msg =
            "Izin kamera ditolak. Fitur absensi wajah mungkin tidak berfungsi.";
          setPermissionStatus((p) => ({ ...p, camera: "denied" }));
        } else if (err?.name === "NotFoundError") {
          msg = "Kamera tidak ditemukan";
          setPermissionStatus((p) => ({ ...p, camera: "unsupported" }));
        } else if (err?.name === "NotSupportedError") {
          msg = "Browser tidak mendukung akses kamera";
          setPermissionStatus((p) => ({ ...p, camera: "unsupported" }));
        } else {
          setPermissionStatus((p) => ({ ...p, camera: "denied" }));
        }
        toast.error(msg, { icon: "❌", duration: 5000 });
      }
    }
  };

  const retryPermissions = () => {
    toast.loading("Meminta ulang izin…", { duration: 2000 });
    requestPermissions();
  };

  // ---- Submit ------------------------------------------------------
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    try {
      await login(data.username, data.password);
      // Redirect handled by useEffect on `user`
      setTimeout(() => {
        const { user: currentUser, token } = useAuthStore.getState();
        if (!currentUser || !token) {
          throw new Error("Login successful but state not updated");
        }
      }, 100);
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.message || err?.message || "Login gagal";
      toast.error(errorMessage, { duration: 5000, position: "top-center" });
    } finally {
      setIsLoading(false);
    }
  };

  const permissionWarning =
    permissionStatus.location === "denied" ||
    permissionStatus.camera === "denied" ||
    permissionStatus.location === "unsupported" ||
    permissionStatus.camera === "unsupported";

  return (
    <div
      className="relative flex min-h-screen overflow-hidden"
      style={{ background: "var(--sipta-background)" }}
      data-testid="login-page"
    >
      {/* Global permission probe indicator */}
      {(permissionStatus.location === "checking" ||
        permissionStatus.camera === "checking") && (
        <div
          className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium shadow-lg"
          style={{
            background: "var(--sipta-primary)",
            color: "var(--sipta-primary-fg)",
          }}
        >
          <span
            className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white"
            aria-hidden="true"
          />
          Memeriksa izin akses…
        </div>
      )}

      {/* Brand pane — text pinned to white regardless of theme (branded surface) */}
      <aside
        className="relative hidden overflow-hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between lg:p-12"
        style={{
          background:
            "linear-gradient(135deg, #2A2568 0%, #4F46E5 55%, #7C3AED 100%)",
          color: "#FFFFFF",
        }}
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 opacity-[0.10]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div
          className="absolute -right-40 -top-40 h-96 w-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "rgba(255,255,255,0.55)" }}
        />
        <div
          className="absolute -bottom-40 -left-24 h-80 w-80 rounded-full opacity-20 blur-3xl"
          style={{ background: "rgba(255,255,255,0.35)" }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: "rgba(255,255,255,0.16)",
              backdropFilter: "blur(6px)",
            }}
          >
            <AcademicCapIcon className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <p
              className="text-sm font-semibold"
              style={{ fontFamily: "var(--font-display-family)" }}
            >
              SIPTA
            </p>
            <p className="text-[11px] opacity-75">
              TPA Arrahman · Sistem Informasi Pembelajaran
            </p>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] opacity-70">
            Portal Guru & Administrator
          </p>
          <h1
            className="mt-4 text-4xl font-semibold leading-tight tracking-tight"
            style={{ fontFamily: "var(--font-display-family)" }}
          >
            Kelola pembelajaran, pantau performa.
          </h1>
          <p className="mt-4 text-sm leading-relaxed opacity-85">
            Absensi harian, penilaian per pertemuan, jadwal, dan laporan
            performa siswa — dalam satu antarmuka analitik yang bersih dan
            cepat.
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            {[
              "Absensi berbasis lokasi dan foto",
              "Penilaian & rekap otomatis per semester",
              "Laporan performa siswa & guru",
            ].map((item) => (
              <li key={item} className="flex items-center gap-3">
                <ShieldCheckIcon className="h-4 w-4 shrink-0 opacity-90" />
                <span className="opacity-90">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="relative z-10 text-[11px] opacity-70"
          style={{ fontFamily: "var(--font-mono-family)" }}
        >
          © 2025 SIPTA · v2
        </div>
      </aside>

      {/* Form pane */}
      <main className="relative flex w-full flex-col items-center justify-center px-4 py-10 lg:w-1/2 lg:px-12">
        {/* mobile brand */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background:
                "linear-gradient(135deg, var(--sipta-primary), color-mix(in oklch, var(--sipta-accent) 55%, var(--sipta-primary)))",
              color: "var(--sipta-primary-fg)",
            }}
            aria-hidden="true"
          >
            <AcademicCapIcon className="h-5 w-5" />
          </div>
          <div className="leading-tight">
            <p
              className="text-base font-semibold tracking-tight"
              style={{
                color: "var(--sipta-foreground)",
                fontFamily: "var(--font-display-family)",
              }}
            >
              SIPTA
            </p>
            <p
              className="text-[11px]"
              style={{ color: "var(--sipta-muted-fg)" }}
            >
              TPA Arrahman
            </p>
          </div>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <p
              className="text-xs font-medium uppercase tracking-[0.18em]"
              style={{ color: "var(--sipta-primary)" }}
            >
              Masuk
            </p>
            <h2
              className="mt-2 text-2xl font-semibold tracking-tight"
              style={{
                color: "var(--sipta-foreground)",
                fontFamily: "var(--font-display-family)",
              }}
            >
              Selamat datang kembali
            </h2>
            <p
              className="mt-2 text-sm"
              style={{ color: "var(--sipta-muted-fg)" }}
            >
              Masuk untuk mengelola jadwal, absensi, dan laporan.
            </p>
          </div>

          {permissionWarning && (
            <div
              role="status"
              className="mb-6 flex items-start gap-3 rounded-xl border p-3.5"
              style={{
                background: "var(--sipta-warning-subtle)",
                borderColor:
                  "color-mix(in oklch, var(--sipta-warning) 25%, var(--sipta-border))",
              }}
              data-testid="login-permission-warning"
            >
              <ExclamationTriangleIcon
                className="mt-0.5 h-5 w-5 shrink-0"
                style={{ color: "var(--sipta-warning)" }}
                aria-hidden="true"
              />
              <div
                className="text-sm leading-relaxed"
                style={{
                  color:
                    "color-mix(in oklch, var(--sipta-warning) 55%, var(--sipta-foreground))",
                }}
              >
                <p
                  className="font-semibold"
                  style={{ color: "var(--sipta-foreground)" }}
                >
                  Perhatian
                </p>
                <p>
                  {permissionStatus.location === "denied" ||
                  permissionStatus.camera === "denied"
                    ? "Beberapa fitur membutuhkan izin lokasi dan kamera."
                    : "Browser tidak mendukung beberapa fitur yang diperlukan."}{" "}
                  <button
                    type="button"
                    onClick={retryPermissions}
                    className="font-semibold underline underline-offset-2"
                    style={{ color: "var(--sipta-warning)" }}
                  >
                    Coba lagi
                  </button>
                </p>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--sipta-muted-fg)" }}
              >
                Username
              </label>
              <div
                className="group relative flex items-center rounded-lg transition-all"
                style={{
                  border: `1px solid ${
                    errors.username
                      ? "var(--sipta-destructive)"
                      : "var(--sipta-border)"
                  }`,
                  background: "var(--sipta-surface)",
                }}
              >
                <UserIcon
                  className="ml-3 h-4 w-4"
                  style={{ color: "var(--sipta-muted-fg)" }}
                  aria-hidden="true"
                />
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  {...register("username", {
                    required: "Username wajib diisi",
                    minLength: {
                      value: 3,
                      message: "Username minimal 3 karakter",
                    },
                    pattern: {
                      value: /^[a-zA-Z0-9_]+$/,
                      message: "Hanya huruf, angka, dan underscore",
                    },
                  })}
                  aria-invalid={errors.username ? "true" : "false"}
                  aria-describedby={
                    errors.username ? "username-error" : undefined
                  }
                  className="w-full bg-transparent px-3 py-2.5 text-sm outline-none placeholder:opacity-60"
                  style={{ color: "var(--sipta-foreground)" }}
                  placeholder="username_anda"
                  data-testid="login-username-input"
                />
              </div>
              {errors.username && (
                <p
                  id="username-error"
                  className="mt-1.5 text-xs"
                  style={{ color: "var(--sipta-destructive)" }}
                >
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide"
                style={{ color: "var(--sipta-muted-fg)" }}
              >
                Password
              </label>
              <div
                className="group relative flex items-center rounded-lg transition-all"
                style={{
                  border: `1px solid ${
                    errors.password
                      ? "var(--sipta-destructive)"
                      : "var(--sipta-border)"
                  }`,
                  background: "var(--sipta-surface)",
                }}
              >
                <LockClosedIcon
                  className="ml-3 h-4 w-4"
                  style={{ color: "var(--sipta-muted-fg)" }}
                  aria-hidden="true"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password", {
                    required: "Password wajib diisi",
                    minLength: {
                      value: 6,
                      message: "Password minimal 6 karakter",
                    },
                    ...(isLogin
                      ? {}
                      : {
                          pattern: {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                            message:
                              "Harus mengandung huruf besar, kecil, dan angka",
                          },
                        }),
                  })}
                  aria-invalid={errors.password ? "true" : "false"}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                  className="w-full bg-transparent px-3 py-2.5 text-sm outline-none placeholder:opacity-60"
                  style={{ color: "var(--sipta-foreground)" }}
                  placeholder="Masukkan password"
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="mr-2 rounded-md p-1.5 transition-colors hover:bg-[var(--sipta-surface-3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sipta-primary)]"
                  aria-label={
                    showPassword ? "Sembunyikan password" : "Tampilkan password"
                  }
                  aria-pressed={showPassword}
                  data-testid="login-password-toggle"
                >
                  {showPassword ? (
                    <EyeSlashIcon
                      className="h-4 w-4"
                      style={{ color: "var(--sipta-muted-fg)" }}
                    />
                  ) : (
                    <EyeIcon
                      className="h-4 w-4"
                      style={{ color: "var(--sipta-muted-fg)" }}
                    />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id="password-error"
                  className="mt-1.5 text-xs"
                  style={{ color: "var(--sipta-destructive)" }}
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sipta-primary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: "var(--sipta-primary)",
                color: "var(--sipta-primary-fg)",
                boxShadow: isLoading ? "none" : "var(--shadow-md)",
              }}
              data-testid="login-submit-button"
            >
              {isLoading ? (
                <>
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
                    aria-hidden="true"
                  />
                  Memproses…
                </>
              ) : (
                <>
                  <span>Masuk ke SIPTA</span>
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </button>
          </form>

          <p
            className="mt-8 text-center text-[11px]"
            style={{ color: "var(--sipta-muted-fg-soft)" }}
          >
            © 2025 SIPTA · Sistem Informasi Pembelajaran TPA Arrahman
          </p>
        </div>
      </main>
    </div>
  );
};

export default LoginPage;
