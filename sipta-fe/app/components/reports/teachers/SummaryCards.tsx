
// =============================================================================
// SUMMARY CARDS COMPONENTS - IMPROVED VERSION
// =============================================================================

import { AttendanceSummary } from "@/src/domain/Attendance";
import { calculateAttendanceRate } from "../TeacherAttendancePanel";
import { useMemo } from "react";
import { ChartBarIcon, CheckCircleIcon, ExclamationTriangleIcon, UserGroupIcon, XCircleIcon } from "@heroicons/react/24/outline";

export const SummaryCards: React.FC<{ summary: AttendanceSummary }> = ({ summary }) => {
  const attendanceRate = calculateAttendanceRate(summary);

  const statCards = useMemo(() => [
    {
      key: 'total_attendances',
      label: 'Total Kehadiran',
      value: summary.total_attendances,
      icon: UserGroupIcon,
      color: 'primary',
      description: 'Total catatan kehadiran'
    },
    {
      key: 'present_count',
      label: 'Hadir',
      value: summary.present_count,
      icon: CheckCircleIcon,
      color: 'success',
      description: 'Guru yang hadir'
    },
    {
      key: 'attendance_rate',
      label: 'Rate Kehadiran',
      value: `${attendanceRate}%`,
      icon: ChartBarIcon,
      color: 'secondary',
      description: 'Persentase kehadiran'
    },
    {
      key: 'sick_count',
      label: 'Sakit',
      value: summary.sick_count,
      icon: ExclamationTriangleIcon,
      color: 'default',
      description: 'Guru sakit'
    },
    {
      key: 'permission_count',
      label: 'Izin',
      value: summary.permission_count,
      icon: XCircleIcon,
      color: 'primary',
      description: 'Guru izin'
    }
  ], [summary, attendanceRate]);

  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { bg: string; text: string } } = {
      primary: { bg: 'bg-blue-100', text: 'text-blue-600' },
      success: { bg: 'bg-green-100', text: 'text-green-600' },
      secondary: { bg: 'bg-purple-100', text: 'text-purple-600' },
      warning: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
      default: { bg: 'bg-gray-100', text: 'text-gray-600' }
    };
    return colorMap[color] || colorMap.default;
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      {statCards.map((stat) => {
        const colorClasses = getColorClasses(stat.color);
        return (
          <div key={stat.key} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 animate-fade-in">
            <div className="p-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${colorClasses.bg} flex-shrink-0`}>
                  <stat.icon className={`w-4 h-4 ${colorClasses.text}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-bold text-gray-900 truncate">{stat.value}</div>
                  <div className="text-xs font-medium text-gray-600 truncate">{stat.label}</div>
                  <div className="text-xs text-gray-500 mt-1 truncate hidden sm:block">{stat.description}</div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
