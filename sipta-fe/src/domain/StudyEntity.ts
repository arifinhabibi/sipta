import { Subject } from "./ScheduleEntity";

export interface StudyStore {
  subjects: Subject[];
  subject: Subject | null;
  loading: boolean;
  error: null;
  fetchSubjects: () => Promise<void>;
  createSubject: (payload: any) => Promise<void>;
  updateSubject: (id: string, payload: any) => Promise<void>;
  deleteSubject: (id: string) => Promise<void>;
}



export interface CreateSubjectData {
  code: string;
  name: string;
  description?: string;
}
