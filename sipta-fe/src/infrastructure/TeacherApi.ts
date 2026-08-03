import { apiClient } from "./Instance";

export const teacherApi = {
  getTeacher: (teacher_id: string) => apiClient.get(`/teachers/${teacher_id}`),
  getTeachers: () => apiClient.get('/teachers'),
  createTeacher: (payload: any) => apiClient.post('/admin/teachers', payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  updateTeacher: (teacher_id: string, payload: any) => apiClient.post(`/teachers/${teacher_id}`, payload, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  deleteTeacher: (teacher_id: string) => apiClient.delete(`/admin/teachers/${teacher_id}`),
};
