"use client";
import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import {
  MapPinIcon,
  CameraIcon,
  CheckCircleIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";
import Webcam from "react-webcam";
import MapView from "./MapView";
import { useScheduleStore } from "@/src/state/ScheduleStore";
import { useAuthStore } from "@/src/state/AuthStore";
import toast from "react-hot-toast";

interface AbsensiModalProps {
  isOpen: boolean;
  onClose: () => void;
  jadwal: any;
  absenType: "in" | "out";
}

const AbsensiModal: React.FC<AbsensiModalProps> = ({
  isOpen,
  onClose,
  jadwal,
  absenType,
}) => {
  const webcamRef = useRef<Webcam>(null);
  const [fotoAbsen, setFotoAbsen] = useState<string | null>(null);
  const [status, setStatus] = useState<"location" | "photo" | "success">(
    "location"
  );
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teacherAttendance = useScheduleStore((s) => s.teacherAttendance);
  const fetchSchedulesToday = useScheduleStore((s) => s.fetchSchedulesToday);
  const me = useAuthStore((s) => s.me);
  const {instance} = useAuthStore();

  // Get TPA location from user instance
  const tpaLocation = useMemo(() => {
    // console.log(instance)
    if (!instance) {
     toast.error('anda belum punya instance')
    }


    return {
      latitude: parseFloat(instance?.latitude),
      longitude: parseFloat(instance?.longitude),
      radius: 100,
    };
  }, [instance]);

  const institutionName = instance?.name || "TPA";

  const isCheckInClosed = useMemo(() => {
    if (absenType !== "in" || !jadwal?.start_time) {
      return false;
    }

    const start = new Date(`1970-01-01T${jadwal.start_time}`);
    const now = new Date(`1970-01-01T${new Date().toTimeString().slice(0, 8)}`);

    return now.getTime() >= start.getTime();
  }, [absenType, jadwal]);

  // Hitung jarak dari lokasi institusi
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number => {
    const R = 6371000; // Radius bumi dalam meter
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Ambil lokasi user
  const getLocation = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      setError("Browser tidak mendukung geolocation");
      setIsLoading(false);
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          });
        }
      );

      const userCoords = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      setCoords(userCoords);

      // Cek apakah dalam radius institusi
      const distance = calculateDistance(
        userCoords.latitude,
        userCoords.longitude,
        tpaLocation.latitude,
        tpaLocation.longitude
      );

      if (distance > tpaLocation.radius) {
        setError(
          `Anda berada ${distance.toFixed(
            0
          )}m dari ${institutionName}. Silakan mendekat ke lokasi.`
        );
      }
    } catch (error: any) {
      switch (error.code) {
        case 1:
          setError("Izin lokasi ditolak. Aktifkan di pengaturan browser.");
          break;
        case 2:
          setError("Lokasi tidak dapat ditemukan. Pastikan GPS aktif.");
          break;
        case 3:
          setError("Waktu permintaan habis. Coba lagi.");
          break;
        default:
          setError("Gagal mendapatkan lokasi.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [tpaLocation, institutionName]);

  // Ambil foto
  const takePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setFotoAbsen(imageSrc);
      setStatus("success");
    }
  }, []);

  // Konfirmasi absensi
  const confirmAbsensi = () => {
    if (absenType === "in" && isCheckInClosed) {
      toast.error("Absensi sudah ditutup karena jam pelajaran telah dimulai.");
      return;
    }

    if (fotoAbsen && jadwal && coords) {
      teacherAttendance({
        schedule_id: jadwal.id,
        type: absenType === "in" ? "check_in" : "check_out",
        latitude: coords.latitude,
        longitude: coords.longitude,
        real_time_photo: fotoAbsen,
      })
        .then((resp: any) => {
          toast.success(resp.message);
          resetModal();

          fetchSchedulesToday().catch((err: any) => {
            toast.error(err.message);
          });
        })
        .catch((err: any) => {
          toast.error(err.message);
        });
    }
  };

  // Reset modal
  const resetModal = () => {
    setFotoAbsen(null);
    setStatus("location");
    setCoords(null);
    setError(null);
    onClose();
  };

  // Ambil ulang foto
  const retakePhoto = () => {
    setFotoAbsen(null);
    setStatus("photo");
  };

  // Constraints untuk webcam
  const videoConstraints = {
    width: 400,
    height: 400,
    facingMode: "user" as const,
  };

  useEffect(() => {
    if (isOpen) {
      getLocation();
    }
  }, [isOpen, getLocation]);

  if (!isOpen || !jadwal) return null;

  const distanceFromInstitution = coords
    ? calculateDistance(
        coords.latitude,
        coords.longitude,
        tpaLocation.latitude,
        tpaLocation.longitude
      )
    : null;

  const isInLocation = distanceFromInstitution
    ? distanceFromInstitution <= tpaLocation.radius
    : false;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-bold text-gray-800">
            Absensi {absenType === "in" ? "Masuk" : "Keluar"}
          </h3>
        </div>

        <div className="p-4">
          {/* Step 1: Cek Lokasi */}
          {status === "location" && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MapPinIcon className="h-8 w-8 text-blue-600" />
                </div>
                <h4 className="font-bold text-gray-800 mb-2">
                  Cek Lokasi Anda
                </h4>
                <p className="text-gray-600 text-sm">
                  Pastikan Anda berada di lokasi {institutionName} untuk absensi
                </p>
              </div>

              {/* Status Lokasi */}
              <div
                className={`p-3 rounded-lg border ${
                  error
                    ? "bg-red-50 border-red-200"
                    : isInLocation
                    ? "bg-green-50 border-green-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <div className="flex items-center gap-3">
                  {isLoading ? (
                    <>
                      <ArrowPathIcon className="h-5 w-5 text-blue-600 animate-spin" />
                      <span className="text-sm">Mendeteksi lokasi...</span>
                    </>
                  ) : error ? (
                    <>
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-red-700 text-sm font-medium">
                          Lokasi Tidak Sesuai
                        </p>
                        <p className="text-red-600 text-xs">{error}</p>
                      </div>
                    </>
                  ) : isInLocation ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-green-700 text-sm font-medium">
                          Lokasi Sesuai
                        </p>
                        <p className="text-green-600 text-xs">
                          Anda berada {distanceFromInstitution?.toFixed(0)}m
                          dari {institutionName}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="text-yellow-700 text-sm font-medium">
                          Periksa Lokasi
                        </p>
                        <p className="text-yellow-600 text-xs">
                          {distanceFromInstitution
                            ? `Anda ${distanceFromInstitution.toFixed(
                                0
                              )}m dari ${institutionName}`
                            : "Lokasi tidak terdeteksi"}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <MapView userCoords={coords} tpaLocation={tpaLocation} />

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={getLocation}
                  disabled={isLoading}
                  className="flex-1 py-2 px-4 bg-gray-500 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  <div className="flex items-center justify-center gap-2">
                    <ArrowPathIcon
                      className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                    />
                    Refresh Lokasi
                  </div>
                </button>
                <button
                  onClick={() => setStatus("photo")}
                  disabled={!isInLocation && !error}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                    isInLocation || error
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Lanjutkan
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Ambil Foto */}
          {status === "photo" && !fotoAbsen && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CameraIcon className="h-8 w-8 text-purple-600" />
                </div>
                <h4 className="font-bold text-gray-800 mb-2">Ambil Foto</h4>
                <p className="text-gray-600 text-sm">
                  Pastikan wajah terlihat jelas
                </p>
              </div>

              {/* Webcam */}
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={videoConstraints}
                  className="w-full h-auto"
                />
              </div>

              <button
                onClick={takePhoto}
                className="w-full py-3 bg-purple-500 text-white rounded-lg font-bold hover:bg-purple-600"
              >
                <div className="flex items-center justify-center gap-2">
                  <PhotoIcon className="h-5 w-5" />
                  Ambil Foto
                </div>
              </button>
            </div>
          )}

          {/* Step 3: Konfirmasi */}
          {(status === "photo" && fotoAbsen) || status === "success" ? (
            <div className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 z-50">
                  <CheckCircleIcon className="h-8 w-8 text-green-600" />
                </div>
                <h4 className="font-bold text-gray-800 mb-2">
                  Konfirmasi Absensi
                </h4>
                <p className="text-gray-600 text-sm">
                  Periksa foto dan konfirmasi
                </p>
              </div>

              {/* Foto Preview */}
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                <img
                  src={fotoAbsen!}
                  alt="Foto absensi"
                  className="w-full h-auto"
                />
              </div>

              {/* Info Lokasi */}
              {coords && (
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-blue-700 text-sm">
                    📍 {distanceFromInstitution?.toFixed(0)}m dari{" "}
                    {institutionName} • Akurasi {coords.accuracy.toFixed(0)}m
                  </p>
                </div>
              )}

              {absenType === "in" && isCheckInClosed && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 text-center">
                  Absensi sudah ditutup karena jam pelajaran telah dimulai.
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={retakePhoto}
                  className="flex-1 py-2 px-4 bg-gray-500 text-white rounded-lg font-medium"
                >
                  Ambil Ulang
                </button>
                <button
                  onClick={confirmAbsensi}
                  disabled={absenType === "in" && isCheckInClosed}
                  className={`flex-1 py-2 px-4 rounded-lg font-bold ${
                    absenType === "in" && isCheckInClosed
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  Konfirmasi
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AbsensiModal;
