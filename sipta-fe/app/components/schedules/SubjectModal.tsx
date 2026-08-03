import React, { useState, useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CreateSubjectData } from "@/src/domain/StudyEntity";
import { Subject } from "@/src/domain/ScheduleEntity";

interface SubjectModalProps {
  isOpen: boolean;
  subject?: Subject | null;
  onClose: () => void;
  onSubmit: (data: CreateSubjectData) => Promise<void>;
  loading?: boolean;
}

export const SubjectModal: React.FC<SubjectModalProps> = ({
  isOpen,
  subject,
  onClose,
  onSubmit,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (subject) {
      setFormData({
        code: subject.code,
        name: subject.name,
        description: subject.description || "",
      });
    } else {
      setFormData({
        code: "",
        name: "",
        description: "",
      });
    }
    setErrors({});
  }, [subject, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = "Kode mata pelajaran wajib diisi";
    } else if (formData.code.length > 10) {
      newErrors.code = "Kode maksimal 10 karakter";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Nama mata pelajaran wajib diisi";
    } else if (formData.name.length > 100) {
      newErrors.name = "Nama maksimal 100 karakter";
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = "Deskripsi maksimal 500 karakter";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const submitData = subject
        ? { ...formData }
        : {
            code: formData.code,
            name: formData.name,
            description: formData.description,
          };

      await onSubmit(submitData);
      onClose();
    } catch (error) {
      // Error handling sudah di component parent
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Background dengan transparansi */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6">
        <div
          className="relative w-full max-w-md transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Content dengan background transparan */}
          <div className="bg-white bg-opacity-95 backdrop-blur-lg rounded-2xl shadow-2xl border border-white border-opacity-20">
            {/* Header */}
            <div className="flex items-center justify-between p-6 pb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {subject ? "Edit Mata Pelajaran" : "Tambah Mata Pelajaran"}
              </h3>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200"
                disabled={loading}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-5">
              {/* Kode Mata Pelajaran */}
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Kode Mata Pelajaran *
                </label>
                <input
                  type="text"
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    handleInputChange("code", e.target.value.toUpperCase())
                  }
                  className={`w-full px-4 py-3 text-base border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.code
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  placeholder="Contoh: BHSARAB"
                  maxLength={10}
                  disabled={loading}
                />
                {errors.code && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {errors.code}
                  </p>
                )}
              </div>

              {/* Nama Mata Pelajaran */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Nama Mata Pelajaran *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className={`w-full px-4 py-3 text-base border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.name
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  placeholder="Contoh: Bahasa Arab"
                  maxLength={100}
                  disabled={loading}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 font-medium">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Deskripsi */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-semibold text-gray-700 mb-2"
                >
                  Deskripsi
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  rows={3}
                  className={`w-full px-4 py-3 text-base border-2 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none ${
                    errors.description
                      ? "border-red-300 bg-red-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                  placeholder="Deskripsi singkat mata pelajaran (opsional)"
                  maxLength={500}
                  disabled={loading}
                />
                <div className="flex justify-between items-center mt-2">
                  {errors.description ? (
                    <p className="text-sm text-red-600 font-medium">
                      {errors.description}
                    </p>
                  ) : (
                    <div></div>
                  )}
                  <p className="text-xs text-gray-500 font-medium">
                    {formData.description.length}/500
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 text-base font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all disabled:opacity-50"
                  disabled={loading}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 text-base font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 active:from-blue-800 active:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg disabled:opacity-50 transition-all"
                  disabled={loading}
                >
                  {loading ? "Menyimpan..." : subject ? "Update" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
