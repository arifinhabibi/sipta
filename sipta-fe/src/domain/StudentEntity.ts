
export interface Student {
    id: string;
    classroom_id: string,
    fullname: string,
    birth_place: string,
    birth_date: string,
    gender: "male" | "female",
    father_name: string,
    mother_name: string,
    address: string,
    phone: string,
    photo: null | string,
    birth_certificate: null | string,
    family_card: null | string,
    id_card_father: null | string,
    id_card_mother: null | string,
    adverb: string,
    attendances: StudentAttendance | null,
    accomplishments: StudentAccomplishments,
    status: "active" | 'inactive',
    created_at: string;
    updated_at: string;
}

export interface StudentAttendance {
    id: string;
    student_id: string;
    schedule_id: string;
    status: "present" | "sick" | "permit" | "absent";
    note: string;
    created_at: string;
    updated_at: string;
}

export interface StudentAccomplishments {
    id: string;
    student_id: string;
    accomplishment_id: string;
    is_capable: boolean;
    note: string;
}


export interface PayloadStudentAttendance {
  schedule_id: string,
  students: StudentAttendance[];
}

export interface StudentAttendance {
  accomplishments: StudentAccomplish[];
  attendance: 'present' | 'absent' | 'sick' | 'permission';
  note: string;
  student_id: string;
}

export interface StudentAccomplish {
  accomplishment_id: string;
  is_capable: boolean;
}