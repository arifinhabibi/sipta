// types/academicYear.ts
export interface AcademicYear {
  id: string;
  instance_id?: string;
  name: string;
  periode: 'ganjil' | 'genap';
  start_periode: string;
  end_periode: string;
  is_active: boolean;
  is_promoted: boolean;
  status: 'draft' | 'active' | 'closed';
  closed_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAcademicYearPayload {
  name: string;
  periode: 'ganjil' | 'genap';
  start_periode: string;
  end_periode: string;
  is_active?: boolean;
  is_promoted?: boolean;
}

export interface UpdateAcademicYearPayload {
  name?: string;
  periode?: 'ganjil' | 'genap';
  start_periode?: string;
  end_periode?: string;
  is_active?: boolean;
  is_promoted?: boolean;
}

export interface AcademicYearRolloverPayload {
  target_academic_year_id: string;
  override_reason?: string;
}
