"use client";
import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/src/state/AuthStore";
import toast from "react-hot-toast";

type FormValues = {
  username: string;
  password: string;
  phone?: string;
  remember?: boolean;
};

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState({
    location: "idle", // 'idle', 'checking', 'granted', 'denied', 'unsupported'
    camera: "idle",
  });
  const [permissionsChecked, setPermissionsChecked] = useState(false);

  const { login, user, error, isLoading: authLoading } = useAuthStore();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>();

  useEffect(() => {
    // Hanya redirect jika user ada (login berhasil) DAN tidak sedang loading
    if (user && !authLoading) {
      // console.log("✅ Login successful, redirecting...");
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Function hanya untuk mengecek status permission tanpa meminta
  const checkPermissions = async () => {
    setPermissionsChecked(true);

    // Check location permission status
    setPermissionStatus((prev) => ({ ...prev, location: "checking" }));
    if ("geolocation" in navigator) {
      // Untuk geolocation, kita tidak bisa langsung check status tanpa mencoba
      // Jadi kita set sebagai idle dulu, nanti akan dicek saat diperlukan
      setPermissionStatus((prev) => ({ ...prev, location: "idle" }));
    } else {
      setPermissionStatus((prev) => ({ ...prev, location: "unsupported" }));
    }

    // Check camera permission status
    setPermissionStatus((prev) => ({ ...prev, camera: "checking" }));
    if (
      "mediaDevices" in navigator &&
      "getUserMedia" in navigator.mediaDevices
    ) {
      try {
        // Coba akses camera devices list untuk check permission tanpa meminta
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(
          (device) => device.kind === "videoinput"
        );

        if (videoDevices.length === 0) {
          setPermissionStatus((prev) => ({ ...prev, camera: "unsupported" }));
        } else {
          // Untuk camera, kita tidak bisa langsung check status tanpa mencoba
          setPermissionStatus((prev) => ({ ...prev, camera: "idle" }));
        }
      } catch (err) {
        setPermissionStatus((prev) => ({ ...prev, camera: "unsupported" }));
      }
    } else {
      setPermissionStatus((prev) => ({ ...prev, camera: "unsupported" }));
    }
  };

  // Function untuk meminta permission hanya ketika diperlukan
  const requestPermissions = async () => {
    // Hanya minta location jika belum granted dan supported
    if (permissionStatus.location === "idle" && "geolocation" in navigator) {
      setPermissionStatus((prev) => ({ ...prev, location: "checking" }));

      try {
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              toast.success("Izin lokasi diberikan", {
                icon: "📍",
                duration: 3000,
              });
              setPermissionStatus((prev) => ({ ...prev, location: "granted" }));
              resolve();
            },
            (error) => {
              let message = "Izin lokasi ditolak";
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  message =
                    "Izin lokasi ditolak. Beberapa fitur mungkin tidak berfungsi.";
                  setPermissionStatus((prev) => ({
                    ...prev,
                    location: "denied",
                  }));
                  break;
                case error.POSITION_UNAVAILABLE:
                  message = "Informasi lokasi tidak tersedia";
                  setPermissionStatus((prev) => ({
                    ...prev,
                    location: "denied",
                  }));
                  break;
                case error.TIMEOUT:
                  message = "Request lokasi timeout";
                  setPermissionStatus((prev) => ({
                    ...prev,
                    location: "denied",
                  }));
                  break;
              }
              toast.error(message, {
                icon: "❌",
                duration: 5000,
              });
              reject(error);
            },
            {
              enableHighAccuracy: false, // Tidak perlu high accuracy untuk permission check
              timeout: 5000, // Timeout lebih pendek
              maximumAge: 300000, // 5 minutes
            }
          );
        });
      } catch (err) {
        // console.warn("Gagal mendapatkan lokasi:", err);
      }
    }

    // Hanya minta camera jika belum granted dan supported
    if (
      permissionStatus.camera === "idle" &&
      "mediaDevices" in navigator &&
      "getUserMedia" in navigator.mediaDevices
    ) {
      setPermissionStatus((prev) => ({ ...prev, camera: "checking" }));

      try {
        // Gunakan constraint yang lebih minimal untuk permission check
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1, height: 1 }, // Resolution minimal
        });

        // Segera stop stream setelah dapat permission
        stream.getTracks().forEach((track) => track.stop());

        toast.success("Izin kamera diberikan", {
          icon: "📷",
          duration: 3000,
        });
        setPermissionStatus((prev) => ({ ...prev, camera: "granted" }));
      } catch (err: any) {
        let message = "Izin kamera ditolak";
        if (err.name === "NotAllowedError") {
          message =
            "Izin kamera ditolak. Fitur absensi wajah mungkin tidak berfungsi.";
          setPermissionStatus((prev) => ({ ...prev, camera: "denied" }));
        } else if (err.name === "NotFoundError") {
          message = "Kamera tidak ditemukan";
          setPermissionStatus((prev) => ({ ...prev, camera: "unsupported" }));
        } else if (err.name === "NotSupportedError") {
          message = "Browser tidak mendukung akses kamera";
          setPermissionStatus((prev) => ({ ...prev, camera: "unsupported" }));
        } else {
          setPermissionStatus((prev) => ({ ...prev, camera: "denied" }));
        }

        toast.error(message, {
          icon: "❌",
          duration: 5000,
        });
      }
    }
  };

  // Function untuk manual retry permissions
  const retryPermissions = () => {
    toast.loading("Meminta ulang izin...", {
      duration: 2000,
    });
    requestPermissions();
  };

  // LoginPage - GANTI onSubmit function dengan ini
  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    // console.log("🟡 FORM SUBMITTED:", data);
    setIsLoading(true);

    try {
      if (isLogin) {
        // console.log("🟡 CALLING LOGIN FUNCTION...");
        await login(data.username, data.password);

        // JANGAN langsung toast success di sini
        // Biarkan useEffect yang handle redirect berdasarkan user state

        // console.log("🟡 LOGIN SUCCESS - Waiting for state update");

        // Cek state setelah login
        setTimeout(() => {
          const { user: currentUser, token } = useAuthStore.getState();
          // console.log("🟡 STATE AFTER LOGIN:", {
          //   user: currentUser,
          //   token: token?.substring(0, 10) + "...",
          // });

          if (!currentUser || !token) {
            console.error("❌ STATE NOT UPDATED AFTER LOGIN");
            // Error akan ditangani oleh catch block
            throw new Error("Login successful but state not updated");
          }
        }, 100);
      } else {
        // console.log("Register:", data);
      }
    } catch (err: any) {
      console.error("❌ Login error:", err);
      const errorMessage =
        err.response?.data?.message || err.message || "Login failed";

      // TAMPILKAN ERROR TOAST - ini yang tidak muncul karena looping
      toast.error(errorMessage, {
        duration: 5000,
        position: "top-center",
      });
    } finally {
      // console.log("🟡 FINALLY - SET LOADING FALSE");
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-500"></div>
      </div>

      {/* Permission Status Indicator */}
      {(permissionStatus.location === "checking" ||
        permissionStatus.camera === "checking") && (
        <div className="fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center space-x-2">
          <svg
            className="animate-spin h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Memeriksa izin akses...</span>
        </div>
      )}

      <div className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>

          <div className="relative z-10 flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                SIPTA System
              </h1>
              <p className="text-blue-100 mt-1 text-sm opacity-90">
                {isLogin
                  ? " Sistem Informasi Pembelajaran TPA Arrahman"
                  : "Daftar Akun Baru"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Permission Warning - hanya tampil jika ada permission yang ditolak/tidak supported */}
          {(permissionStatus.location === "denied" ||
            permissionStatus.camera === "denied" ||
            permissionStatus.location === "unsupported" ||
            permissionStatus.camera === "unsupported") && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-yellow-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-yellow-800">
                    Perhatian
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    {permissionStatus.location === "denied" ||
                    permissionStatus.camera === "denied"
                      ? "Beberapa fitur membutuhkan izin lokasi dan kamera."
                      : "Browser tidak mendukung beberapa fitur yang diperlukan."}
                    <button
                      onClick={retryPermissions}
                      className="ml-1 underline font-medium hover:text-yellow-900"
                    >
                      Coba lagi
                    </button>
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Username Field */}
            <div className="space-y-3">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-emerald-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Username
              </label>
              <input
                type="text"
                {...register("username", {
                  required: "Username wajib diisi",
                  minLength: {
                    value: 3,
                    message: "Username minimal 3 karakter",
                  },
                  pattern: {
                    value: /^[a-zA-Z0-9_]+$/,
                    message:
                      "Username hanya boleh mengandung huruf, angka, dan underscore",
                  },
                })}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:outline-none transition-all ${
                  errors.username
                    ? "border-red-400 focus:ring-red-100 bg-red-50"
                    : "border-gray-200 focus:ring-emerald-100 focus:border-emerald-500 hover:border-gray-300"
                }`}
                placeholder="Masukkan username Anda"
              />
              {errors.username && (
                <p className="text-red-500 text-sm flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {errors.username.message}
                </p>
              )}
            </div>

            {/* Phone Number (Register Only) */}
            {!isLogin && (
              <div className="space-y-3">
                <label className="flex items-center text-sm font-semibold text-gray-700">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  {...register("phone", {
                    required: "Nomor telepon wajib diisi",
                    pattern: {
                      value: /^[0-9+\-\s()]*$/,
                      message: "Format nomor telepon tidak valid",
                    },
                  })}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:outline-none transition-all ${
                    errors.phone
                      ? "border-red-400 focus:ring-red-100 bg-red-50"
                      : "border-gray-200 focus:ring-blue-100 focus:border-blue-500 hover:border-gray-300"
                  }`}
                  placeholder="+62 812 3456 7890"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {errors.phone.message}
                  </p>
                )}
              </div>
            )}

            {/* Password Field */}
            <div className="space-y-3 relative">
              <label className="flex items-center text-sm font-semibold text-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-purple-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
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
                className={`w-full px-4 py-3 border-2 rounded-xl focus:ring-2 focus:outline-none transition-all pr-12 ${
                  errors.password
                    ? "border-red-400 focus:ring-red-100 bg-red-50"
                    : "border-gray-200 focus:ring-purple-100 focus:border-purple-500 hover:border-gray-300"
                }`}
                placeholder={
                  isLogin ? "Masukkan password Anda" : "Buat password yang kuat"
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-11 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
              {errors.password && (
                <p className="text-red-500 text-sm flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-4 px-6 rounded-xl font-bold text-white transition-all duration-300 ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>{isLogin ? "Masuk..." : "Membuat Akun..."}</span>
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d={
                          isLogin
                            ? "M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                            : "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                        }
                      />
                    </svg>
                    <span>
                      {isLogin ? "Masuk ke Sistem" : "Buat Akun Baru"}
                    </span>
                  </>
                )}
              </div>
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="bg-gray-50/80 border-t border-gray-200/50 p-4 text-center">
          <p className="text-xs text-gray-500">
            © 2025 SIPTA System • Sistem Informasi Pembelajaran TPA Arrahman
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
