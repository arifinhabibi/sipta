"use client";

import React, { useState, useEffect, useCallback } from 'react';
import HeaderComponent from '@/app/components/HeaderComponent';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import {
  PlusIcon,
  AcademicCapIcon,
  ChartBarIcon,
  Squares2X2Icon,
  TableCellsIcon,
  ArrowUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useTeacherStore } from '@/src/state/TeacherStore';
import { useClassroomStore } from '@/src/state/ClassroomStore';
import toast from 'react-hot-toast';
import { Classroom } from '@/src/domain/ClassroomEntity';
import { Student } from '@/src/domain/StudentEntity';
import ClassroomTable from '../components/classrooms/ClassroomTable';
import ClassroomCard from '../components/classrooms/ClassroomCard';
import DeleteConfirmationModal from '../components/classrooms/DeleteConfirmationModal';
import StudentModal from '../components/classrooms/StudentModal';
import ClassroomModal from '../components/classrooms/ClassroomModal';
import LoadingState from '../components/classrooms/LoadingState';
import UpgradeStudentModal from '../components/classrooms/UpgradeStudentModal';
import { getUserFromLocalStorage, getAuthFromLocalStorage } from '@/src/utils/LocalStorageAuth';

function ClassroomsPage() {
  // Stores
  const { fetchTeachers, teachers } = useTeacherStore();
  const { 
    fetchClassrooms, 
    fetchTargetUpgradeClassrooms,
    classrooms, 
    targetClassrooms: storeTargetClassrooms,
    loading: classroomLoading, 
    updateClassroom, 
    deleteClassroom, 
    createClassroom, 
    createStudent,
    updateStudent,
    deleteStudent,
    promotedStudents
  } = useClassroomStore();
  
  // State untuk user dari localStorage
  const [user, setUser] = useState<{
    fullname: string;
    degree: string;
    username: string;
    role: 'admin' | 'teacher';
    photo: string;
  } | null>(null);

  // State untuk academic year
  const [currentAcademicYear, setCurrentAcademicYear] = useState<{
    id: string;
    name: string;
    periode: string;
    is_promoted: boolean;
  } | null>(null);

  // State untuk UI
  const [error, setError] = useState<string | null>(null);
  const [expandedClassroom, setExpandedClassroom] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  
  // State untuk fitur naik kelas - default false
  const [isUpgradeAvailable, setIsUpgradeAvailable] = useState<boolean>(false);
  
  // Modal states
  const [classroomModal, setClassroomModal] = useState<{ isOpen: boolean; classroom?: Classroom }>({ isOpen: false });
  const [studentModal, setStudentModal] = useState<{ isOpen: boolean; student?: Student; classroomId?: string }>({ isOpen: false });
  const [deleteModal, setDeleteModal] = useState<{ 
    isOpen: boolean; 
    type: 'classroom' | 'student'; 
    item: Classroom | Student | null 
  }>({ 
    isOpen: false, 
    type: 'classroom', 
    item: null 
  });
  const [upgradeModal, setUpgradeModal] = useState<{ 
    isOpen: boolean; 
    classroom?: Classroom; 
    students?: Student[];
  }>({ isOpen: false });
  
  // State untuk menyimpan siswa yang akan di-upgrade
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [targetClassroomId, setTargetClassroomId] = useState<string>('');

  // Inisialisasi user dan academic year dari localStorage
  useEffect(() => {
    const loadUserAndAcademicYear = () => {
      try {
        // Load user
        const userData = getUserFromLocalStorage();
        if (userData) {
          setUser(userData);
        } else {
          // console.warn('No user found in localStorage');
          setError('Silakan login terlebih dahulu');
          return;
        }

        // Load academic year dari auth store
        const authState = getAuthFromLocalStorage();
        if (authState?.academic_year) {
          setCurrentAcademicYear(authState.academic_year);
          
          // Cek apakah academic year memiliki is_promoted: true
          const isPromoted = Boolean(
            authState.academic_year.is_promoted
            && authState.academic_year.periode === 'genap'
          );
          setIsUpgradeAvailable(isPromoted);
          
          // console.log('Academic year loaded:', {
          //   name: authState.academic_year.name,
          //   is_promoted: authState.academic_year.is_promoted,
          //   isPromotedBoolean: isPromoted,
          //   upgradeAvailable: isPromoted
          // });
        } else {
          // console.warn('No academic year found in auth store');
          setIsUpgradeAvailable(false);
        }
        
      } catch (error) {
        console.error('Error loading user/academic year from localStorage:', error);
        setError('Gagal memuat data pengguna');
      }
    };

    loadUserAndAcademicYear();
    
    // Listen for storage changes (untuk update academic year)
    const handleStorageChange = () => {
      loadUserAndAcademicYear();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom academic year update event
    window.addEventListener('academicYearUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('academicYearUpdated', handleStorageChange);
    };
  }, []);

  // Check user role and permissions
  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";
  const canEditClassroom = isAdmin;
  const canEditStudent = isAdmin || isTeacher;
  const canAddClassroom = isAdmin;
  
  // Permission untuk fitur naik kelas - hanya jika academic year is_promoted: true
  const canUpgradeClass = isUpgradeAvailable && isAdmin;

  // Load target classrooms untuk tujuan naik kelas
  const loadTargetClassrooms = useCallback(async () => {
    try {
      // console.log('Loading target classrooms for role:', user?.role);
      
      // Hanya load target classrooms jika upgrade available
      if (isUpgradeAvailable) {
        await fetchTargetUpgradeClassrooms();
      } else {
        // console.log('Skipping target classrooms load - upgrade not available');
      }
    } catch (err) {
      console.error('Error loading target classrooms:', err);
    }
  }, [user, fetchTargetUpgradeClassrooms, isUpgradeAvailable]);

  // Set upgrade available berdasarkan academic year dan load target classrooms
  useEffect(() => {
    if (user && currentAcademicYear) {
      loadTargetClassrooms();
    }
  }, [user, currentAcademicYear, loadTargetClassrooms]);

  // Detect screen size for responsive view
  useEffect(() => {
    const checkScreenSize = () => {
      setViewMode(window.innerWidth < 768 ? 'card' : 'table');
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Fetch all data
  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // Pastikan user sudah tersedia
      if (!user) {
        const userData = getUserFromLocalStorage();
        if (!userData) {
          throw new Error('User tidak ditemukan, silakan login kembali');
        }
        setUser(userData);
      }

      // console.log('Fetching data for role:', user?.role, isAdmin, isTeacher);

      if (isAdmin) {
        // Admin bisa melihat semua kelas
        await Promise.all([
          fetchClassrooms(),
          fetchTeachers()
        ]);
      } else if (isTeacher) {
        // Teacher hanya melihat kelas yang diajar
        await Promise.all([
          fetchClassrooms(),
          fetchTeachers()
        ]);
      }
      
      // Hanya load target classrooms jika upgrade available
      if (isUpgradeAvailable) {
        await loadTargetClassrooms();
      }
      
    } catch (err: any) {
      setError('Gagal memuat data');
      toast.error(err.message || 'Terjadi kesalahan');
      console.error('Error fetching data:', err);
    }
  }, [user, isAdmin, isTeacher, fetchClassrooms, fetchTeachers, loadTargetClassrooms, isUpgradeAvailable]);

  // Fetch data ketika user sudah tersedia
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const toggleStudents = (classroomId: string) => {
    setExpandedClassroom(expandedClassroom === classroomId ? null : classroomId);
  };

  // CRUD Operations for Classrooms and Students
  const handleCreateClassroom = async (data: any) => {
    if (!canAddClassroom) {
      toast.error("Anda tidak memiliki akses untuk menambah kelas");
      return;
    }

    try {
      const resp: any = await createClassroom(data);
      toast.success(resp.message || "Kelas berhasil ditambahkan");
      await fetchData();
      setClassroomModal({ isOpen: false });
    } catch (err: any) {
      toast.error(err.message || "Gagal menambah kelas");
    }
  };

  const handleUpdateClassroom = async (data: any) => {
    if (!canEditClassroom) {
      toast.error("Anda tidak memiliki akses untuk mengedit kelas");
      return;
    }
    
    const classroomId = classroomModal.classroom?.id;
    
    if (!classroomId) {
      toast.error("ID kelas tidak ditemukan");
      return;
    }
    
    try {
      const resp: any = await updateClassroom(classroomId, data);
      toast.success(resp.message || "Kelas berhasil diperbarui");
      await fetchData();
      setClassroomModal({ isOpen: false });
    } catch (err: any) {
      toast.error(err.message || "Gagal memperbarui kelas");
    }
  };

  const handleDeleteClassroom = async () => {
    if (!canEditClassroom) {
      toast.error("Anda tidak memiliki akses untuk menghapus kelas");
      return;
    }
    
    const classroom = deleteModal.item as Classroom;
    const classroomId = classroom?.id;
    
    if (!classroomId) {
      toast.error("ID kelas tidak ditemukan");
      return;
    }
    
    try {
      const resp: any = await deleteClassroom(classroomId);
      toast.success(resp.message || "Kelas berhasil dihapus");
      await fetchData();
      setDeleteModal({ isOpen: false, type: 'classroom', item: null });
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus kelas");
    }
  };

  const handleDeleteStudent = async () => {
    if (!canEditStudent) {
      toast.error("Anda tidak memiliki akses untuk menghapus siswa");
      return;
    }
    
    const student = deleteModal.item as Student;
    const studentId = student?.id;
    
    if (!studentId) {
      toast.error("ID siswa tidak ditemukan");
      return;
    }
    
    try {
      const resp: any = await deleteStudent(studentId);
      toast.success(resp.message || "Siswa berhasil dihapus");
      await fetchData();
      setDeleteModal({ isOpen: false, type: 'student', item: null });
    } catch (err: any) {
      toast.error(err.message || "Gagal menghapus siswa");
    }
  };

  const handleCreateStudent = async (data: FormData) => {
    if (!canEditStudent) {
      toast.error("Anda tidak memiliki akses untuk menambah siswa");
      return;
    }

    try {
      const resp: any = await createStudent(data);
      toast.success(resp.message || "Siswa berhasil ditambahkan");
      await fetchData();
      setStudentModal({ isOpen: false });
    } catch (err: any) {
      console.error('Error creating student:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Gagal menambah siswa';
      toast.error(errorMessage);
    }
  };

  const handleUpdateStudent = async (data: FormData) => {
    if (!canEditStudent) {
      toast.error("Anda tidak memiliki akses untuk mengedit siswa");
      return;
    }

    const studentId = studentModal.student?.id;
    
    if (!studentId) {
      toast.error("ID siswa tidak ditemukan");
      return;
    }

    try {
      const resp: any = await updateStudent(studentId, data);
      toast.success(resp.message || "Siswa berhasil diperbarui");
      await fetchData();
      setStudentModal({ isOpen: false });
    } catch (err: any) {
      console.error('Error updating student:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Gagal mengupdate siswa';
      toast.error(errorMessage);
    }
  };

  // Handle upgrade class dengan seleksi siswa
  const handleUpgradeStudents = async (studentIds: string[], targetClassroomId: string) => {
    if (!canUpgradeClass) {
      toast.error("Fitur naik kelas tidak tersedia untuk tahun akademik ini");
      return;
    }

    if (studentIds.length === 0) {
      toast.error("Pilih minimal satu siswa untuk dinaikkan");
      return;
    }

    if (!targetClassroomId) {
      toast.error("Pilih kelas tujuan");
      return;
    }

    try {
      const targetClassroom = storeTargetClassrooms.find(c => c.id === targetClassroomId);
      if (!targetClassroom) {
        toast.error("Kelas tujuan tidak ditemukan");
        return;
      }

      if (upgradeModal.classroom && targetClassroomId === upgradeModal.classroom.id) {
        toast.error("Tidak bisa menaikkan ke kelas yang sama");
        return;
      }

      const resp: any = await promotedStudents(studentIds, targetClassroomId);
      toast.success(resp.message || "Siswa berhasil dinaikkan kelas");
      
      await fetchData();
      
      setUpgradeModal({ isOpen: false });
      setSelectedStudents([]);
      setTargetClassroomId('');
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan saat menaikkan kelas siswa");
    }
  };

  // Handle open upgrade modal
  const handleOpenUpgradeModal = (classroom: Classroom) => {
    if (!canUpgradeClass) {
      toast.error("Fitur naik kelas tidak tersedia untuk tahun akademik ini");
      return;
    }
    
    const classroomStudents = (classroom as any).students || [];
    
    setUpgradeModal({ 
      isOpen: true, 
      classroom, 
      students: classroomStudents 
    });
    
    setSelectedStudents([]);
    setTargetClassroomId('');
  };

  // Handle select/deselect all students
  const handleSelectAllStudents = () => {
    if (!upgradeModal.students) return;
    
    if (selectedStudents.length === upgradeModal.students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents([...upgradeModal.students]);
    }
  };

  // Handle select/deselect single student
  const handleToggleStudent = (student: Student) => {
    const isSelected = selectedStudents.some(s => s.id === student.id);
    
    if (isSelected) {
      setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
  };

  // Filter kelas tujuan berdasarkan role user
  const getTargetClassroomsForModal = () => {
    if (!upgradeModal.classroom) return storeTargetClassrooms;
    
    const currentClassroom = upgradeModal.classroom;
    return storeTargetClassrooms.filter(c => c.id !== currentClassroom.id);
  };

  const loading = classroomLoading || !user;

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-8">
          <HeaderComponent />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">Data Kelas</h1>
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

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['admin', 'teacher']}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-8">
          <HeaderComponent />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
              <div className="text-red-600 mb-4">{error}</div>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
              >
                <ChartBarIcon className="w-4 h-4" />
                Coba Lagi
              </button>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['admin', 'teacher']}>
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
                    Data Kelas
                  </h1>
                  <p className="text-gray-600">Manajemen data kelas dan siswa</p>
                  
                  {/* User Info dan Academic Year */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {user && (
                      <>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? 'Administrator' : 'Teacher'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {user.fullname} {user.degree && `(${user.degree})`}
                        </span>
                      </>
                    )}
                    {currentAcademicYear && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-gray-500">
                          Tahun Akademik:
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          currentAcademicYear.is_promoted
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {currentAcademicYear.name} ({currentAcademicYear.periode})
                          {currentAcademicYear.is_promoted ? (
                            <span className="ml-1">✓</span>
                          ) : ''}
                        </span>
                      </div>
                    )}
                    {isTeacher && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {classrooms.length} Kelas Diajar
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  {/* View Toggle for larger screens */}
                  <div className="hidden md:flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('card')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-1 ${
                        viewMode === 'card' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Squares2X2Icon className="w-4 h-4" />
                      Card
                    </button>
                    <button
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-1 ${
                        viewMode === 'table' 
                          ? 'bg-white text-gray-900 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <TableCellsIcon className="w-4 h-4" />
                      Table
                    </button>
                  </div>

                  {/* Add Classroom Button - Only for admin */}
                  {canAddClassroom && (
                    <button
                      onClick={() => setClassroomModal({ isOpen: true })}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                    >
                      <PlusIcon className="w-4 h-4" />
                      <span>Tambah Kelas</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Informasi fitur naik kelas - Update dengan kondisi is_promoted */}
            {isUpgradeAvailable ? (
 <div className={`p-4 border-b border-gray-200 ${
              isUpgradeAvailable 
                ? 'bg-gradient-to-r from-green-50 to-blue-50' 
                : 'bg-gradient-to-r from-yellow-50 to-orange-50'
            }`}>
              <div className="flex items-center gap-3">
                {isUpgradeAvailable ? (
                  <ArrowUpIcon className="w-6 h-6 text-green-600" />
                ) : (
                  <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
                )}
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {isUpgradeAvailable 
                      ? 'Fitur Naik Kelas Tersedia' 
                      : 'Fitur Naik Kelas Tidak Tersedia'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {isUpgradeAvailable 
                      ? (isAdmin 
                          ? "Admin dapat menaikkan siswa ke semua kelas" 
                          : "Teacher dapat menaikkan siswa ke kelas yang diajar")
                      : "Tahun akademik saat ini belum di-promote. Fitur naik kelas hanya tersedia untuk tahun akademik yang telah di-promote."
                    }
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {isUpgradeAvailable 
                      ? `${storeTargetClassrooms.length} kelas tersedia sebagai tujuan`
                      : "Hubungi administrator untuk mengaktifkan fitur naik kelas"
                    }
                  </p>
                </div>
              </div>
            </div>
            ) : null}
           

            {/* Content */}
            <div className="p-4 sm:p-6">
              {classrooms.length === 0 ? (
                <div className="text-center py-12">
                  <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <div className="text-gray-500 text-lg mb-2">
                    {isAdmin ? 'Belum ada data kelas' : 'Anda belum mengajar kelas apapun'}
                  </div>
                  {canAddClassroom && (
                    <button
                      onClick={() => setClassroomModal({ isOpen: true })}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2 mx-auto"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Tambah Kelas Pertama
                    </button>
                  )}
                </div>
              ) : viewMode === 'card' ? (
                <div className="grid gap-4 sm:gap-6">
                  {classrooms.map((classroom) => (
                    <ClassroomCard
                      key={classroom.id}
                      classroom={classroom}
                      isExpanded={expandedClassroom === classroom.id}
                      onToggle={() => toggleStudents(classroom.id)}
                      onEdit={(cls) => setClassroomModal({ isOpen: true, classroom: cls })}
                      onDelete={(cls) => setDeleteModal({ isOpen: true, type: 'classroom', item: cls })}
                      onUpgrade={(cls) => handleOpenUpgradeModal(cls)}
                      onAddStudent={(classroomId) => setStudentModal({ isOpen: true, classroomId })}
                      onEditStudent={(student) => setStudentModal({ isOpen: true, student })}
                      onDeleteStudent={(student) => setDeleteModal({ isOpen: true, type: 'student', item: student })}
                      canEditClassroom={canEditClassroom}
                      canEditStudent={canEditStudent}
                      canUpgradeClass={canUpgradeClass}
                      isUpgradeEnabled={isUpgradeAvailable}
                    />
                  ))}
                </div>
              ) : (
                <ClassroomTable
                  classrooms={classrooms}
                  expandedClassroom={expandedClassroom}
                  onToggle={toggleStudents}
                  onEdit={(cls) => setClassroomModal({ isOpen: true, classroom: cls })}
                  onDelete={(cls) => setDeleteModal({ isOpen: true, type: 'classroom', item: cls })}
                  onUpgrade={(cls) => handleOpenUpgradeModal(cls)}
                  onAddStudent={(classroomId) => setStudentModal({ isOpen: true, classroomId })}
                  onEditStudent={(student) => setStudentModal({ isOpen: true, student })}
                  onDeleteStudent={(student) => setDeleteModal({ isOpen: true, type: 'student', item: student })}
                  canEditClassroom={canEditClassroom}
                  canEditStudent={canEditStudent}
                  canUpgradeClass={canUpgradeClass}
                  isUpgradeEnabled={isUpgradeAvailable}
                />
              )}
            </div>
          </div>
        </main>

        {/* Modals */}
        <ClassroomModal
          isOpen={classroomModal.isOpen}
          onClose={() => setClassroomModal({ isOpen: false })}
          onSave={classroomModal.classroom ? handleUpdateClassroom : handleCreateClassroom}
          classroom={classroomModal.classroom}
          teachers={teachers}
          canEdit={classroomModal.classroom ? canEditClassroom : canAddClassroom}
        />

        <StudentModal
          isOpen={studentModal.isOpen}
          onClose={() => setStudentModal({ isOpen: false })}
          onSave={studentModal.student ? handleUpdateStudent : handleCreateStudent}
          student={studentModal.student}
          classroomId={studentModal.classroomId}
          canEdit={studentModal.student ? canEditStudent : true}
        />

        <DeleteConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, type: 'classroom', item: null })}
          onConfirm={deleteModal.type === 'classroom' ? handleDeleteClassroom : handleDeleteStudent}
          type={deleteModal.type}
          name={deleteModal.type === 'classroom' 
            ? (deleteModal.item as Classroom)?.name || ''
            : (deleteModal.item as Student)?.fullname || ''
          }
          canDelete={deleteModal.type === 'classroom' ? canEditClassroom : canEditStudent}
        />

        {/* Upgrade Student Modal dengan seleksi */}
        <UpgradeStudentModal
          isOpen={upgradeModal.isOpen}
          onClose={() => {
            setUpgradeModal({ isOpen: false });
            setSelectedStudents([]);
            setTargetClassroomId('');
          }}
          onConfirm={() => handleUpgradeStudents(
            selectedStudents.map(s => s.id),
            targetClassroomId
          )}
          classroom={upgradeModal.classroom}
          students={upgradeModal.students || []}
          selectedStudents={selectedStudents}
          targetClassroomId={targetClassroomId}
          targetClassrooms={getTargetClassroomsForModal()}
          onSelectAll={handleSelectAllStudents}
          onToggleStudent={handleToggleStudent}
          onSelectTargetClassroom={setTargetClassroomId}
          canUpgrade={canUpgradeClass}
        />
      </div>
    </ProtectedRoute>
  );
}

export default ClassroomsPage;
