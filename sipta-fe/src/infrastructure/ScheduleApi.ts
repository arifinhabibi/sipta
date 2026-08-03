// infrastructure/scheduleApi.ts
import { apiClient } from './Instance';
import type { PayloadCreateSchedules, PayloadUpdateSchedules, Schedule } from '../domain/ScheduleEntity';
import type { ApiResponse } from './ApiResponse';

function base64ToFile(base64String: string, filename: string): File {
  const arr = base64String.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export const scheduleApi = {
  getIncompleteSchedules: () => apiClient.get(`/incomplete-schedules`),
  updateTeacherAttendance: async (payload: any) => {
    return await apiClient.put(`/admin/incomplete-schedules`, payload)
  },
  getSchedule: (schedule_id: string): ApiResponse<Schedule> => apiClient.get(`/schedules/${schedule_id}`),
  getSchedulesToday: () => apiClient.get('/schedules/today'),
  getSchedules: () => apiClient.get('/schedules'),
  teacherAttendance: async (payload: any) => {
    const formData = new FormData();
    formData.append("schedule_id", payload.schedule_id);
    formData.append("type", payload.type);
    formData.append("longitude", String(payload.longitude));
    formData.append("latitude", String(payload.latitude));

    // Konversi base64 ke File
    const file = base64ToFile(payload.real_time_photo, "photo.jpg");
    formData.append("real_time_photo", file);

    return await apiClient.post(`/teachers/attendances/create`, formData,{
      headers: { "Content-Type": "multipart/form-data" },
    })
  },
  studentAttendance: async (payload: any) => {
    return await apiClient.post(`/students/attendances`, payload)
  },
  createAccomplish: async (payload: any) => {
    return await apiClient.post(`/schedules/${payload.schedule_id}/accomplishments`, {
        accomplishments: payload.accomplishments
    },  {
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
    })
  },
  createSchedules: async (payload: PayloadCreateSchedules): ApiResponse<Schedule> => {
     return await apiClient.post(`/admin/schedules`, payload)
  },
  scheduleUpdate: async (id: string, payload: PayloadUpdateSchedules): ApiResponse<Schedule> => {
    return await apiClient.put(`/admin/schedules/${id}`, payload)
  },
  scheduleDelete: async (id: string) => {
    return await apiClient.delete(`/admin/schedules/${id}`)
  }
};
