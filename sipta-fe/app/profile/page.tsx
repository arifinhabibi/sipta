"use client";
import React, { useEffect, useState, useMemo } from "react";
import HeaderComponent from "../components/HeaderComponent";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useAuthStore } from "@/src/state/AuthStore";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import InstanceSection from "../components/profiles/InstanceSection";
import AcademicYearSection from "../components/profiles/AcademicYearSection";
import ClassroomSection from "../components/profiles/ClassroomSection";
import SystemsInformation from "../components/profiles/SystemsInformation";
import AccountSetting from "../components/profiles/AccountSetting";
import ProfileSection from "../components/profiles/ProfileSection";
import { AcademicYear, EditData, PasswordData } from "./utils";
import { useAcademicYearStore } from "@/src/state/AcademicYearStore";

// Dynamically import komponen react-leaflet
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

function ProfilePage() {
  const {
    me: profileData,
    isLoading,
    error,
    getMe,
    changePassword,
    updateInstance,
    updateProfile,
  } = useAuthStore();

  const {
    academicYears,
    loading: isLoadingAcademicYears,
    fetchAcademicYears,
  } = useAcademicYearStore();

  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [editData, setEditData] = useState<EditData>({
    username: "",
    full_name: "",
    gender: "",
    birth_date: "",
    phone: "",
    address: "",
    degree: "",
    instance_name: "",
    instance_type: "",
    latitude: "",
    longitude: "",
  });
  const [passwordData, setPasswordData] = useState<PasswordData>({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");

  // Deklarasi isAdmin di sini agar bisa digunakan di useEffect
  const isAdmin = profileData?.role === "admin";

  // Load Leaflet hanya di client side
  const L = useMemo(() => {
    if (typeof window !== "undefined") {
      return require("leaflet");
    }
    return null;
  }, []);

  // Fix untuk marker icons
  const markerIcon = useMemo(() => {
    if (!L) return null;

    // Fix for default markers in Leaflet
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });

    return L.icon({
      iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });
  }, [L]);

  useEffect(() => {
    if (!profileData) {
      getMe();
    }
  }, [profileData, getMe]);

  // Initialize edit data when profile data is available
  useEffect(() => {
    if (profileData?.teacher) {
      setEditData({
        username: profileData.username || "",
        full_name: profileData.teacher.full_name || "",
        gender: profileData.teacher.gender || "",
        birth_date: profileData.teacher.birth_date
          ? profileData.teacher.birth_date.split("T")[0]
          : "",
        phone: profileData.teacher.phone || "",
        address: profileData.teacher.address || "",
        degree: profileData.teacher.degree || "",
        instance_name: profileData.teacher.instance?.name || "",
        instance_type: profileData.teacher.instance?.type_institutions || "",
        latitude: profileData.teacher.instance?.latitude || "",
        longitude: profileData.teacher.instance?.longitude || "",
      });
    }
  }, [profileData]);

  // Load academic years data untuk admin
  useEffect(() => {
    if (isAdmin) {
      fetchAcademicYears();
    }
  }, [isAdmin, fetchAcademicYears]);

  // Format tanggal lahir
  const formatBirthDate = (dateString: any) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Format gender
  const formatGender = (gender: string) => {
    if (!gender) return "-";
    return gender === "female" ? "Perempuan" : "Laki-laki";
  };

  // Format role
  const formatRole = (role: string) => {
    if (!role) return "-";
    return role === "admin"
      ? "Administrator"
      : role === "teacher"
      ? "Guru"
      : role;
  };

  // Format institution type
  const formatInstitutionType = (type: string) => {
    if (!type) return "-";
    const types: { [key: string]: string } = {
      tpa: "TPA",
      tka: "TKA",
      madrasah: "Madrasah",
    };
    return types[type] || type.toUpperCase();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validasi file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setSubmitError("Format file harus JPG, JPEG, atau PNG");
        return;
      }

      // Validasi file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setSubmitError("Ukuran file maksimal 2MB");
        return;
      }

      setPhotoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditToggle = (
    section: "personal" | "contact" | "instance" | "password"
  ) => {
    if (section === "personal") {
      setIsEditingPersonal(!isEditingPersonal);
      // Reset photo preview jika batal edit
      if (isEditingPersonal) {
        setPhotoFile(null);
        setPhotoPreview("");
      }
    } else if (section === "contact") {
      setIsEditingContact(!isEditingContact);
    } else if (section === "password") {
      setIsChangingPassword(!isChangingPassword);
      // Reset password form
      if (isChangingPassword) {
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });
      }
    }
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const handleInputChange = (field: keyof EditData, value: string) => {
    setEditData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePasswordChange = (field: keyof PasswordData, value: string) => {
    setPasswordData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validatePassword = (): boolean => {
    if (passwordData.new_password.length < 6) {
      setSubmitError("Password baru harus minimal 6 karakter");
      toast.error("Password baru harus minimal 6 karakter");
      return false;
    }

    if (passwordData.new_password !== passwordData.confirm_password) {
      setSubmitError("Password baru dan konfirmasi password tidak cocok");
      toast.error("Password baru dan konfirmasi password tidak cocok");
      return false;
    }

    return true;
  };

  const handlePasswordSubmit = async (e: any) => {
    e.preventDefault();
    if (!validatePassword()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const resp: any = await changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });

      if (resp.success) {
        toast.success(resp.message);
        setSubmitSuccess(true);
        setPasswordData({
          current_password: "",
          new_password: "",
          confirm_password: "",
        });

        setTimeout(() => {
          setIsChangingPassword(false);
          setSubmitSuccess(false);
        }, 3000);
      }
    } catch (error: any) {
      toast.error(error.message);
      setSubmitError(error.message || "Gagal mengubah password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (section: "personal" | "contact") => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      if (section === "personal" || section === "contact") {
        // Update profile data untuk personal dan contact
        const profileUpdateData = {
          username: editData.username,
          teacher: {
            full_name: editData.full_name,
            gender: editData.gender,
            birth_date: editData.birth_date,
            phone: editData.phone,
            address: editData.address,
            degree: editData.degree,
          },
        };

        // console.log("Updating profile:", profileUpdateData);
        const resp: any = await updateProfile(profileUpdateData);

        if (resp.success) {
          toast.success("Profile berhasil diperbarui");
          setSubmitSuccess(true);

          if (section === "personal") {
            setIsEditingPersonal(false);
            setPhotoFile(null);
            setPhotoPreview("");
          }
          if (section === "contact") {
            setIsEditingContact(false);
          }

          // Refresh data dan update localStorage
          await getMe();
        }
      }
    } catch (error: any) {
      console.error("Error updating:", error);
      setSubmitError(
        error.message ||
          error.response?.data?.message ||
          "Gagal mengupdate profil"
      );
      toast.error(error.message || "Gagal mengupdate profil");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = (
    section: "personal" | "contact" | "instance" | "password"
  ) => {
    // Reset ke data asli
    if (profileData?.teacher) {
      setEditData({
        username: profileData.username || "",
        full_name: profileData.teacher.full_name || "",
        gender: profileData.teacher.gender || "",
        birth_date: profileData.teacher.birth_date
          ? profileData.teacher.birth_date.split("T")[0]
          : "",
        phone: profileData.teacher.phone || "",
        address: profileData.teacher.address || "",
        degree: profileData.teacher.degree || "",
        instance_name: profileData.teacher.instance?.name || "",
        instance_type: profileData.teacher.instance?.type_institutions || "",
        latitude: profileData.teacher.instance?.latitude || "",
        longitude: profileData.teacher.instance?.longitude || "",
      });
    }
    if (section === "personal") {
      setIsEditingPersonal(false);
      setPhotoFile(null);
      setPhotoPreview("");
    }
    if (section === "contact") setIsEditingContact(false);
    if (section === "password") {
      setIsChangingPassword(false);
      setPasswordData({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
    }
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  // Handler untuk reload academic years
  const handleReloadAcademicYears = async () => {
    await fetchAcademicYears();
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["admin", "teacher"]}>
        <div className="min-h-screen bg-gray-50">
          <HeaderComponent />
          <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={["admin", "teacher"]}>
        <div className="min-h-screen bg-gray-50">
          <HeaderComponent />
          <main className="max-w-7xl mx-auto px-4 py-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              <p className="text-sm">Error loading profile: {error}</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!profileData || !profileData.teacher) {
    return (
      <ProtectedRoute allowedRoles={["admin", "teacher"]}>
        <div className="min-h-screen bg-gray-50">
          <HeaderComponent />
          <main className="max-w-7xl mx-auto px-4 py-4">
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg">
              <p className="text-sm">Data profil tidak ditemukan</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  const teacher = profileData.teacher;
  const instance = teacher.instance;
  const classrooms = teacher.classrooms || [];

  return (
    <ProtectedRoute allowedRoles={["admin", "teacher"]}>
      <div className="min-h-screen bg-gray-50">
        <HeaderComponent />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header Profile */}
          <ProfileSection
            teacher={teacher}
            profileData={profileData}
            isEditingPersonal={isEditingPersonal}
            isEditingContact={isEditingContact}
            editData={editData}
            isSubmitting={isSubmitting}
            photoPreview={photoPreview}
            onEditToggle={handleEditToggle}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            onPhotoChange={handlePhotoChange}
            formatGender={formatGender}
            formatBirthDate={formatBirthDate}
            formatRole={formatRole}
          />

          {/* Account Information */}
          <AccountSetting
            profileData={profileData}
            isChangingPassword={isChangingPassword}
            passwordData={passwordData}
            isSubmitting={isSubmitting}
            onEditToggle={handleEditToggle}
            onPasswordChange={handlePasswordChange}
            onPasswordSubmit={handlePasswordSubmit}
            onCancel={handleCancel}
          />

          {/* Institution Information - Ditampilkan untuk semua, tapi hanya admin yang bisa edit */}
          {instance && (
            <InstanceSection
              instance={instance}
              isAdmin={isAdmin}
              profileData={profileData}
              updateInstance={updateInstance}
              getMe={getMe}
              L={L}
              markerIcon={markerIcon}
              formatInstitutionType={formatInstitutionType}
            />
          )}

          {/* Academic Year Management - Hanya untuk Admin */}
          {isAdmin && (
            <AcademicYearSection
              onReloadAcademicYears={handleReloadAcademicYears}
              getMe={getMe}
            />
          )}

          {/* Classrooms Information */}
          {classrooms.length > 0 && (
            <ClassroomSection classrooms={classrooms} />
          )}

          {/* System Information - Tidak ada tombol edit */}
          <SystemsInformation profileData={profileData} />
        </main>
      </div>
    </ProtectedRoute>
  );
}

export default ProfilePage;
