import { Student } from "./StudentEntity";

export interface Subject {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface Teacher {
  id: string;
  full_name: string;
  gender: string;
  degree: string;
  photo: string;
}

export interface Classroom {
  id: string;
  name: string;
  room_number: string;
  capacity: number;
  description: string;
  students: Student[];
}

export interface TeacherAttendances {
    id: string,
    schedule_id: string,
    type: string
}

export interface Schedule {
  id: string;
  academic_year_id: string;
  teacher_id: string;
  subject_id: string;
  classroom_id: string;
  date: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
  subject: Subject;
  teacher: Teacher;
  classroom: Classroom;
  teacher_attendances: TeacherAttendances[];
  accomplishments: Accomplish[];
  is_completed: boolean;
  status: 'scheduled' | 'completed' | 'cancelled';
  completed_at: string | null;
  assessment_period: 'regular' | 'uts' | 'uas';
}

export interface PayloadTeacherAttendance {
    schedule_id: string,
    latitude: number,
    longitude: number,
    type: "check_in" | 'check_out',
    real_time_photo: string
}


export interface PayloadAccomplish {
    schedule_id: string,
    accomplishments: Accomplish[]
}

export interface Accomplish {
    name: string,
    type: string
}
export interface PayloadCreateSchedules {
  subject_id: string;
  classroom_id: string;
  teacher_id: string;
  academic_year_id: string;
  date: string;
  start_time: string;
  end_time: string;
  assessment_period?: 'regular' | 'uts' | 'uas';
}

export interface PayloadUpdateSchedules {
  subject_id: string;
  classroom_id: string;
  teacher_id: string;
  date: string;
  start_time: string;
  end_time: string;
  academic_year_id?: string;
  assessment_period?: 'regular' | 'uts' | 'uas';
}

export interface ScheduleStore {
  schedules: Schedule[];
  schedule: Schedule | null,
  incompleSchedules: Schedule[];
  loading: boolean;
  fetchIncompleteSchedules: () => Promise<void>;
  fetchSchedule: (schedule_id: string) => Promise<void>;
  fetchSchedules: () => Promise<void>;
  fetchSchedulesToday: () => Promise<void>;
  teacherAttendance: (payload: PayloadTeacherAttendance) => Promise<void>;
  updateAttendanceStatus: (payload: any) => Promise<void>;
  studentAttendance: (payload: any) => Promise<void>;
  createAccomplish: (payload: PayloadAccomplish) => Promise<void>;
  createSchedules: (payload: PayloadCreateSchedules) => Promise<void>;
  updateSchedule: (id: string, payload: PayloadUpdateSchedules) => Promise<void>;
  deleteSchedule: (id: string) => Promise<void>;
}
