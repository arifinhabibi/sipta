// =============================================================================
// TYPES AND export INTERFACES
// =============================================================================

export interface AcademicYear {
  id: string;
  name: string;
  periode: string;
  start_periode: string;
  end_periode: string;
  is_active: boolean;
}

export interface AttendanceSummary {
  total_attendances: number;
  present_count: number;
  absent_count: number;
  late_count: number;
  sick_count: number;
  permission_count: number;
  check_in_count: number;
  check_out_count: number;
}

export interface Attendance {
  id: string;
  teacher_id: string;
  teacher_name: string;
  schedule_id: string;
  schedule_date: string;
  subject_name: string;
  classroom_name: string;
  schedule_time: string;
  type: 'check_in' | 'check_out';
  status: 'present' | 'absent' | 'late' | 'sick' | 'permission';
  longitude: string;
  latitude: string;
  real_time_photo: string;
  gmaps: string | null;
  created_at: string;
  updated_at: string;
}

export interface FilterInfo {
  type: 'weekly' | 'monthly';
  week_start?: string;
  week_end?: string;
  month?: number;
  year?: number;
  description: string;
}

export interface AttendanceResponse {
  period: 'week' | 'month';
  user_role: string;
  academic_year: AcademicYear;
  summary: AttendanceSummary;
  attendances: Attendance[];
  filter_info: FilterInfo;
}

export interface TeacherAttendancePanelProps {
  currentUserId?: string | null;
  academicYears?: AcademicYear[];
  onRefresh?: () => void;
}



// =============================================================================
// CONSTANTS AND CONFIGURATION
// =============================================================================

export const ATTENDANCE_STATUS_CONFIG = {
  present: { 
    color: 'success', 
    label: 'Hadir', 
    icon: '✅', 
    bgColor: 'bg-green-50', 
    textColor: 'text-green-700',
    borderColor: 'border-green-200'
  },
  absent: { 
    color: 'danger', 
    label: 'Absen', 
    icon: '❌', 
    bgColor: 'bg-red-50', 
    textColor: 'text-red-700',
    borderColor: 'border-red-200'
  },
  late: { 
    color: 'warning', 
    label: 'Terlambat', 
    icon: '⏰', 
    bgColor: 'bg-yellow-50', 
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200'
  },
  sick: { 
    color: 'default', 
    label: 'Sakit', 
    icon: '🏥', 
    bgColor: 'bg-purple-50', 
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200'
  },
  permission: { 
    color: 'primary', 
    label: 'Izin', 
    icon: '📝', 
    bgColor: 'bg-blue-50', 
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200'
  }
} as const;

export const ATTENDANCE_TYPE_CONFIG = {
  check_in: { label: 'Check In', color: 'primary', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
  check_out: { label: 'Check Out', color: 'secondary', bgColor: 'bg-purple-100', textColor: 'text-purple-700' }
} as const;