"use client";

import React from 'react';
import { 
  ArrowUpIcon, 
  CheckIcon, 
  XMarkIcon,
  UserIcon,
  AcademicCapIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Classroom, TargetClassroom } from '@/src/domain/ClassroomEntity';
import { Student } from '@/src/domain/StudentEntity';

interface UpgradeStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  classroom?: Classroom;
  students: Student[];
  selectedStudents: Student[];
  targetClassroomId: string;
  targetClassrooms: TargetClassroom[];
  onSelectAll: () => void;
  onToggleStudent: (student: Student) => void;
  onSelectTargetClassroom: (classroomId: string) => void;
  canUpgrade: boolean;
}

const UpgradeStudentModal: React.FC<UpgradeStudentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  classroom,
  students,
  selectedStudents,
  targetClassroomId,
  targetClassrooms,
  onSelectAll,
  onToggleStudent,
  onSelectTargetClassroom,
  canUpgrade
}) => {
 

  const allSelected = selectedStudents.length === students.length && students.length > 0;

  // State untuk mobile view
  const [activeTab, setActiveTab] = React.useState<'students' | 'classroom'>('students');
  const [isStudentsExpanded, setIsStudentsExpanded] = React.useState(true);
  const [isClassroomExpanded, setIsClassroomExpanded] = React.useState(false);

  // Handle swipe untuk mobile
  const [touchStart, setTouchStart] = React.useState<number | null>(null);
  const [touchEnd, setTouchEnd] = React.useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && activeTab === 'students') {
      handleTabChange('classroom');
    } else if (isRightSwipe && activeTab === 'classroom') {
      handleTabChange('students');
    }
  };

  const handleTabChange = (tab: 'students' | 'classroom') => {
    setActiveTab(tab);
    if (tab === 'students') {
      setIsStudentsExpanded(true);
      setIsClassroomExpanded(false);
    } else {
      setIsStudentsExpanded(false);
      setIsClassroomExpanded(true);
    }
  };

  // Cek kapasitas kelas
  const getCapacityStatus = (targetClass: TargetClassroom) => {
    const selectedCount = selectedStudents.length;
    const remainingCapacity = targetClass.available_capacity;
    
    if (selectedCount > remainingCapacity) {
      return {
        status: 'over',
        message: `Kelebihan ${selectedCount - remainingCapacity} siswa`,
        color: 'bg-red-100 text-red-800',
        canSelect: false
      };
    } else if (selectedCount === remainingCapacity) {
      return {
        status: 'full',
        message: 'Kapasitas pas',
        color: 'bg-green-100 text-green-800',
        canSelect: true
      };
    } else {
      return {
        status: 'available',
        message: `Tersedia ${remainingCapacity - selectedCount} kursi`,
        color: 'bg-blue-100 text-blue-800',
        canSelect: true
      };
    }
  };

  React.useEffect(() => {
    if (selectedStudents.length > 0 && activeTab === 'students') {
      setIsClassroomExpanded(true);
    }
  }, [selectedStudents.length, activeTab]);

   if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl lg:max-w-4xl max-h-[90vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <ArrowUpIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                  Naik Kelas
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  Pilih siswa yang akan dinaikkan dan tentukan kelas tujuan
                </p>
                <p className="text-xs sm:text-sm text-gray-600 truncate sm:hidden">
                  {classroom?.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 flex-shrink-0"
              aria-label="Tutup"
            >
              <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="sm:hidden border-b border-gray-200 flex-shrink-0">
          <div className="flex">
            <button
              onClick={() => handleTabChange('students')}
              className={`flex-1 py-3 px-2 text-center font-medium text-xs ${
                activeTab === 'students'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <UserIcon className="w-4 h-4" />
                <span>Siswa</span>
                <span className="text-xs font-semibold">
                  ({selectedStudents.length}/{students.length})
                </span>
              </div>
            </button>
            <button
              onClick={() => handleTabChange('classroom')}
              className={`flex-1 py-3 px-2 text-center font-medium text-xs ${
                activeTab === 'classroom'
                  ? 'border-b-2 border-indigo-600 text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex flex-col items-center justify-center gap-1">
                <AcademicCapIcon className="w-4 h-4" />
                <span>Kelas</span>
              </div>
            </button>
          </div>
        </div>

        {/* Progress Indicator untuk Mobile */}
        <div className="sm:hidden px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${activeTab === 'students' ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
            <div className={`w-2 h-2 rounded-full ${activeTab === 'classroom' ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
          </div>
          <span className="text-xs text-gray-600 ml-2">
            Langkah {activeTab === 'students' ? '1' : '2'} dari 2
          </span>
        </div>

        {/* Content Area - Support Swipe di Mobile */}
        <div 
          className="flex-1 overflow-y-auto"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="p-3 sm:p-4 lg:p-6">
            {/* Desktop Grid / Mobile Tabs Content */}
            <div className="block sm:grid sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column - Student Selection */}
              <div className={`${activeTab === 'students' ? 'block' : 'hidden'} sm:block`}>
                <div className="sm:flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base mb-2 sm:mb-0">
                    Pilih Siswa <span className="text-gray-600">({students.length})</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={onSelectAll}
                      className={`px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 flex items-center gap-1 ${
                        allSelected
                          ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {allSelected ? (
                        <>
                          <XMarkIcon className="w-3 h-3" />
                          <span className="hidden sm:inline">Batalkan Semua</span>
                          <span className="sm:hidden">Batal Semua</span>
                        </>
                      ) : (
                        <>
                          <CheckIcon className="w-3 h-3" />
                          <span className="hidden sm:inline">Pilih Semua</span>
                          <span className="sm:hidden">Semua</span>
                        </>
                      )}
                    </button>
                    <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
                      {selectedStudents.length} dipilih
                    </span>
                  </div>
                </div>

                {/* Mobile Expand/Collapse Button */}
                <div className="sm:hidden mb-3">
                  <button
                    onClick={() => setIsStudentsExpanded(!isStudentsExpanded)}
                    className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        Daftar Siswa
                      </span>
                      <span className="text-sm text-gray-600">
                        ({selectedStudents.length}/{students.length})
                      </span>
                    </div>
                    {isStudentsExpanded ? (
                      <ChevronUpIcon className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>

                {/* Students List */}
                <div className={`${isStudentsExpanded ? 'block' : 'hidden'} sm:block`}>
                  <div className="border border-gray-200 rounded-lg overflow-hidden max-h-[40vh] sm:max-h-[300px] overflow-y-auto">
                    {students.length === 0 ? (
                      <div className="text-center py-8">
                        <UserIcon className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm sm:text-base">Tidak ada siswa di kelas ini</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {students.map((student) => {
                          const isSelected = selectedStudents.some(s => s.id === student.id);
                          
                          return (
                            <div
                              key={student.id}
                              className={`p-3 sm:p-4 flex items-center gap-3 cursor-pointer transition-colors duration-200 ${
                                isSelected 
                                  ? 'bg-indigo-50 border-l-2 sm:border-l-4 border-l-indigo-500' 
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={() => onToggleStudent(student)}
                            >
                              <div className="flex-shrink-0">
                                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                                  isSelected ? 'bg-indigo-100' : 'bg-gray-100'
                                }`}>
                                  {isSelected ? (
                                    <CheckIcon className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-600" />
                                  ) : (
                                    <UserIcon className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                                  )}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5 sm:mb-1">
                                  <p className="font-medium text-gray-900 truncate text-sm sm:text-base">
                                    {student.fullname}
                                  </p>
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0 ${
                                    student.gender === 'male' 
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-pink-100 text-pink-800'
                                  }`}>
                                    {student.gender === 'male' ? 'L' : 'P'}
                                  </span>
                                </div>
                              </div>
                              {student.photo && (
                                <div className="flex-shrink-0">
                                  <img
                                    src={student.photo}
                                    alt={student.fullname}
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selection Summary */}
                  {selectedStudents.length > 0 && (
                    <div className="mt-3 sm:mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckIcon className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm font-medium text-indigo-900">
                            {selectedStudents.length} siswa terpilih
                          </span>
                        </div>
                        <div className="text-sm text-indigo-700 font-medium">
                          {((selectedStudents.length / students.length) * 100).toFixed(0)}%
                        </div>
                      </div>
                      {selectedStudents.length <= 3 && (
                        <div className="mt-2">
                          <p className="text-xs text-indigo-700 truncate">
                            {selectedStudents.map(s => s.fullname).join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mobile Next Button */}
                  {selectedStudents.length > 0 && (
                    <div className="sm:hidden mt-4">
                      <button
                        onClick={() => handleTabChange('classroom')}
                        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                      >
                        <span>Lanjut ke Pilih Kelas</span>
                        <ArrowUpIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Target Class Selection */}
              <div className={`${activeTab === 'classroom' ? 'block' : 'hidden'} sm:block`}>
                <h4 className="font-medium text-gray-900 text-sm sm:text-base mb-4">
                  Pilih Kelas Tujuan
                </h4>
                
                <div className="space-y-4">
                  {/* Current Classroom Info */}
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <AcademicCapIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600">Kelas Asal</p>
                        <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                          {classroom?.name}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="text-xs text-gray-500">
                            {selectedStudents.length} siswa akan dinaikkan
                          </div>
                          {selectedStudents.length > 0 && (
                            <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                          )}
                          <div className="text-xs text-gray-500">
                            Kapasitas: {classroom?.capacity} siswa
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Arrow Separator */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-white px-2">
                        <ArrowUpIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                      </span>
                    </div>
                  </div>

                  {/* Kapasitas Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-blue-900 mb-1">
                          Kapasitas Kelas
                        </p>
                        <p className="text-xs text-blue-700">
                          Anda memilih <span className="font-semibold">{selectedStudents.length} siswa</span>. 
                          Pastikan kelas tujuan memiliki kapasitas yang cukup.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Target Classrooms */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pilih Kelas Tujuan
                    </label>
                    <div className="space-y-2 sm:space-y-3 max-h-[40vh] sm:max-h-[250px] overflow-y-auto">
                      {targetClassrooms.length === 0 ? (
                        <div className="text-center py-6 border border-dashed border-gray-300 rounded-lg">
                          <AcademicCapIcon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-300 mx-auto mb-2" />
                          <p className="text-gray-500 text-sm sm:text-base">Tidak ada kelas tujuan tersedia</p>
                        </div>
                      ) : (
                        targetClassrooms.map((targetClass) => {
                          const isSelected = targetClassroomId === targetClass.id;
                          const capacityStatus = getCapacityStatus(targetClass);
                          
                          return (
                            <div
                              key={targetClass.id}
                              className={`p-3 sm:p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                                isSelected
                                  ? 'border-blue-500 bg-blue-50'
                                  : !capacityStatus.canSelect
                                  ? 'border-red-200 bg-red-50 cursor-not-allowed'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => capacityStatus.canSelect && onSelectTargetClassroom(targetClass.id)}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium text-gray-900 truncate text-sm sm:text-base mb-1">
                                    {targetClass.name}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${capacityStatus.color}`}>
                                      Kapasitas: {targetClass.capacity} siswa
                                    </span>
                                    {targetClass.room_number && (
                                      <span className="text-xs text-gray-500">
                                        Ruang {targetClass.room_number}
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-2">
                                    <div className="text-xs">
                                      <span className="font-medium">Status: </span>
                                      <span className={capacityStatus.status === 'over' ? 'text-red-600' : 'text-gray-600'}>
                                        {selectedStudents.length} siswa akan ditambahkan
                                      </span>
                                    </div>
                                    {capacityStatus.status === 'over' && (
                                      <div className="text-xs text-red-600 mt-1 font-medium">
                                        ⚠️ Melebihi kapasitas! Kurangi jumlah siswa.
                                      </div>
                                    )}
                                    {capacityStatus.status === 'full' && (
                                      <div className="text-xs text-green-600 mt-1">
                                        ✓ Kapasitas pas
                                      </div>
                                    )}
                                    {capacityStatus.status === 'available' && (
                                      <div className="text-xs text-blue-600 mt-1">
                                        ✓ Kapasitas mencukupi
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {isSelected && (
                                  <CheckIcon className="w-5 h-5 text-blue-600 flex-shrink-0 ml-2 mt-0.5" />
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Selected Classroom Info */}
                  {targetClassroomId && (
                    <div className="mt-3 sm:mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                      <div className="flex items-start gap-3">
                        <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-blue-900">
                            Kelas Tujuan Dipilih:
                          </p>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-blue-700 truncate">
                              {targetClassrooms.find(c => c.id === targetClassroomId)?.name}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-blue-600">
                              <span>
                                📊 Kapasitas: {targetClassrooms.find(c => c.id === targetClassroomId)?.capacity} siswa
                              </span>
                              <span>
                                👥 Akan ditambahkan: {selectedStudents.length} siswa
                              </span>
                            </div>
                            {getCapacityStatus(targetClassrooms.find(c => c.id === targetClassroomId)!).status === 'over' && (
                              <div className="text-xs text-red-600 font-medium mt-1">
                                ⚠️ PERINGATAN: Jumlah siswa melebihi kapasitas!
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Information Box */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <XMarkIcon className="w-3 h-3 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-yellow-900 text-sm">
                          Informasi Penting
                        </div>
                        <div className="text-yellow-700 text-xs sm:text-sm mt-1">
                          <ul className="list-disc pl-4 space-y-1">
                            <li>Pastikan kelas tujuan memiliki kapasitas yang cukup</li>
                            <li>Kelas dengan kapasitas tidak cukup ditandai dengan warna merah</li>
                            <li>Kapasitas kelas tidak dapat diubah setelah pemilihan</li>
                            <li>Aksi ini tidak dapat dibatalkan</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile Back Button */}
                  <div className="sm:hidden">
                    <button
                      onClick={() => handleTabChange('students')}
                      className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg font-medium flex items-center justify-center gap-2"
                    >
                      <ChevronDownIcon className="w-4 h-4 transform rotate-90" />
                      Kembali ke Pilih Siswa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at bottom */}
        <div className="border-t border-gray-200 p-3 sm:p-4 lg:p-6 bg-white flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="order-2 sm:order-1 py-3 sm:py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200 text-sm sm:text-base"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={
                !canUpgrade || 
                selectedStudents.length === 0 || 
                !targetClassroomId ||
                getCapacityStatus(targetClassrooms.find(c => c.id === targetClassroomId)!).status === 'over'
              }
              className={`order-1 sm:order-2 py-3 sm:py-2.5 px-4 rounded-lg text-white transition-colors duration-200 flex items-center justify-center gap-2 text-sm sm:text-base ${
                canUpgrade && 
                selectedStudents.length > 0 && 
                targetClassroomId &&
                getCapacityStatus(targetClassrooms.find(c => c.id === targetClassroomId)!).status !== 'over'
                  ? 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              <ArrowUpIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">
                Naikkan {selectedStudents.length} Siswa
              </span>
              <span className="sm:hidden">
                Konfirmasi ({selectedStudents.length})
              </span>
            </button>
          </div>
          
          {/* Error Message jika kapasitas tidak cukup */}
          {targetClassroomId && getCapacityStatus(targetClassrooms.find(c => c.id === targetClassroomId)!).status === 'over' && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <XMarkIcon className="w-4 h-4 text-red-600 flex-shrink-0" />
                <p className="text-xs text-red-700">
                  Tidak dapat melanjutkan: Jumlah siswa ({selectedStudents.length}) melebihi kapasitas kelas ({targetClassrooms.find(c => c.id === targetClassroomId)?.capacity})
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UpgradeStudentModal;
