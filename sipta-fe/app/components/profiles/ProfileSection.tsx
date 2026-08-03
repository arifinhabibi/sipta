// components/profiles/ProfileSection.tsx
import React from "react";

interface ProfileSectionProps {
  teacher: any;
  profileData: any;
  isEditingPersonal: boolean;
  isEditingContact: boolean;
  editData: any;
  isSubmitting: boolean;
  photoPreview: string;
  onEditToggle: (section: "personal" | "contact") => void;
  onInputChange: (field: any, value: any) => void;
  onSubmit: (section: "personal" | "contact") => void;
  onCancel: (section: "personal" | "contact") => void;
  onPhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  formatGender: (gender: string) => string;
  formatBirthDate: (dateString: any) => string;
  formatRole: (role: string) => string;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  teacher,
  profileData,
  isEditingPersonal,
  isEditingContact,
  editData,
  isSubmitting,
  photoPreview,
  onEditToggle,
  onInputChange,
  onSubmit,
  onCancel,
  onPhotoChange,
  formatGender,
  formatBirthDate,
  formatRole,
}) => {
  return (
    <>
      {/* Header Profile */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-gray-100">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Photo Profile */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : teacher.photo && teacher.photo !== "default.jpg" ? (
                <img
                  src={`/images/profiles/${teacher.photo}`}
                  alt={teacher.full_name}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    {teacher.full_name?.charAt(0) || "U"}
                  </span>
                </div>
              )}
            </div>
            {/* Button upload photo hanya muncul saat edit personal */}
            {isEditingPersonal && (
              <>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  onChange={onPhotoChange}
                  className="hidden"
                  id="photo-upload"
                />
                <label
                  htmlFor="photo-upload"
                  className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-full text-xs shadow-lg cursor-pointer hover:bg-blue-700 transition-colors"
                >
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
                      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </label>
              </>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1 text-center sm:text-left">
            <div className="space-y-3">
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-gray-900 break-words">
                  {teacher.full_name}
                </h1>
                <p className="text-gray-600 text-sm mt-1">{teacher.degree}</p>
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    teacher.status === "active"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {teacher.status === "active" ? "Aktif" : "Non-Aktif"}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {formatRole(profileData.role)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Informasi Pribadi
            </h2>
            <button
              onClick={() => onEditToggle("personal")}
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
              {isEditingPersonal ? "Batal" : "Edit"}
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">
                Nama Lengkap
              </label>
              {isEditingPersonal ? (
                <input
                  type="text"
                  value={editData.full_name}
                  onChange={(e) => onInputChange("full_name", e.target.value)}
                  className="text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 w-full"
                />
              ) : (
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-4 py-3">
                  {teacher.full_name}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">
                Jenis Kelamin
              </label>
              {isEditingPersonal ? (
                <select
                  value={editData.gender}
                  onChange={(e) => onInputChange("gender", e.target.value)}
                  className="text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 w-full"
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </select>
              ) : (
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-4 py-3">
                  {formatGender(teacher.gender)}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">
                Tanggal Lahir
              </label>
              {isEditingPersonal ? (
                <input
                  type="date"
                  value={editData.birth_date}
                  onChange={(e) => onInputChange("birth_date", e.target.value)}
                  className="text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 w-full"
                />
              ) : (
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-4 py-3">
                  {formatBirthDate(teacher.birth_date)}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">
                Gelar
              </label>
              {isEditingPersonal ? (
                <input
                  type="text"
                  value={editData.degree}
                  onChange={(e) => onInputChange("degree", e.target.value)}
                  className="text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 w-full"
                  placeholder="Contoh: S.AG."
                />
              ) : (
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-4 py-3">
                  {teacher.degree || "-"}
                </p>
              )}
            </div>
            {isEditingPersonal && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => onSubmit("personal")}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  onClick={() => onCancel("personal")}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm font-medium"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Informasi Kontak
            </h2>
            <button
              onClick={() => onEditToggle("contact")}
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
              {isEditingContact ? "Batal" : "Edit"}
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">
                Nomor Telepon
              </label>
              {isEditingContact ? (
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => onInputChange("phone", e.target.value)}
                  className="text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 w-full"
                  placeholder="Contoh: 081234567890"
                />
              ) : (
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-4 py-3">
                  {teacher.phone || "-"}
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 block mb-2">
                Alamat
              </label>
              {isEditingContact ? (
                <textarea
                  value={editData.address}
                  onChange={(e) => onInputChange("address", e.target.value)}
                  className="text-sm text-gray-900 bg-gray-50 border border-gray-300 rounded-lg px-4 py-3 w-full resize-none"
                  rows={3}
                  placeholder="Masukkan alamat lengkap"
                />
              ) : (
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg px-4 py-3 min-h-[4rem]">
                  {teacher.address || "-"}
                </p>
              )}
            </div>

            {isEditingContact && (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => onSubmit("contact")}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan"}
                </button>
                <button
                  onClick={() => onCancel("contact")}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 text-sm font-medium"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfileSection;
