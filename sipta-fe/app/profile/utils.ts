// profiles/utils.ts
export interface EditData {
  username: string;
  full_name: string;
  gender: string;
  birth_date: string;
  phone: string;
  address: string;
  degree: string;
  instance_name: string;
  instance_type: string;
  latitude: string;
  longitude: string;
}

export interface PasswordData {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface AcademicYear {
  id: string;
  name: string;
  periode: 'ganjil' | 'genap';
  start_periode: string;
  end_periode: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}