'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  DocumentArrowDownIcon, 
  MagnifyingGlassIcon, 
  UserIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  XMarkIcon,
  FunnelIcon,
  TableCellsIcon,
  Squares2X2Icon,
  ChevronUpDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { useClassroomStore } from '@/src/state/ClassroomStore';
import { useReportStore } from '@/src/state/ReportStore';
import { StudentDetailModal } from './StudentDetailModal';
import { useRouter } from "next/navigation";

const goToStudentDetail = (router: ReturnType<typeof useRouter>, studentId: string) => {
  router.push(`/reports/students/${studentId}`);
};

// Types
export type AttendanceStatus = 'present' | 'absent' | 'sick' | 'permission';
export type AccomplishmentType = 'skill' | 'knowledge';

export interface Accomplishment {
  id: string;
  name: string;
  type: AccomplishmentType;
  score: number;
  is_capable: boolean;
}

interface Subject {
  id: string;
  name: string;
  accomplishments: Accomplishment[];
}

interface Schedule {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  subject: Subject;
}

interface Attendance {
  status: AttendanceStatus;
  schedule: Schedule;
}

interface AverageScores {
  creativity1: number;
  creativity2: number;
  attitude: number;
  skill: number;
}

interface StudentSummary {
  attendance_percentage: number;
  final_score: number;
  average_scores: AverageScores;
  rank: number;
}

export interface Student {
  id: string;
  fullname: string;
  attendances: Attendance[];
  summary: StudentSummary;
}

interface ClassroomTeacher {
  id: string;
  full_name: string;
}

interface Classroom {
  id: string;
  name: string;
  teacher: ClassroomTeacher;
}

interface AcademicYear {
  id: string;
  name: string;
  periode: string;
}

interface TopStudent {
  id: string;
  fullname: string;
  final_score: number;
}

interface Summary {
  total_students: number;
  average_final_score: number;
  top_student: TopStudent;
}

export interface StudentTabData {
  classroom: Classroom;
  academic_year: AcademicYear;
  summary: Summary;
  students: Student[];
}

interface StudentTabProps {
  onGenerateStudentReport: (studentId: string) => void;
  onGenerateBulkReport: () => void;
  isAdmin: boolean;
  currentUser: any;
}

export interface SortConfig {
  key: keyof Student | 'summary.final_score' | 'summary.attendance_percentage' | 'summary.average_scores.skill' | 'summary.rank';
  direction: 'asc' | 'desc';
}

// Helper components
const LoadingSkeleton: React.FC = () => (
  <div className="space-y-3">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="bg-white rounded-xl border shadow-sm p-4 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {[...Array(3)].map((_, j) => (
            <div key={j} className="space-y-2">
              <div className="h-3 bg-gray-200 rounded w-16"></div>
              <div className="h-4 bg-gray-200 rounded w-8"></div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const ErrorDisplay: React.FC<{ error: string; onRetry: () => void }> = ({ error, onRetry }) => (
  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
    <div className="flex items-center gap-3">
      <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
      <div className="flex-1">
        <div className="text-sm font-medium text-red-800">Gagal memuat data</div>
        <div className="text-xs text-red-600 mt-1">{error}</div>
      </div>
      <button
        onClick={onRetry}
        className="text-sm text-red-700 hover:text-red-800 underline"
      >
        Coba lagi
      </button>
    </div>
  </div>
);

const EmptyState: React.FC<{ 
  title: string; 
  description: string;
  searchQuery?: string;
  onReset?: () => void;
}> = ({ title, description, searchQuery, onReset }) => (
  <div className="text-center py-12">
    <UserIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
    <div className="text-lg font-medium text-gray-600 mb-2">{title}</div>
    <div className="text-sm text-gray-500">{description}</div>
    {searchQuery && onReset && (
      <button
        onClick={onReset}
        className="mt-4 text-sm text-blue-600 hover:text-blue-800 underline"
      >
        Reset pencarian
      </button>
    )}
  </div>
);

const ScoreBadge: React.FC<{ score: number }> = ({ score }) => {
  const getColorClass = (score: number): string => {
    if (score >= 90) return 'bg-green-100 text-green-800';
    if (score >= 80) return 'bg-blue-100 text-blue-800';
    if (score >= 70) return 'bg-yellow-100 text-yellow-800';
    if (score >= 60) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getColorClass(score)}`}>
      {score.toFixed(1)}
    </span>
  );
};

const AttendanceBadge: React.FC<{ percentage: number }> = ({ percentage }) => {
  const getColorClass = (percentage: number): string => {
    if (percentage >= 90) return 'bg-green-100 text-green-800';
    if (percentage >= 80) return 'bg-blue-100 text-blue-800';
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getColorClass(percentage)}`}>
      {percentage}%
    </span>
  );
};

