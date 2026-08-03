export interface Teacher {
  id: string;
  full_name: string;
  photo?: string;
  gender: string;
  degree?: string;
  status: string;
}

export interface Student {
  id: string;
  fullname: string;
  nis?: string;
  birth_place?: string;
  birth_date?: string;
  gender: string;
  photo?: string;
  status: string;
}

export interface Classroom {
  id: string;
  name: string;
  room_number?: string;
  capacity: number;
  description?: string;
  teacher?: Teacher;
  students?: Student[];
}

export interface Schedule {
  id: string;
  title: string;
  start: Date;
  end: Date;
  classroom?: Classroom;
  subject?: string;
  status?: string;
}

export type PrismAxes = {
  knowledge: number;
  skill: number;
  attitude: number;
  creativity: number;
  discipline: number;
};

export type ActiveTab = 'students' | 'teachers' | 'calendar';