"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import {
  DocumentArrowDownIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  PrinterIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useAuthStore } from "@/src/state/AuthStore";
import { useReportStore } from "@/src/state/ReportStore";
import {
  Attendance,
  AttendanceResponse,
  AttendanceSummary,
  TeacherAttendancePanelProps,
  AcademicYear
} from "@/src/domain/Attendance";
import { EmptyState, LoadingState } from "./teachers/ReuseComponent";
import { Button } from "./teachers/Button";
import { SummaryCards } from "./teachers/SummaryCards";
import { AttendanceList } from "./teachers/AttendanceList"; // Pastikan ini import yang benar
import { AttendanceDetailModal } from "./teachers/AttendanceDetailModal";
import { DownloadModal } from "./teachers/DownloadModal";
import { MobileFilterDrawer } from "./teachers/MobileFilterDrawer";
import { PrintMonthlyModal } from "./teachers/PrintMonthlyModal";
import { apiClient } from "@/src/infrastructure/Instance";
import { DateRangeModal } from "./teachers/DateRangeModal";

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

export const formatDate = (
  dateString: string,
  options: Intl.DateTimeFormatOptions = {}
) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  });
};

export const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getFirstDayOfMonth = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
};

export const getLastDayOfMonth = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const lastDay = new Date(year, date.getMonth() + 1, 0).getDate();
  return `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
};

export const getCurrentMonthRange = () => {
  const today = new Date();
  return {
    startDate: getFirstDayOfMonth(today),
    endDate: getLastDayOfMonth(today)
  };
};

// Fungsi untuk navigate ke bulan sebelumnya/sesudahnya
export const getPreviousMonthRange = (currentDate: Date) => {
  const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  return {
    startDate: getFirstDayOfMonth(prevMonth),
    endDate: getLastDayOfMonth(prevMonth),
    month: prevMonth
  };
};

export const getNextMonthRange = (currentDate: Date) => {
  const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  return {
    startDate: getFirstDayOfMonth(nextMonth),
    endDate: getLastDayOfMonth(nextMonth),
    month: nextMonth
  };
};

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export const calculateAttendanceRate = (summary: AttendanceSummary): number => {
  const totalExpected = summary.total_attendances || 1;
  const presentCount = summary.present_count || 0;
  return Math.round((presentCount / totalExpected) * 100);
};

// =============================================================================
// TYPES
// =============================================================================

interface DateRange {
  start_date: string;
  end_date: string;
}

interface AttendanceData {
  academic_year: AcademicYear;
  summary: AttendanceSummary;
  date_range: DateRange;
  attendances: Attendance[];
}

// =============================================================================
// OPTIMIZED HOOKS
// =============================================================================

const useAttendanceData = (startDate: string, endDate: string) => {
  const { attendancesTeacher, exportAttendanceTeachers } = useReportStore();
  const [data, setData] = useState<AttendanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Pastikan response sesuai dengan tipe AttendanceData
      const response: any = await attendancesTeacher(startDate, endDate);
      // console.log(response);
      setData(response.data as AttendanceData);
    } catch (err: any) {
      console.error("Error loading attendance data:", err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [attendancesTeacher, startDate, endDate]);

  return { data, loading, error, refetch: fetchData };
};

// =============================================================================
// MAIN COMPONENT - MODIFIED VERSION
// =============================================================================

export const TeacherAttendancePanel: React.FC<TeacherAttendancePanelProps> = ({
  onRefresh,
}) => {
  const { user } = useAuthStore();
  const { exportAttendanceTeachers } = useReportStore();
  const { generateTeacherReport, loading: reportLoading } = useReportStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isDateRangeModalOpen, setIsDateRangeModalOpen] = useState(false);
  const [isPrintMonthlyModalOpen, setIsPrintMonthlyModalOpen] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  
  // State untuk date range - default bulan ini
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState(() => {
    const currentDate = new Date();
    return {
      startDate: getFirstDayOfMonth(currentDate),
      endDate: getLastDayOfMonth(currentDate)
    };
  });

  const {
    data: attendanceData,
    loading: isLoading,
    error,
    refetch,
  } = useAttendanceData(dateRange.startDate, dateRange.endDate);

  const filteredAttendances = useMemo(() => {
    if (!attendanceData?.attendances) return [];

    let filtered = attendanceData.attendances;

    // console.log(filtered)

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (attendance) =>
          attendance.teacher_name?.toLowerCase().includes(query) ||
          attendance.subject_name?.toLowerCase().includes(query) ||
          attendance.classroom_name?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (attendance) => attendance.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (attendance) => attendance.type?.toLowerCase() === typeFilter.toLowerCase()
      );
    }

    return filtered;
  }, [attendanceData?.attendances, searchQuery, statusFilter, typeFilter]);

  const isAdmin = user?.role === "admin";

  // Fungsi untuk navigasi bulan
  const handlePreviousMonth = useCallback(() => {
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    setCurrentMonth(prevMonth);
    setDateRange({
      startDate: getFirstDayOfMonth(prevMonth),
      endDate: getLastDayOfMonth(prevMonth)
    });
  }, [currentMonth]);

  const handleNextMonth = useCallback(() => {
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    setCurrentMonth(nextMonth);
    setDateRange({
      startDate: getFirstDayOfMonth(nextMonth),
      endDate: getLastDayOfMonth(nextMonth)
    });
  }, [currentMonth]);

  const handleCurrentMonth = useCallback(() => {
    const today = new Date();
    setCurrentMonth(today);
    setDateRange({
      startDate: getFirstDayOfMonth(today),
      endDate: getLastDayOfMonth(today)
    });
  }, []);

  const handleAttendanceClick = useCallback((attendance: Attendance) => {
    setSelectedAttendance(attendance);
    setIsDetailModalOpen(true);
  }, []);

  const handleDateRangeChange = useCallback((start: string, end: string) => {
    setDateRange({ startDate: start, endDate: end });
    // Update currentMonth jika range adalah bulan penuh
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (start === getFirstDayOfMonth(startDate) && end === getLastDayOfMonth(startDate)) {
      setCurrentMonth(startDate);
    }
    setIsDateRangeModalOpen(false);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  const handleTypeFilterChange = useCallback((value: string) => {
    setTypeFilter(value);
  }, []);

  const handleBulkDownload = useCallback(
    async (
      type: "daily" | "monthly" | "custom",
      customRange?: { start: string; end: string }
    ) => {
      try {
        await generateTeacherReport();
        setIsDownloadModalOpen(false);
      } catch (error) {
        console.error("Error downloading report:", error);
      }
    },
    [generateTeacherReport]
  );


  const [isExporting, setIsExporting] = useState(false);
  const handlePrintMonthly = useCallback(async () => {
  try {
     setIsExporting(true);

    // Panggil exportAttendanceTeachers dengan date range yang sedang aktif
    const response: any = await exportAttendanceTeachers(
      dateRange.startDate, 
      dateRange.endDate
    );
    
    // Jika response berupa blob/file
    if (response instanceof Blob) {
      // Create download link
      const downloadUrl = window.URL.createObjectURL(response);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Format nama file
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      const monthName = start.toLocaleDateString('id-ID', { month: 'long' });
      const year = start.getFullYear();
      
      // Jika range adalah bulan penuh
      if (isFullMonthRange) {
        link.download = `laporan-absensi-guru-${monthName}-${year}.xlsx`;
      } else {
        // Jika custom range
        const startStr = formatDateToYYYYMMDD(start).replace(/-/g, '');
        const endStr = formatDateToYYYYMMDD(end).replace(/-/g, '');
        link.download = `laporan-absensi-guru-${startStr}-${endStr}.xlsx`;
      }
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      setIsExporting(false);
    } else {
      // Handle jika response bukan blob
      console.warn('Response is not a blob:', response);
    }
    
    setIsPrintMonthlyModalOpen(false);
    setIsExporting(false);

  } catch (error) {
    console.error('Error exporting attendance:', error);
    setIsPrintMonthlyModalOpen(false);
    setIsExporting(false);
    // Tampilkan error message
    alert('Gagal mengekspor laporan. Silakan coba lagi.');
  }
}, [exportAttendanceTeachers, dateRange.startDate, dateRange.endDate]);

  // Format date untuk display
  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Format nama bulan
  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('id-ID', {
      month: 'long',
      year: 'numeric'
    });
  };

  // Cek apakah range adalah bulan penuh
  const isFullMonthRange = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return false;
    
    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    
    return (
      dateRange.startDate === getFirstDayOfMonth(start) &&
      dateRange.endDate === getLastDayOfMonth(end) &&
      start.getMonth() === end.getMonth()
    );
  }, [dateRange]);

  // Auto refetch ketika dateRange berubah
  useEffect(() => {
    refetch();
  }, [dateRange, refetch]);

  // if (error && !attendanceData) {
  //   return (
  //     <EmptyState
  //       title="Gagal memuat data"
  //       description={`Terjadi kesalahan: ${error}. Silakan refresh halaman.`}
  //       icon={ExclamationTriangleIcon}
  //       action={
  //         <Button onClick={handleRefresh} color="primary">
  //           Coba Lagi
  //         </Button>
  //       }
  //     />
  //   );
  // }

  if (isLoading && !attendanceData) {
    return <LoadingState />;
  }

  if (!attendanceData) {
    return (
      <EmptyState
        title="Data tidak tersedia"
        description="Tidak dapat memuat data kehadiran. Silakan refresh halaman."
        icon={ExclamationTriangleIcon}
        // action={
        //   <Button onClick={handleRefresh} color="primary">
        //     Refresh
        //   </Button>
        // }
      />
    );
  }

  // console.log(attendanceData.attendances)
  const { academic_year, summary, date_range } = attendanceData;

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          <div className="w-full">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserGroupIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {isAdmin ? "Laporan Absensi Guru" : "Absensi Saya"}
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  Tahun Akademik{" "}
                  <span className="font-semibold text-blue-600">
                    {academic_year.name}
                  </span>{" "}
                  • {academic_year.periode}
                </p>
              </div>
            </div>

            {/* Month Navigation */}
            <div className="flex flex-col sm:flex-row gap-4 mt-3 justify-center sm:justify-start w-auto sm:w-full">
              {/* Desktop/Mobile Combined Navigation */}
              <div className="flex items-center justify-center gap-2 bg-white p-2 rounded-lg border border-gray-200">
                <button
                  onClick={handlePreviousMonth}
                  disabled={isLoading}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
                  title="Bulan sebelumnya"
                  aria-label="Bulan sebelumnya"
                >
                  <ChevronLeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                
                <div className="flex flex-col items-center min-w-[120px] sm:min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-gray-500 hidden sm:block" />
                    <span className="text-sm sm:text-base font-semibold text-gray-900 text-center">
                      {formatMonthYear(currentMonth)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 text-center mt-1 hidden sm:block">
                    Periode: {formatDisplayDate(date_range.start_date)} - {formatDisplayDate(date_range.end_date)}
                  </p>
                </div>
                
                <button
                  onClick={handleNextMonth}
                  disabled={isLoading}
                  className="p-2 hover:bg-gray-100 rounded-lg disabled:opacity-50 transition-colors"
                  title="Bulan berikutnya"
                  aria-label="Bulan berikutnya"
                >
                  <ChevronRightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Mobile Date Info - Show below on small screens */}
              <div className="sm:hidden text-center">
                <p className="text-xs text-gray-500">
                  {formatDisplayDate(date_range.start_date)} - {formatDisplayDate(date_range.end_date)}
                </p>
                {!isFullMonthRange && (
                  <span className="inline-block mt-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                    Custom Range
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleCurrentMonth}
                  disabled={isLoading}
                  className="text-xs px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50 font-medium flex-1 sm:flex-none"
                >
                  <span className="hidden sm:inline">Bulan Ini</span>
                  <span className="sm:hidden">Sekarang</span>
                </button>
                <button
                  onClick={() => setIsDateRangeModalOpen(true)}
                  disabled={isLoading}
                  className="text-xs px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50 font-medium flex-1 sm:flex-none"
                >
                  Custom
                </button>
              </div>
            </div>
            
          </div>
           

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            
            {/* Print Monthly Button untuk Admin */}
            {isAdmin && (
              <Button
                onClick={handlePrintMonthly}
                startContent={
                  isExporting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <PrinterIcon className="w-4 h-4" />
                  )
                }
                disabled={isLoading || isExporting}
                className="whitespace-nowrap shadow-sm bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {isExporting ? (
                  <span>Exporting...</span>
                ) : (
                  <>
                    <span className="hidden sm:inline">Export Excel</span>
                    <span className="sm:hidden">Export</span>
                  </>
                )}
              </Button>
            )}

            {/* <div className="flex gap-2">
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                disabled={isLoading}
                className="sm:hidden p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <FunnelIcon className="w-4 h-4" />
              </button>

              <button
                // onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Refresh data"
              >
                <ArrowTrendingUpIcon className="w-4 h-4" />
              </button>
            </div> */}
          </div>
        </div>

        {/* Summary Cards */}
        {/* <SummaryCards summary={summary} /> */}

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 sm:p-6 border-b border-gray-200">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {isAdmin ? "Data Kehadiran" : "Riwayat Kehadiran Saya"}
              </h2>
              <p className="text-sm text-gray-500 mt-1 hidden sm:block">
                Kelola dan pantau data kehadiran {isAdmin ? "guru" : "anda"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              {/* Search Input */}
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder={
                    isAdmin
                      ? "Cari guru, mata pelajaran, atau kelas..."
                      : "Cari mata pelajaran atau kelas..."
                  }
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  disabled={isLoading}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50"
                />
              </div>

              {/* Desktop Filters - Hidden on Mobile */}
              <div className="hidden sm:flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  disabled={isLoading}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-40 disabled:opacity-50"
                >
                  <option value="all">Semua Status</option>
                  <option value="present">Hadir</option>
                  <option value="absent">Absen</option>
                  <option value="sick">Sakit</option>
                  <option value="permission">Izin</option>
                </select>

                <select
                  value={typeFilter}
                  onChange={(e) => handleTypeFilterChange(e.target.value)}
                  disabled={isLoading}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-40 disabled:opacity-50"
                >
                  <option value="all">Semua Tipe</option>
                  <option value="check_in">Check In</option>
                  <option value="check_out">Check Out</option>
                </select>
              </div>
            </div>
          </div>

          {/* Body - PERBAIKAN DI SINI */}
          <div className="p-4 sm:p-6">
            <AttendanceList
              attendances={filteredAttendances}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              typeFilter={typeFilter}
              onAttendanceClick={handleAttendanceClick}
            />
          </div>
        </div>

        {/* Modals */}
        <AttendanceDetailModal
          attendance={selectedAttendance}
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
        />

        <DateRangeModal
          isOpen={isDateRangeModalOpen}
          onClose={() => setIsDateRangeModalOpen(false)}
          onApply={handleDateRangeChange}
          initialStartDate={dateRange.startDate}
          initialEndDate={dateRange.endDate}
        />

        <DownloadModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
          onDownload={handleBulkDownload}
          academicYear={academic_year.name}
          isLoading={reportLoading}
        />

        {/* <PrintMonthlyModal
          isOpen={isPrintMonthlyModalOpen}
          onClose={() => setIsPrintMonthlyModalOpen(false)}
          onPrint={handlePrintMonthly}
          academicYear={academic_year}
          isLoading={reportLoading}
        /> */}

        <MobileFilterDrawer
          isOpen={isFilterDrawerOpen}
          onClose={() => setIsFilterDrawerOpen(false)}
          statusFilter={statusFilter}
          onStatusFilterChange={handleStatusFilterChange}
          typeFilter={typeFilter}
          onTypeFilterChange={handleTypeFilterChange}
        />
      </div>
    </div>
  );
};

export default TeacherAttendancePanel;