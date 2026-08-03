import React, { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(() => import("react-leaflet").then((m) => m.Marker), {
  ssr: false,
});
const Popup = dynamic(() => import("react-leaflet").then((m) => m.Popup), {
  ssr: false,
});

interface InstanceSectionProps {
  instance: any;
  isAdmin: boolean;
  profileData: any;
  updateInstance: (data: any) => Promise<any>;
  getMe: () => Promise<void>;
  L: any;
  markerIcon: any;
  formatInstitutionType: (type: string) => string;
}

interface InstanceFormData {
  instance_name: string;
  instance_type: string;
  latitude: string;
  longitude: string;
}

const InstanceSection: React.FC<InstanceSectionProps> = ({
  instance,
  isAdmin,
  profileData,
  updateInstance,
  getMe,
  L,
  markerIcon,
  formatInstitutionType,
}) => {
  // State management untuk Instance Section
  const [isEditingInstance, setIsEditingInstance] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [instanceForm, setInstanceForm] = useState<InstanceFormData>({
    instance_name: "",
    instance_type: "",
    latitude: "",
    longitude: "",
  });

  // Initialize form data when instance data is available
  useEffect(() => {
    if (instance) {
      setInstanceForm({
        instance_name: instance.name || "",
        instance_type: instance.type_institutions || "",
        latitude: instance.latitude || "",
        longitude: instance.longitude || "",
      });
    }
  }, [instance]);

  // Center position untuk map
  const centerPosition = useMemo((): [number, number] => {
    if (instanceForm.latitude && instanceForm.longitude) {
      const lat = parseFloat(instanceForm.latitude);
      const lng = parseFloat(instanceForm.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }
    // Default position (Jakarta)
    return [-6.2088, 106.8456];
  }, [instanceForm.latitude, instanceForm.longitude]);

  // Marker position
  const markerPosition = useMemo((): [number, number] => {
    return centerPosition;
  }, [centerPosition]);

  // Handler untuk toggle edit mode
  const handleEditToggle = () => {
    if (isEditingInstance) {
      // Reset form data ketika batal edit
      setInstanceForm({
        instance_name: instance.name || "",
        instance_type: instance.type_institutions || "",
        latitude: instance.latitude || "",
        longitude: instance.longitude || "",
      });
    }
    setIsEditingInstance(!isEditingInstance);
  };

  // Handler untuk input change
  const handleInputChange = (field: keyof InstanceFormData, value: string) => {
    setInstanceForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handler untuk ketika map diklik (hanya saat edit mode dan admin)
  const handleMapClick = (e: any) => {
    if (isEditingInstance && isAdmin) {
      const { lat, lng } = e.latlng;
      setInstanceForm((prev) => ({
        ...prev,
        latitude: lat.toString(),
        longitude: lng.toString(),
      }));
    }
  };

  // Handler untuk mendapatkan lokasi saat ini
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation tidak didukung oleh browser ini");
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setInstanceForm((prev) => ({
          ...prev,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        }));
        setIsGettingLocation(false);
        toast.success("Lokasi berhasil diperoleh");
      },
      (error) => {
        console.error("Error getting location:", error);
        let errorMessage = "Gagal mendapatkan lokasi";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Akses lokasi ditolak. Izinkan akses lokasi di browser Anda.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Informasi lokasi tidak tersedia.";
            break;
          case error.TIMEOUT:
            errorMessage = "Permintaan lokasi timeout.";
            break;
          default:
            errorMessage = "Terjadi kesalahan saat mengambil lokasi.";
        }

        toast.error(errorMessage);
        setIsGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  // Validasi koordinat
  const validateCoordinates = (): boolean => {
    if (instanceForm.latitude && instanceForm.longitude) {
      const lat = parseFloat(instanceForm.latitude);
      const lng = parseFloat(instanceForm.longitude);

      if (isNaN(lat) || isNaN(lng)) {
        toast.error("Format latitude dan longitude harus angka");
        return false;
      }

      if (lat < -90 || lat > 90) {
        toast.error("Latitude harus antara -90 dan 90");
        return false;
      }

      if (lng < -180 || lng > 180) {
        toast.error("Longitude harus antara -180 dan 180");
        return false;
      }
    }
    return true;
  };

  // Handler untuk submit form
  const handleSubmit = async () => {
    if (!validateCoordinates()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const instanceUpdateData = {
        name: instanceForm.instance_name,
        type_institutions: instanceForm.instance_type,
        latitude: instanceForm.latitude,
        longitude: instanceForm.longitude,
      };

      // console.log("Updating instance:", instanceUpdateData);
      const resp: any = await updateInstance(instanceUpdateData);

      if (resp.success) {
        toast.success("Instance berhasil diperbarui");
        setIsEditingInstance(false);

        // Refresh data dan update localStorage
        await getMe();
      }
    } catch (error: any) {
      console.error("Error updating instance:", error);
      toast.error(
        error.message ||
          error.response?.data?.message ||
          "Gagal mengupdate instance"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler untuk cancel edit
  const handleCancel = () => {
    // Reset ke data asli
    setInstanceForm({
      instance_name: instance.name || "",
      instance_type: instance.type_institutions || "",
      latitude: instance.latitude || "",
      longitude: instance.longitude || "",
    });
    setIsEditingInstance(false);
  };

  // Format koordinat untuk tampilan
  const formatCoordinate = (coord: string) => {
    if (!coord) return "-";
    return parseFloat(coord).toFixed(6);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 mt-6 border border-gray-100">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Informasi Institusi
        </h2>
        {isAdmin && (
          <button
            onClick={handleEditToggle}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            {isEditingInstance ? "Batal" : "Edit"}
          </button>
        )}
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">
                Nama Institusi
              </label>
              {isEditingInstance && isAdmin ? (
                <input
                  type="text"
                  value={instanceForm.instance_name}
                  onChange={(e) =>
                    handleInputChange("instance_name", e.target.value)
                  }
                  className="text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 w-full"
                  placeholder="Nama institusi"
                />
              ) : (
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-4 py-3">
                  {instance.name}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">
                Jenis Institusi
              </label>
              {isEditingInstance && isAdmin ? (
                <select
                  value={instanceForm.instance_type}
                  onChange={(e) =>
                    handleInputChange("instance_type", e.target.value)
                  }
                  className="text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 w-full"
                >
                  <option value="">Pilih Jenis Institusi</option>
                  <option value="tpa">TPA</option>
                  <option value="tka">TKA</option>
                  <option value="madrasah">Madrasah</option>
                </select>
              ) : (
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-4 py-3">
                  {formatInstitutionType(instance.type_institutions)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Map Container - Tetap tampil untuk melihat lokasi */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-gray-500">
              Lokasi Institusi
            </label>
            {/* Tombol Get Current Location - Hanya tampil saat edit mode dan admin */}
            {isEditingInstance && isAdmin && (
              <button
                type="button"
                onClick={handleGetCurrentLocation}
                disabled={isGettingLocation}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 disabled:opacity-50"
              >
                {isGettingLocation ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Mendapatkan lokasi...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Gunakan Lokasi Saat Ini
                  </>
                )}
              </button>
            )}
          </div>

          {/* Informasi koordinat saat edit mode */}
          {isEditingInstance && isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">
                  Latitude
                </label>
                <input
                  type="text"
                  value={instanceForm.latitude}
                  onChange={(e) =>
                    handleInputChange("latitude", e.target.value)
                  }
                  className="text-xs text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 w-full"
                  placeholder="Latitude"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">
                  Longitude
                </label>
                <input
                  type="text"
                  value={instanceForm.longitude}
                  onChange={(e) =>
                    handleInputChange("longitude", e.target.value)
                  }
                  className="text-xs text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-2 w-full"
                  placeholder="Longitude"
                />
              </div>
            </div>
          )}

          <div className="h-64 w-full rounded-lg border border-gray-300 z-0 relative">
            {L && (
              <MapContainer
                center={centerPosition}
                zoom={15}
                className="h-full w-full"
                style={{ height: "100%", width: "100%", zIndex: 0 }}
                // onClick={handleMapClick}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={markerPosition} icon={markerIcon!}>
                  <Popup>
                    Lokasi Institusi
                    <br />
                    {instance.name}
                    <br />
                    {isEditingInstance && isAdmin && (
                      <>
                        <small>Klik pada peta untuk mengubah lokasi</small>
                        <br />
                      </>
                    )}
                    Lat:{" "}
                    {formatCoordinate(
                      instanceForm.latitude || instance.latitude
                    )}
                    <br />
                    Lng:{" "}
                    {formatCoordinate(
                      instanceForm.longitude || instance.longitude
                    )}
                  </Popup>
                </Marker>
              </MapContainer>
            )}

            {/* Overlay info untuk edit mode */}
            {isEditingInstance && isAdmin && (
              <div className="absolute top-2 left-2 right-2 bg-blue-600 text-white text-xs p-2 rounded-lg shadow-lg z-10">
                <div className="flex items-center gap-1">
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Klik pada peta untuk mengubah lokasi institusi
                </div>
              </div>
            )}
          </div>

          {/* Petunjuk penggunaan */}
          {isEditingInstance && isAdmin && (
            <div className="mt-2 text-xs text-gray-500 space-y-1">
              <p>• Klik pada peta untuk memilih lokasi manual</p>
              <p>• Atau gunakan tombol "Gunakan Lokasi Saat Ini" di atas</p>
              <p>• Pastikan koordinat sudah sesuai sebelum menyimpan</p>
            </div>
          )}
        </div>

        {isEditingInstance && isAdmin && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm font-medium"
            >
              Batal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstanceSection;
