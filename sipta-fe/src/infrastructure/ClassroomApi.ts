import { apiClient } from "./Instance";
import type { PromoteStudentsPayload, PromotionContext } from "../domain/ClassroomEntity";
import type { ApiResponse } from "./ApiResponse";

export const classroomApi = {
  getClassroom: (classroom_id: string) => apiClient.get(`/classrooms/${classroom_id}`),
  getClassrooms: () => apiClient.get('/classrooms'),
  fetchTargetUpgradeClassrooms: (): ApiResponse<PromotionContext> =>
    apiClient.get(`/teachers/classrooms/target-upgrade`),
  createClassroom: (payload: any) => apiClient.post(`/admin/classrooms`, payload),
  updateClassroom: (classroom_id: string, payload: any) => apiClient.put(`/admin/classrooms/${classroom_id}`, payload),
  deleteClassroom: (classroom_id: string) => apiClient.delete(`/admin/classrooms/${classroom_id}`),
  createStudent: (payload: any) => apiClient.post(`/students`, payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  updateStudent: (id:string, payload: any) => apiClient.post(`/students/${id}/update`, payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  deleteStudent: (student_id: string) => apiClient.delete(`/students/${student_id}`),
  promotedStudents: (payload: PromoteStudentsPayload) =>
    apiClient.post('/students/promoted', payload),
};