// Main StudentTab Component
export const StudentTab: React.FC<StudentTabProps> = ({
  onGenerateStudentReport,
  onGenerateBulkReport,
  isAdmin,
  currentUser,
}) => {
  // Zustand stores
  const { classrooms, loading: classroomsLoading, fetchClassrooms } = useClassroomStore();
  const { performanceStudents, updatePerformanceStudent, exportPerformanceStudentPDF } = useReportStore();
  const router = useRouter();

  // Local states
  const [selectedClassroom, setSelectedClassroom] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [studentData, setStudentData] = useState<StudentTabData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'summary.rank', direction: 'asc' });
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [isClassroomDropdownOpen, setIsClassroomDropdownOpen] = useState(false);
  const [attendanceFilter, setAttendanceFilter] = useState<string>('all');
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);

  // Effects
  useEffect(() => {
    if (classrooms.length > 0 && !selectedClassroom) {
      setSelectedClassroom(classrooms[0].id);
    }
  }, [classrooms, selectedClassroom]);

  useEffect(() => {
    if (selectedClassroom) {
      loadStudentPerformance(selectedClassroom);
    }
  }, [selectedClassroom]);

  // Functions
  const loadStudentPerformance = async (classroomId: string): Promise<StudentTabData | null> => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await performanceStudents(classroomId);
      
      if (response.success) {
        setStudentData(response.data);
        return response.data;
      } else {
        throw new Error(response.message || 'Gagal memuat data performa siswa');
      }
    } catch (err) {
      console.error('Error loading student performance:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memuat data');
      setStudentData(null);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateScore = async (
    accomplishmentStudentId: string,
    accomplishmentName: string, 
    newScore: number, 
    attendanceId: string, 
    type: AccomplishmentType,
    isCapable?: boolean
  ) => {
    try {
      const payload = {
        accomplishmentStudentId,
        accomplishmentName,
        newScore,
        attendanceId,
        type,
        isCapable
      };
      
      const response: any = await updatePerformanceStudent(
        selectedStudent?.id || '',
        payload
      );

      if (response.success) {
        const updatedData = await loadStudentPerformance(selectedClassroom);
        
        if (updatedData?.students) {
          const updatedStudent = updatedData.students.find(s => s.id === selectedStudent?.id);
          if (updatedStudent) {
            setSelectedStudent(updatedStudent);
          }
        }
        
        return response;
      } else {
        throw new Error(response.message || 'Gagal update nilai');
      }
    } catch (error) {
      console.error('Error updating score:', error);
      throw error;
    }
  };

  const filteredStudents = useMemo(() => {
    if (!studentData?.students) return [];

    let result = [...studentData.students];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(student =>
        student.fullname.toLowerCase().includes(query)
      );
    }

    // Attendance filter
    if (attendanceFilter !== 'all') {
      result = result.filter(student => {
        if (attendanceFilter === 'high') {
          return student.summary.attendance_percentage >= 80;
        } else if (attendanceFilter === 'medium') {
          return student.summary.attendance_percentage >= 60 && student.summary.attendance_percentage < 80;
        } else if (attendanceFilter === 'low') {
          return student.summary.attendance_percentage < 60;
        }
        return true;
      });
    }

    // Sort
    if (sortConfig) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortConfig.key) {
          case 'summary.final_score':
            aValue = a.summary.final_score;
            bValue = b.summary.final_score;
            break;
          case 'summary.attendance_percentage':
            aValue = a.summary.attendance_percentage;
            bValue = b.summary.attendance_percentage;
            break;
          case 'summary.average_scores.skill':
            aValue = a.summary.average_scores.skill;
            bValue = b.summary.average_scores.skill;
            break;
          case 'summary.rank':
            aValue = a.summary.rank;
            bValue = b.summary.rank;
            break;
          case 'fullname':
            aValue = a.fullname;
            bValue = b.fullname;
            break;
          default:
            aValue = a[sortConfig.key as keyof Student];
            bValue = b[sortConfig.key as keyof Student];
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [studentData, searchQuery, sortConfig, attendanceFilter]);

  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const resetFilters = () => {
    setSearchQuery('');
    setAttendanceFilter('all');
    setSortConfig({ key: 'summary.rank', direction: 'asc' });
  };

const handleDownloadStudentPDF = async (e: React.MouseEvent, studentId: string) => {
    e.stopPropagation();
    if (downloadingPdf === studentId) return;
    setDownloadingPdf(studentId);
    try {
      await exportPerformanceStudentPDF(studentId);
    } catch (error: any) {
      console.error('Error downloading PDF:', error);
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handleResetSearch = () => {
    setSearchQuery('');
  };

  const selectedClassroomObj = classrooms.find(c => c.id === selectedClassroom);
  return (
    <div className="space-y-6 pb-6">
      

      {/* Main Card - All Controls in Header */}
      {!selectedClassroom && !classroomsLoading ? (
        <EmptyState
          title="Pilih Kelas Terlebih Dahulu"
          description="Silakan pilih kelas untuk melihat data siswa"
        />
      ) : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {/* ==================== ALL CONTROLS IN HEADER ==================== */}
          <div className="border-b bg-gray-50/80">
  <div className="p-4 space-y-4">
    {/* Row 1: Classroom Selection + Refresh Button - Mobile Friendly */}
    <div className="flex gap-2">
      <div className="relative flex-1">
        <label className="block text-xs font-medium text-gray-500 mb-1">
          Kelas
        </label>
        <button
          onClick={() => setIsClassroomDropdownOpen(!isClassroomDropdownOpen)}
          disabled={classroomsLoading}
          className="w-full flex items-center justify-between px-3 py-2 text-sm border rounded-lg bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          <span className="truncate">
            {selectedClassroomObj ? selectedClassroomObj.name : 'Pilih Kelas'}
          </span>
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${isClassroomDropdownOpen ? 'rotate-180' : ''}`} />
        </button>
        
        {isClassroomDropdownOpen && (
          <>
            <div 
              className="fixed inset-0 z-10"
              onClick={() => setIsClassroomDropdownOpen(false)}
            />
            <div className="absolute left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
              {classrooms.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500">Tidak ada kelas</div>
              ) : (
                classrooms.map(c => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedClassroom(c.id);
                      setIsClassroomDropdownOpen(false);
                      resetFilters();
                    }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                      selectedClassroom === c.id ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    {c.name}
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Refresh Button - Mobile */}
      <div className="flex items-end">
        <button
          onClick={() => {
            fetchClassrooms();
            if (selectedClassroom) {
              loadStudentPerformance(selectedClassroom);
            }
          }}
          disabled={loading || classroomsLoading}
          className="px-3 py-2 flex items-center gap-2 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 text-sm"
          title="Refresh"
        >
          <ArrowPathIcon className={`w-4 h-4 ${loading || classroomsLoading ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>
    </div>

    {/* Row 2: Search + Filter Button - Mobile Friendly */}
    <div className="flex gap-2">
      {/* Search Input */}
      <div className="relative flex-1">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari siswa..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={!selectedClassroom || loading}
          className="w-full pl-10 pr-8 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
        />
        {searchQuery && (
          <button
            onClick={handleResetSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Filter Button - Mobile */}
      <div className="relative">
        <button
          onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
          disabled={!selectedClassroom || loading}
          className={`px-3 py-2 text-sm border rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 h-full ${
            attendanceFilter !== 'all' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <FunnelIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Filter</span>
          {attendanceFilter !== 'all' && (
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
          )}
          <ChevronDownIcon className={`w-4 h-4 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isFilterDropdownOpen && (
          <>
            <div 
              className="fixed inset-0 z-10"
              onClick={() => setIsFilterDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-56 bg-white border rounded-lg shadow-lg z-20">
              <div className="p-2">
                <div className="text-xs font-medium text-gray-500 px-3 py-2">
                  Kehadiran
                </div>
                <button
                  onClick={() => {
                    setAttendanceFilter('all');
                    setIsFilterDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md ${
                    attendanceFilter === 'all' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => {
                    setAttendanceFilter('high');
                    setIsFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50"
                >
                  Tinggi (≥80%)
                </button>
                <button
                  onClick={() => {
                    setAttendanceFilter('medium');
                    setIsFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50"
                >
                  Sedang (60-79%)
                </button>
                <button
                  onClick={() => {
                    setAttendanceFilter('low');
                    setIsFilterDropdownOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-gray-50"
                >
                  Rendah (&lt;60%)
                </button>
              </div>
              {(searchQuery || attendanceFilter !== 'all') && (
                <div className="border-t p-2">
                  <button
                    onClick={() => {
                      resetFilters();
                      setIsFilterDropdownOpen(false);
                    }}
                    className="w-full text-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
                  >
                    Reset semua filter
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>

    {/* Row 3: Download Button (Admin), View Toggle, Info & Active Filters */}
    <div className="space-y-3">
      {/* Download Button for Mobile - Full Width */}
      
      /*
      {isAdmin && (
        <button
          onClick={onGenerateBulkReport}
          disabled={loading || !selectedClassroom || !studentData?.students.length}
          className="w-full px-3 py-2 flex items-center justify-center gap-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-all disabled:opacity-50"
        >
          <DocumentArrowDownIcon className="w-4 h-4" />
          <span>Download Semua Laporan</span>
        </button>
      )}
      */

      {/* View Toggle & Info */}
      <div className="flex items-center justify-between">
        {/* View Toggle */}
        <div className="flex border rounded-lg overflow-hidden">
          <button
            onClick={() => setViewMode('table')}
            disabled={!selectedClassroom || loading}
            className={`px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
              viewMode === 'table' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            title="Tampilan Tabel"
          >
            <TableCellsIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            disabled={!selectedClassroom || loading}
            className={`px-3 py-2 text-sm transition-colors disabled:opacity-50 ${
              viewMode === 'grid' 
                ? 'bg-blue-600 text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
            title="Tampilan Grid"
          >
            <Squares2X2Icon className="w-4 h-4" />
          </button>
        </div>

        {/* Student Count Info */}
        {studentData && (
          <div className="text-sm">
            <span className="font-medium text-gray-900">
              {filteredStudents.length}
            </span>
            <span className="text-gray-500">/{studentData.students.length}</span>
          </div>
        )}
      </div>

      {/* Active Filters & Academic Year */}
      {studentData && (
        <div className="space-y-2">
          {/* Academic Year Badge */}
          {studentData.academic_year && (
            <div className="text-xs text-gray-400">
              {studentData.academic_year.name} ({studentData.academic_year.periode})
            </div>
          )}

          {/* Active Filters */}
          {(searchQuery || attendanceFilter !== 'all') && (
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-gray-500">Filter:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {searchQuery}
                  <button onClick={handleResetSearch} className="hover:text-blue-900">
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
              {attendanceFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                  {attendanceFilter === 'high' ? 'Kehadiran ≥80%' :
                   attendanceFilter === 'medium' ? 'Kehadiran 60-79%' : 'Kehadiran <60%'}
                  <button onClick={() => setAttendanceFilter('all')} className="hover:text-blue-900">
                    <XMarkIcon className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                onClick={resetFilters}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  </div>
</div>

          {/* Error State */}
          {error && (
            <div className="p-4">
              <ErrorDisplay error={error} onRetry={() => selectedClassroom && loadStudentPerformance(selectedClassroom)} />
            </div>
          )}

          {/* Loading State */}
          {loading && selectedClassroom && (
            <div className="p-4">
              <LoadingSkeleton />
            </div>
          )}

          {/* Data Content */}
          {!loading && selectedClassroom && !error && studentData && (
            <div className="p-4">
              {filteredStudents.length > 0 ? (
                <>
                  {/* Desktop Table View */}
                  <div className="hidden md:block">
                    {viewMode === 'table' ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('summary.rank')}
                              >
                                <div className="flex items-center gap-1">
                                  Rank
                                  {sortConfig.key === 'summary.rank' && (
                                    <span className="text-gray-400">
                                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('fullname')}
                              >
                                <div className="flex items-center gap-1">
                                  Nama Siswa
                                  {sortConfig.key === 'fullname' && (
                                    <span className="text-gray-400">
                                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('summary.final_score')}
                              >
                                <div className="flex items-center gap-1">
                                  Nilai Akhir
                                  {sortConfig.key === 'summary.final_score' && (
                                    <span className="text-gray-400">
                                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('summary.attendance_percentage')}
                              >
                                <div className="flex items-center gap-1">
                                  Kehadiran
                                  {sortConfig.key === 'summary.attendance_percentage' && (
                                    <span className="text-gray-400">
                                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th 
                                scope="col" 
                                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                onClick={() => handleSort('summary.average_scores.skill')}
                              >
                                <div className="flex items-center gap-1">
                                  Skill Rata-rata
                                  {sortConfig.key === 'summary.average_scores.skill' && (
                                    <span className="text-gray-400">
                                      {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                    </span>
                                  )}
                                </div>
                              </th>
                              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Aksi
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStudents.map((student) => (
                              <tr key={student.id} className="hover:bg-gray-50">
                                <td className="px-4 py-4 whitespace-nowrap text-center">
                                  <div className={`w-8 h-8 flex items-center justify-center rounded-full mx-auto ${
                                    student.summary.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                                    student.summary.rank <= 3 ? 'bg-orange-100 text-orange-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    <span className="text-sm font-bold">#{student.summary.rank}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10">
                                      <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                                        <UserIcon className="w-6 h-6 text-blue-500" />
                                      </div>
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-sm font-medium text-gray-900">
                                        {student.fullname}
                                      </div>
                                      {/* <div className="text-xs text-gray-500">
                                        {student.attendances.length} sesi
                                      </div> */}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <ScoreBadge score={student.summary.final_score} />
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <AttendanceBadge percentage={student.summary.attendance_percentage} />
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <ScoreBadge score={student.summary.average_scores.skill} />
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                  <button
                                    onClick={() => goToStudentDetail(router, student.id)}
                                    className="px-3 py-1.5 text-xs bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                                  >
                                    Detail
                                  </button>

                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredStudents.map((student) => (
                          <div
                            key={student.id}
                            className="bg-gradient-to-br from-white to-gray-50 border rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                          >
                            <div className="p-4">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-blue-500" />
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-gray-900">{student.fullname}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                        student.summary.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                                        student.summary.rank <= 3 ? 'bg-orange-100 text-orange-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        Rank #{student.summary.rank}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Nilai Akhir</span>
                                    <span className="font-medium">
                                      {student.summary.final_score.toFixed(1)}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-500 h-2 rounded-full"
                                      style={{ width: `${Math.min(student.summary.final_score, 100)}%` }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-600">Kehadiran</span>
                                    <span className="font-medium">
                                      {student.summary.attendance_percentage}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-green-500 h-2 rounded-full"
                                      style={{ width: `${student.summary.attendance_percentage}%` }}
                                    />
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setIsDetailModalOpen(true);
                                }}
                                className="w-full mt-4 px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                Detail
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Mobile List View */}
                  <div className="md:hidden space-y-3">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => {
                          // setSelectedStudent(student);
                          // setIsDetailModalOpen(true);
                          return router.push(`reports/students/${student.id}`);
                        }}
                        className="bg-white rounded-xl border shadow-sm p-4 active:bg-gray-50 transition-colors cursor-pointer hover:shadow-md"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-bold text-blue-600">
                                #{student.summary.rank}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-900 truncate">
                                {student.fullname}
                              </div>
                              {/* <div className="text-xs text-gray-500 mt-0.5">
                                {student.attendances.length} sesi kehadiran
                              </div> */}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <div className="text-sm font-bold text-gray-900">
                                {student.summary.final_score.toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-500">Nilai</div>
                            </div>
                            <ChevronDownIcon className="w-5 h-5 text-gray-400 -rotate-90" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState
                  title={searchQuery ? 'Tidak ada siswa yang sesuai' : 'Belum ada data siswa di kelas ini'}
                  description={searchQuery ? 'Coba ubah kata kunci pencarian' : 'Data siswa akan muncul setelah ditambahkan ke kelas ini'}
                  searchQuery={searchQuery}
                  onReset={resetFilters}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Student Detail Modal */}
      <StudentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
        studentData={studentData}
        onUpdateScore={handleUpdateScore}
        onGenerateReport={onGenerateStudentReport}
      />
    </div>
  );
};



