// components/AcademicYearSection.tsx (versi lengkap dengan is_promoted)
import { AcademicYear } from "@/src/domain/AcademicYearEntity";
import { useAcademicYearStore } from "@/src/state/AcademicYearStore";
import { updateAcademicYearInLocalStorage } from "@/src/utils/LocalStorageAuth";
import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { formatDateDDMMYYYY } from "@/src/utils/date";
import { useConfirmDialog } from "@/app/components/ui";

interface AcademicYearSectionProps {
  onReloadAcademicYears?: () => Promise<void>;
  getMe?: () => Promise<void>;
}

const AcademicYearSection: React.FC<AcademicYearSectionProps> = ({
  onReloadAcademicYears,
  getMe,
}) => {
  // Zustand store
  const {
    academicYears,
    loading: isLoadingAcademicYears,
    fetchAcademicYears,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
    setActiveAcademicYear,
  } = useAcademicYearStore();

  // State untuk Academic Year Form
  const [isEditingAcademicYear, setIsEditingAcademicYear] = useState(false);
  const [isCreatingAcademicYear, setIsCreatingAcademicYear] = useState(false);
  const [academicYearForm, setAcademicYearForm] = useState({
    name: "",
    periode: "ganjil" as "ganjil" | "genap",
    start_periode: "",
    end_periode: "",
    is_active: false,
    is_promoted: false,
  });
  const [editingAcademicYearId, setEditingAcademicYearId] = useState<
    string | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { confirm, confirmationDialog } = useConfirmDialog();

  // Load academic years on component mount
  useEffect(() => {
    fetchAcademicYears();
  }, []);


  // Academic Year Handlers
  const handleCreateAcademicYear = () => {
    setIsCreatingAcademicYear(true);
    setIsEditingAcademicYear(false);
    setEditingAcademicYearId(null);
    setAcademicYearForm({
      name: "",
      periode: "ganjil",
      start_periode: "",
      end_periode: "",
      is_active: false,
      is_promoted: false,
    });
  };

  const handleEditAcademicYear = (academicYear: AcademicYear) => {
    setIsEditingAcademicYear(true);
    setIsCreatingAcademicYear(false);
    setEditingAcademicYearId(academicYear.id);
    setAcademicYearForm({
      name: academicYear.name,
      periode: academicYear.periode,
      start_periode: academicYear.start_periode,
      end_periode: academicYear.end_periode,
      is_active: academicYear.is_active,
      is_promoted: academicYear.is_promoted || false,
    });
  };

  const handleCancelAcademicYear = () => {
    setIsEditingAcademicYear(false);
    setIsCreatingAcademicYear(false);
    setEditingAcademicYearId(null);
    setAcademicYearForm({
      name: "",
      periode: "ganjil",
      start_periode: "",
      end_periode: "",
      is_active: false,
      is_promoted: false,
    });
  };

  const handleAcademicYearInputChange = (
    field: keyof typeof academicYearForm,
    value: string | boolean
  ) => {
    setAcademicYearForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveAcademicYear = async () => {
    if (!academicYearForm.name) {
      toast.error("Nama tahun akademik harus diisi");
      return;
    }

    if (!academicYearForm.start_periode || !academicYearForm.end_periode) {
      toast.error("Tanggal mulai dan selesai harus diisi");
      return;
    }

    // Validasi tanggal
    if (
      new Date(academicYearForm.start_periode) >=
      new Date(academicYearForm.end_periode)
    ) {
      toast.error("Tanggal selesai harus setelah tanggal mulai");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isCreatingAcademicYear) {
        // Create new academic year
        await createAcademicYear({
          name: academicYearForm.name,
          periode: academicYearForm.periode,
          start_periode: academicYearForm.start_periode,
          end_periode: academicYearForm.end_periode,
          is_active: academicYearForm.is_active,
          is_promoted: academicYearForm.is_promoted,
        });
        toast.success("Tahun akademik berhasil ditambahkan");
      } else if (isEditingAcademicYear && editingAcademicYearId) {
        // Update existing academic year
        await updateAcademicYear(editingAcademicYearId, {
          name: academicYearForm.name,
          periode: academicYearForm.periode,
          start_periode: academicYearForm.start_periode,
          end_periode: academicYearForm.end_periode,
          is_active: academicYearForm.is_active,
          is_promoted: academicYearForm.is_promoted,
        });
        toast.success("Tahun akademik berhasil diperbarui");
      }

      // Refresh data academic years
      await fetchAcademicYears();

      // Call parent callback if provided
      if (onReloadAcademicYears) {
        await onReloadAcademicYears();
      }

      handleCancelAcademicYear();
    } catch (error: any) {
      console.error("Error saving academic year:", error);
      toast.error(error.message || "Gagal menyimpan tahun akademik");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAcademicYear = async (id: string) => {
    const academicYear = academicYears.find((year) => year.id === id);
    const confirmed = await confirm({
      title: "Hapus tahun akademik?",
      description: `Tahun akademik ${academicYear?.name ?? "ini"} (${academicYear?.periode ?? "-"}) akan dihapus.`,
      confirmLabel: "Ya, hapus",
      tone: "destructive",
      testId: "academic-year-delete-confirm",
    });
    if (!confirmed) return;

    try {
      await deleteAcademicYear(id);
      toast.success("Tahun akademik berhasil dihapus");

      // Refresh data academic years
      await fetchAcademicYears();
    } catch (error: any) {
      console.error("Error deleting academic year:", error);
      toast.error(error.message || "Gagal menghapus tahun akademik");
    }
  };

  const handleSetActiveAcademicYear = async (id: string) => {
    try {
      // Panggil API untuk set active academic year
      const response = await setActiveAcademicYear(id);
      
      // Dapatkan academic year yang baru diaktifkan
      const activeAcademicYear = academicYears.find(ay => ay.id === id);
      
      if (activeAcademicYear) {
        // Update localStorage dengan academic year yang baru
        // updateAcademicYearInLocalStorage(activeAcademicYear);
        toast.success("Tahun akademik berhasil diaktifkan");

        // Refresh profile data untuk update academic year di header/global state
        if (getMe) {
          await getMe();
        }
        
        // Refresh academic years list
        await fetchAcademicYears();
        
        // Dispatch event untuk memberi tahu komponen lain
        window.dispatchEvent(new Event('academicYearChanged'));
      }
    } catch (error: any) {
      console.error("Error setting active academic year:", error);
      toast.error(error.message || "Gagal mengaktifkan tahun akademik");
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 sm:p-6 mt-6 border border-gray-100">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 pb-3 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Tahun Akademik</h2>
        <button
          onClick={handleCreateAcademicYear}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2 w-full sm:w-auto"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span className="sm:inline">Tambah</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoadingAcademicYears && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Create/Edit Form */}
      {(isCreatingAcademicYear || isEditingAcademicYear) && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
          <h3 className="text-md font-semibold text-gray-900 mb-4">
            {isCreatingAcademicYear
              ? "Tambah Tahun Akademik Baru"
              : "Edit Tahun Akademik"}
          </h3>

          <div className="space-y-4">
            {/* Nama Tahun Akademik */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Nama Tahun Akademik <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={academicYearForm.name}
                onChange={(e) =>
                  handleAcademicYearInputChange("name", e.target.value)
                }
                className="text-sm text-gray-900 bg-white border border-gray-300 rounded-lg px-4 py-3 w-full"
                placeholder="Contoh: 2024/2025"
              />
            </div>

            {/* Periode */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Periode <span className="text-red-500">*</span>
              </label>
              <select
                value={academicYearForm.periode}
                onChange={(e) =>
                  handleAcademicYearInputChange(
                    "periode",
                    e.target.value as "ganjil" | "genap"
                  )
                }
                className="text-sm text-gray-900 bg-white border border-gray-300 rounded-lg px-4 py-3 w-full"
              >
                <option value="ganjil">Ganjil</option>
                <option value="genap">Genap</option>
              </select>
            </div>

            {/* Tanggal - Grid untuk desktop, stack untuk mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Tanggal Mulai <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={academicYearForm.start_periode}
                  onChange={(e) =>
                    handleAcademicYearInputChange(
                      "start_periode",
                      e.target.value
                    )
                  }
                  className="text-sm text-gray-900 bg-white border border-gray-300 rounded-lg px-4 py-3 w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Tanggal Selesai <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={academicYearForm.end_periode}
                  onChange={(e) =>
                    handleAcademicYearInputChange("end_periode", e.target.value)
                  }
                  className="text-sm text-gray-900 bg-white border border-gray-300 rounded-lg px-4 py-3 w-full"
                />
              </div>
            </div>

            {/* Checkbox Set Active */}
            <div className="flex items-center pt-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={academicYearForm.is_active}
                  onChange={(e) =>
                    handleAcademicYearInputChange("is_active", e.target.checked)
                  }
                  className="sr-only"
                />
                <div
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    academicYearForm.is_active ? "bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      academicYearForm.is_active
                        ? "transform translate-x-5"
                        : ""
                    }`}
                  />
                </div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Set sebagai tahun aktif
                </span>
              </label>
            </div>

            {/* Checkbox Promoted */}
            <div className="flex items-center pt-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={academicYearForm.is_promoted}
                  onChange={(e) =>
                    handleAcademicYearInputChange("is_promoted", e.target.checked)
                  }
                  className="sr-only"
                />
                <div
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    academicYearForm.is_promoted ? "bg-purple-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      academicYearForm.is_promoted
                        ? "transform translate-x-5"
                        : ""
                    }`}
                  />
                </div>
                <span className="ml-3 text-sm font-medium text-gray-700">
                  Promoted (ditampilkan di dashboard siswa)
                </span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 mt-6">
            <button
              onClick={handleSaveAcademicYear}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              onClick={handleCancelAcademicYear}
              className="flex-1 bg-gray-500 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-gray-600 text-sm font-medium transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Academic Years List */}
      <div className="space-y-3">
        {!isLoadingAcademicYears && academicYears.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg
              className="w-12 h-12 mx-auto text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-2 text-sm">Belum ada tahun akademik</p>
            <button
              onClick={handleCreateAcademicYear}
              className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Tambah Tahun Akademik
            </button>
          </div>
        ) : (
          academicYears.map((academicYear) => (
            <div
              key={academicYear.id}
              className={`border rounded-lg p-4 ${
                academicYear.is_active
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                {/* Content Section */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
                      {academicYear.name}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {academicYear.periode === "ganjil" ? "Ganjil" : "Genap"}
                      </span>
                      {academicYear.is_active && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Aktif
                        </span>
                      )}
                      {academicYear.is_promoted ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Promoted
                        </span>
                      ) : ("")}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    Periode:{" "}
                    {formatDateDDMMYYYY(academicYear.start_periode)}{" "}
                    -{" "}
                    {formatDateDDMMYYYY(academicYear.end_periode)}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                  {!academicYear.is_active && (
                    <button
                      onClick={() =>
                        handleSetActiveAcademicYear(academicYear.id)
                      }
                      className="text-green-600 hover:text-green-800 text-sm font-medium flex items-center gap-1 px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="sm:hidden">Aktif</span>
                      <span className="hidden sm:inline">Aktifkan</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleEditAcademicYear(academicYear)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
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
                    Edit
                  </button>
                  {!academicYear.is_active && (
                    <button
                      onClick={() => handleDeleteAcademicYear(academicYear.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium flex items-center gap-1 px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      <span className="sm:hidden">Hapus</span>
                      <span className="hidden sm:inline">Hapus</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {confirmationDialog}
    </div>
  );
};

export default AcademicYearSection;
