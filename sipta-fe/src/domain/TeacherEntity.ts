export interface Teacher {
  id: string;
  user_id: string;
  instance_id: string;
  full_name: string;
  gender: "male" | "female";
  birth_date: string;
  phone: string;
  address: string;
  degree: string;
  photo: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherStore {
  teachers: Teacher[];
  teacher: Teacher | null;
  loading: boolean;
  fetchTeachers: () => Promise<void>;
  fetchTeacherById: (id: string) => Promise<void>;
  createTeacher: (payload: any) => Promise<void>;
  updateTeacher: (id:string, payload: any) => Promise<void>;
  deleteTeacher: (id:string) => Promise<void>;
}
