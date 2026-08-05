"use client";
import React, { useEffect, useState } from "react";
import HeaderComponent from "../components/HeaderComponent";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { useTeacherStore } from "@/src/state/TeacherStore";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  UsersIcon,
  UserGroupIcon,
  CameraIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import TeacherModal from "../components/teachers/TeacherModal";
import DeleteConfirmationModal from "../components/teachers/DeleteConfirmationModal";
import { formatDateDDMMYYYY } from "@/src/utils/date";
import LoadingState from "../components/teachers/LoadingState";
import CredentialModal from "../components/reports/teachers/CredentialModal";

// Interface untuk user data dari localStorage
interface AuthUser {
  fullname: string;
  degree: string;
  email: string;
  role: "admin" | "teacher" | "student";
  photo: string;
}

interface AuthState {
  state: {
    token: string;
    user: AuthUser;
  };
}

function TeachersPage() {
  const {
    teachers,
    fetchTeachers,
    loading,
    createTeacher,
    updateTeacher,
    deleteTeacher,
  } = useTeacherStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortField, setSortField] = useState("full_name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Modal states
  const [teacherModal, setTeacherModal] = useState<{
    isOpen: boolean;
    teacher?: any;
  }>({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    teacher?: any;
  }>({ isOpen: false });
  const [credentialModal, setCredentialModal] = useState<{
    isOpen: boolean;
    credentials?: any;
  }>({ isOpen: false });

  // Get base URL from environment with fallback - SAMA SEPERTI DI CLASSROOM
  const baseUrl = process.env.NEXT_PUBLIC_ASSET || "";

  // Build photo URL safely - SAMA SEPERTI DI CLASSROOM
  const getPhotoUrl = (photoPath: string | undefined | null): string | null => {
    if (!photoPath || photoPath.trim() === "" || photoPath === "null") {
      return null;
    }

    if (photoPath.startsWith("http")) {
      try {
        new URL(photoPath);
        return photoPath;
      } catch {
        return null;
      }
    }

    if (baseUrl) {
      try {
        const normalizedPath = photoPath.startsWith("/")
          ? photoPath.slice(1)
          : photoPath;
        const fullUrl = `${baseUrl}${
          baseUrl.endsWith("/") ? "" : "/"
        }${normalizedPath}`;
        new URL(fullUrl);
        return fullUrl;
      } catch {
        return null;
      }
    }

    return null;
  };

  // Get user data from localStorage on component mount
  useEffect(() => {
    const getAuthData = () => {
      try {
        const authStorage = localStorage.getItem("auth-storage");
        if (authStorage) {
          const authData: AuthState = JSON.parse(authStorage);
          setCurrentUser(authData.state.user);
        }
      } catch (error) {
        console.error("Error reading auth data from localStorage:", error);
      }
    };

    getAuthData();
  }, []);

  // Check user role and permissions
  const isAdmin = currentUser?.role === "admin";
  const canEditTeacher = isAdmin;

  useEffect(() => {
    getData();
  }, [fetchTeachers]);

  const getData = () => {
    fetchTeachers().catch((err) => toast.error(err.message));
  };

  // Filter and sort teachers
  const filteredTeachers = teachers
    .filter((teacher) => {
      const matchesSearch =
        teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        teacher.phone?.includes(searchTerm) ||
        teacher.degree?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || teacher.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a: any, b: any) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (sortField === "birth_date") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleViewDetail = (teacher: any) => {
    setTeacherModal({ isOpen: true, teacher });
  };

  const handleEdit = (teacher: any) => {
    setTeacherModal({ isOpen: true, teacher });
  };

  const handleDelete = (teacher: any) => {
    setDeleteModal({ isOpen: true, teacher });
  };

  const handleCreateTeacher = (data: any) => {
    if (!canEditTeacher) {
      toast.error("Anda tidak memiliki akses untuk menambah guru");
      return;
    }
    createTeacher(data)
      .then((resp: any) => {
        getData();
        setTeacherModal({ isOpen: false });

        // Tampilkan credential setelah berhasil membuat teacher
        if (resp.data && resp.data.login_credentials) {
          setCredentialModal({
            isOpen: true,
            credentials: resp.data.login_credentials,
          });
        }

        toast.success(resp.message);
      })
      .catch((err) => toast.error(err.message));
  };

  const handleUpdateTeacher = (data: any) => {
    if (!canEditTeacher) {
      toast.error("Anda tidak memiliki akses untuk mengedit guru");
      return;
    }
    const teacherId = teacherModal.teacher?.id;

    if (!teacherId) {
      toast.error("ID guru tidak ditemukan");
      return;
    }

    updateTeacher(teacherId, data)
      .then((resp: any) => {
        getData();
        setTeacherModal({ isOpen: false });
        toast.success(resp.message);
      })
      .catch((err) => toast.error(err.message));
  };

  const confirmDelete = () => {
    if (!canEditTeacher) {
      toast.error("Anda tidak memiliki akses untuk menghapus guru");
      return;
    }
    const teacherId = deleteModal.teacher?.id;

    if (!teacherId) {
      toast.error("ID guru tidak ditemukan");
      return;
    }

    deleteTeacher(teacherId)
      .then((resp: any) => {
        getData();
        setDeleteModal({ isOpen: false });
        toast.success(resp.message);
      })
      .catch((err) => toast.error(err.message));
  };

  const formatDate = (dateString: string) => {
    return formatDateDDMMYYYY(dateString);
  };

  const formatGender = (gender: string) => {
    return gender === "female" ? "Perempuan" : "Laki-laki";
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-green-100 text-green-800",
      inactive: "bg-red-100 text-red-800",
      pending: "bg-yellow-100 text-yellow-800",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status === "active"
          ? "Aktif"
          : status === "inactive"
          ? "Non-Aktif"
          : status}
      </span>
    );
  };

  // Photo preview component untuk table
  const TeacherPhoto = ({ teacher }: { teacher: any }) => {
    const photoUrl = getPhotoUrl(teacher.photo);

    return (
      <div className="flex-shrink-0 h-10 w-10 relative">
        {photoUrl ? (
          <img
            src={photoUrl}
            alt={teacher.full_name}
            className="h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
            onError={(e) => {
              // Fallback ke initial jika gambar error
              e.currentTarget.style.display = "none";
            }}
          />
        ) : (
          <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            <span className="text-blue-600 font-medium text-sm">
              {teacher.full_name.charAt(0)}
            </span>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-8">
          <HeaderComponent />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    Data Guru
                  </h1>
                  <p className="text-gray-600">Memuat data...</p>
                </div>
              </div>
              <LoadingState />
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-8">
        <HeaderComponent />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <AcademicCapIcon className="w-6 h-6" />
                    Data Guru
                  </h1>
                  <p className="text-gray-600">
                    Kelola data guru dan pengajar di institusi Anda
                  </p>
                  {/* Role indicator */}
                  {currentUser && (
                    <div className="mt-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          currentUser.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {currentUser.role === "admin"
                          ? "Administrator"
                          : "Teacher"}{" "}
                        - {currentUser.fullname}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {canEditTeacher && (
                    <button
                      onClick={() => setTeacherModal({ isOpen: true })}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <PlusIcon className="h-5 w-5" />
                      Tambah Guru
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="px-4 sm:px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search Input */}
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Cari nama guru, gelar, atau telepon..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm("")}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Status Filter */}
                <div className="sm:w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Semua Status</option>
                    <option value="active">Aktif</option>
                    <option value="inactive">Non-Aktif</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="p-4 sm:p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("full_name")}
                      >
                        <div className="flex items-center gap-1">
                          Nama Guru
                          <ChevronUpDownIcon className="h-4 w-4" />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Informasi Kontak
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                        onClick={() => handleSort("birth_date")}
                      >
                        <div className="flex items-center gap-1">
                          Tanggal Lahir
                          <ChevronUpDownIcon className="h-4 w-4" />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Status
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTeachers.map((teacher) => (
                      <tr
                        key={teacher.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <TeacherPhoto teacher={teacher} />
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {teacher.full_name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {teacher.degree} •{" "}
                                {formatGender(teacher.gender)}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {teacher.phone || "-"}
                          </div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {teacher.address || "Alamat tidak tersedia"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(teacher.birth_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(teacher.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {canEditTeacher && (
                              <>
                                <button
                                  onClick={() => handleEdit(teacher)}
                                  className="text-green-600 hover:text-green-900 p-1 rounded transition-colors duration-200"
                                  title="Edit"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(teacher)}
                                  className="text-red-600 hover:text-red-900 p-1 rounded transition-colors duration-200"
                                  title="Hapus"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredTeachers.length === 0 && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-2">
                      <MagnifyingGlassIcon className="h-12 w-12 mx-auto" />
                    </div>
                    <p className="text-gray-500 text-lg">
                      Tidak ada data guru yang ditemukan
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      Coba ubah pencarian atau filter yang Anda gunakan
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>

        {/* Credential Modal */}
        <CredentialModal
          isOpen={credentialModal.isOpen}
          onClose={() => setCredentialModal({ isOpen: false })}
          credentials={credentialModal.credentials}
        />

        {/* Teacher Modal */}
        <TeacherModal
          isOpen={teacherModal.isOpen}
          onClose={() => setTeacherModal({ isOpen: false })}
          onSave={
            teacherModal.teacher ? handleUpdateTeacher : handleCreateTeacher
          }
          teacher={teacherModal.teacher}
          canEdit={teacherModal.teacher ? canEditTeacher : true}
        />

        {/* Delete Confirmation Modal */}
        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false })}
          onConfirm={confirmDelete}
          name={deleteModal.teacher?.full_name || ""}
          canDelete={canEditTeacher}
        />
      </div>
    </ProtectedRoute>
  );
}

export default TeachersPage;
