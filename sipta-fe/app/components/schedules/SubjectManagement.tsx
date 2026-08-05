import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { SubjectModal } from "./SubjectModal";
import { toast } from "react-hot-toast";
import { useStudyStore } from "@/src/state/StudyStore";
import { Subject } from "@/src/domain/ScheduleEntity";
import { useConfirmDialog } from "@/app/components/ui";

interface SubjectManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SubjectManagement: React.FC<SubjectManagementProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    subjects,
    loading,
    createSubject,
    updateSubject,
    deleteSubject,
    fetchSubjects,
  } = useStudyStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { confirm, confirmationDialog } = useConfirmDialog();

  // Filter subjects berdasarkan pencarian
  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subject.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = () => {
    setSelectedSubject(null);
    setIsModalOpen(true);
  };

  const handleEdit = (subject: Subject) => {
    setSelectedSubject(subject);
    setIsModalOpen(true);
  };

  const handleDelete = async (subject: Subject) => {
    const confirmed = await confirm({
      title: "Hapus mata pelajaran?",
      description: `Mata pelajaran “${subject.name}” akan dihapus dan tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: "Ya, hapus",
      tone: "destructive",
      testId: "subject-delete-confirm",
    });
    if (!confirmed) return;

    try {
      await deleteSubject(subject.id);
      toast.success("Mata pelajaran berhasil dihapus");
    } catch (error) {
      toast.error("Gagal menghapus mata pelajaran");
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      if (selectedSubject) {
        await updateSubject(selectedSubject.id, data);
        toast.success("Mata pelajaran berhasil diperbarui");
      } else {
        await createSubject(data);
        toast.success("Mata pelajaran berhasil dibuat");
      }
    } catch (error) {
      toast.error(
        selectedSubject
          ? "Gagal memperbarui mata pelajaran"
          : "Gagal membuat mata pelajaran"
      );
      throw error;
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header - Sticky */}
        <div className="flex-shrink-0 sticky top-0 bg-white z-10 rounded-t-xl">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                Mata Pelajaran
              </h2>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Kelola data mata pelajaran yang tersedia
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCreate}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl active:scale-95"
              >
                <PlusIcon className="h-5 w-5" />
                Tambah
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Search and Stats - Fixed */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari mata pelajaran..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white hover:border-gray-300 transition-all"
                />
              </div>
              <div className="text-sm text-gray-600 font-medium bg-white px-3 py-2 rounded-lg border border-gray-200">
                Menampilkan{" "}
                <span className="text-blue-600 font-bold">
                  {filteredSubjects.length}
                </span>{" "}
                dari{" "}
                <span className="text-blue-600 font-bold">
                  {subjects.length}
                </span>{" "}
                mata pelajaran
              </div>
            </div>
          </div>
        </div>

        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <div className="min-w-full">
              {/* Table Header - Sticky */}
              <div className="sticky top-0 bg-gray-50 z-5">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        Kode
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        Nama Mata Pelajaran
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        Deskripsi
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider border-b border-gray-200">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                </table>
              </div>

              {/* Table Body */}
              <table className="w-full">
                <tbody className="divide-y divide-gray-200">
                  {filteredSubjects.map((subject) => (
                    <tr
                      key={subject.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900 bg-blue-100 px-3 py-1.5 rounded-lg">
                          {subject.code}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-base font-medium text-gray-900">
                          {subject.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 max-w-md">
                          {subject.description || (
                            <span className="text-gray-400 italic">
                              Tidak ada deskripsi
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(subject)}
                            className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200 border border-blue-600 hover:border-blue-700"
                            title="Edit"
                          >
                            <PencilSquareIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(subject)}
                            className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border border-red-600 hover:border-red-700"
                            title="Hapus"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Empty State untuk Desktop */}
              {filteredSubjects.length === 0 && !loading && (
                <div className="flex items-center justify-center py-12 px-4">
                  <div className="text-center">
                    <div className="text-gray-300 mb-4">
                      <BookOpenIcon className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {searchTerm
                        ? "Tidak ada hasil pencarian"
                        : "Belum ada mata pelajaran"}
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-sm mx-auto text-base">
                      {searchTerm
                        ? "Coba ubah kata kunci pencarian Anda"
                        : "Mulai dengan menambahkan mata pelajaran pertama Anda"}
                    </p>
                    {!searchTerm && (
                      <button
                        onClick={handleCreate}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl text-base font-semibold transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl active:scale-95"
                      >
                        <PlusIcon className="h-5 w-5" />
                        Tambah Mata Pelajaran
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden">
            <div className="p-4 space-y-4">
              {filteredSubjects.map((subject) => (
                <div
                  key={subject.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-sm font-semibold text-gray-900 bg-blue-100 px-3 py-1.5 rounded-lg">
                      {subject.code}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(subject)}
                        className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg transition-all duration-200 border border-blue-600 hover:border-blue-700"
                        title="Edit"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(subject)}
                        className="p-2 text-red-600 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 border border-red-600 hover:border-red-700"
                        title="Hapus"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {subject.name}
                  </h3>

                  <div className="text-sm text-gray-600">
                    {subject.description || (
                      <span className="text-gray-400 italic">
                        Tidak ada deskripsi
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Empty State untuk Mobile */}
              {filteredSubjects.length === 0 && !loading && (
                <div className="text-center py-12 px-4">
                  <div className="text-gray-300 mb-4">
                    <BookOpenIcon className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {searchTerm
                      ? "Tidak ada hasil pencarian"
                      : "Belum ada mata pelajaran"}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-sm mx-auto text-base">
                    {searchTerm
                      ? "Coba ubah kata kunci pencarian Anda"
                      : "Mulai dengan menambahkan mata pelajaran pertama Anda"}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={handleCreate}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl text-base font-semibold transition-all duration-200 flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl active:scale-95"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Tambah Mata Pelajaran
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600 font-medium">
                Memuat data...
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Subject Modal */}
      <SubjectModal
        isOpen={isModalOpen}
        subject={selectedSubject}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        loading={loading}
      />
      {confirmationDialog}
    </div>
  );
};

// Ikon BookOpen untuk empty state
const BookOpenIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
    />
  </svg>
);
