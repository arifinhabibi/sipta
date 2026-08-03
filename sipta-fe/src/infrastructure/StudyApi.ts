import { apiClient } from "./Instance";

export const studyApi = {
  getSubjects: (academic_year_id: string) => apiClient.get(`/schedules/subjects/get`),
  createSubject: (academic_year_id: string, payload: any) => apiClient.post(`/schedules/subjects/`, payload),
  updateSubject: (academic_year_id: string, id: string, payload: any) => apiClient.put(`/schedules/subjects/${id}`, payload),
  deleteSubject: (academic_year_id: string, id: any) => apiClient.delete(`/schedules/subjects/${id}`),
};