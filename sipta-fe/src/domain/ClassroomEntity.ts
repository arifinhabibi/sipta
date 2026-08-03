import { AcademicYear } from "./AcademicYearEntity";
import { Student } from "./StudentEntity";
import { Teacher } from "./TeacherEntity";

export interface Classroom {
  id: string;
  teacher_id: string;
  name: string;
  room_number: string;
  capacity: number;
  description: string;
  students: Student[];
  teacher: Teacher;
  academic_year?: AcademicYear;
}

export interface TargetClassroom {
  id: string;
  teacher_id: string;
  name: string;
  room_number: string;
  capacity: number;
  description: string;
  students: Student[];
  available_capacity: number;
  current_students_count: number;
  teacher: Teacher
}

export interface PromotionContext {
  classrooms: TargetClassroom[];
  target_academic_year: AcademicYear;
  current_academic_year: AcademicYear;
}

export interface PromoteStudentsPayload {
  student_ids: string[];
  source_academic_year_id: string;
  target_academic_year_id: string;
  target_classroom_id: string;
  override_reason?: string;
}

export interface ClassroomStore {
  classrooms: Classroom[];
  targetClassrooms: TargetClassroom[];
  promotionContext: PromotionContext | null;
  classroom: Classroom | null;
  loading: boolean;
  fetchClassrooms: () => Promise<void>;
  fetchTargetUpgradeClassrooms: () => Promise<PromotionContext | undefined>;
  createClassroom: (payload: any) => Promise<void>;
  updateClassroom: (id: string, payload: any) => Promise<void>;
  deleteClassroom: (id: string) => Promise<void>;
  createStudent: (payload: any) => Promise<void>;
  updateStudent: (id: string, payload: any) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  promotedStudents: (studentId: string[], classroomId: string) => Promise<void>;
}
