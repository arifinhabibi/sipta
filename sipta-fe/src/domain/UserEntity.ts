
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Instance {
  id: string;
  name: string;
  description: string;
  type_institutions: string;
  latitude: string;
  longitude: string;
  logo: string;
  created_at: string;
  update_at: string;
}

interface Teacher {
  id: string;
  user_id: string;
  instance_id: string;
  full_name: string;
  gender: 'male' | 'female';
  birth_date: string;
  phone: string | null;
  address: string | null;
  degree: string | null;
  photo: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  instance: Instance;
  classrooms: Classroom[];
}

export interface Classroom {
  id: string;
  teacher_id: string;
  name: string;
  room_number: string;
  capacity: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  username: string;
  role: string;
  created_at: string;
  updated_at: string;
  teacher: Teacher;
}

export interface AcademicYear {
  id: string;
  instance_id: string;
  name: string;
  periode: string;
  start_periode: string;
  end_periode: string;
  is_active: boolean;
}
export interface AuthState {
  // State fields
  token: string | null;
  refreshToken: string | null;
  tokenExpiry: number | null;
  user: User | null;
  instance: Instance;
  academic_year: AcademicYear | null;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  me: Profile | null;

  // Account methods
  updateAccount: (payload: any) => Promise<void>;
  updateProfile: (payload: any) => Promise<void>;
  updateInstance: (payload: any) => Promise<any>;
  changePassword: (payload: any) => Promise<any>;

  // Auth methods
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<any>;
  clearAuth: () => void;
  initializeAuth: () => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  getMe: () => Promise<void>;
  updateAcademicYear: (academicYear: AcademicYear) => void;
  
  // Token management methods
  refreshAuthToken: () => Promise<string>;
  checkTokenValidity: () => Promise<boolean>;
}
