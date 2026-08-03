import { create } from 'zustand';
import { scheduleApi } from '../infrastructure/ScheduleApi';
import { PayloadAccomplish, PayloadTeacherAttendance, PayloadUpdateSchedules, ScheduleStore } from '../domain/ScheduleEntity';

let schedulesRequestId = 0;
let schedulesRequestPromise: Promise<void> | null = null;

export const useScheduleStore = create<ScheduleStore>((set) => ({
  schedules: [],
  schedule: null,
  incompleSchedules: [],
  loading: false,

  fetchIncompleteSchedules: async () => {
    set({ loading: true });
    try {
      const result = await scheduleApi.getIncompleteSchedules();

      if (result.data.success) {
        set({ incompleSchedules: result.data.data.schedules, loading: false });
      } else {
        throw new Error(result.data?.message || 'Gagal mengambil jadwal');
      }
    } catch {
      set({ loading: false });
    }
  },

  fetchSchedule: async (schedule_id: string) => {
    set({ loading: true });
    try {
      const result = await scheduleApi.getSchedule(schedule_id);

      if (result.data.success) {
        set({ schedule: result.data.data, loading: false });
      } else {
        throw new Error(result.data.message || 'Gagal mengambil jadwal');
      }
    } catch {
      set({ loading: false });
    }
  },

  fetchSchedules: async () => {
    if (schedulesRequestPromise) {
      return schedulesRequestPromise;
    }

    const requestId = ++schedulesRequestId;

    schedulesRequestPromise = (async () => {
      set({ loading: true });

      try {
        const result = await scheduleApi.getSchedules();

        if (result.data.success) {
          if (requestId === schedulesRequestId) {
            set({ schedules: result.data.data, loading: false });
          }
          return;
        }

        throw new Error(result.data?.message || 'Gagal mengambil data jadwal');
      } catch (error) {
        if (requestId === schedulesRequestId) {
          set({ loading: false });
        }
        throw error;
      } finally {
        if (requestId === schedulesRequestId) {
          schedulesRequestPromise = null;
        }
      }
    })();

    return schedulesRequestPromise;
  },

  fetchSchedulesToday: async () => {
    set({ loading: true });
    try {
      const result = await scheduleApi.getSchedulesToday();

      if (result.data.success) {
        set({ schedules: result.data.data, loading: false });
      } else {
        throw new Error(result.data?.message || 'Gagal mengambil jadwal hari ini');
      }
    } catch {
      set({ loading: false });
    }
  },

  teacherAttendance: async (payload: PayloadTeacherAttendance) => {
    set({ loading: true });
    try {
      const result = await scheduleApi.teacherAttendance(payload);

      if (result.data.success) {
        set({ loading: false });
        return result.data;
      }

      throw new Error(result.data?.message || 'Gagal check-in');
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  updateAttendanceStatus: async (payload: any) => {
    set({ loading: true });
    try {
      const result = await scheduleApi.updateTeacherAttendance(payload);

      if (result.data.success) {
        set({ loading: false });
        return result.data;
      }

      throw new Error(result.data?.message || 'Gagal check-in');
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  studentAttendance: async (payload: any) => {
    set({ loading: true });
    try {
      const result = await scheduleApi.studentAttendance(payload);

      if (result.data.success) {
        set({ loading: false });
        return result.data;
      }

      throw new Error(result.data?.message || 'Gagal check-in');
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createAccomplish: async (payload: PayloadAccomplish) => {
    set({ loading: true });
    try {
      const result = await scheduleApi.createAccomplish(payload);

      if (result.data.success) {
        set({ loading: false });
        return result.data;
      }

      throw new Error(result.data?.message || 'Gagal mengirim data!');
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  createSchedules: async (payload: any) => {
    set({ loading: true });
    try {
      const result = await scheduleApi.createSchedules(payload);

      if (result.data.success) {
        set({ loading: false });
        return;
      }

      throw new Error(result.data?.message || 'Gagal mengirim data!');
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  updateSchedule: async (id: string, updatedData: PayloadUpdateSchedules) => {
    set({ loading: true });
    try {
      const response: any = await scheduleApi.scheduleUpdate(id, updatedData);

      if (response.data.success) {
        set({ loading: false });
        return response.data;
      }

      throw new Error(response.data?.message || 'Gagal memperbarui jadwal');
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  deleteSchedule: async (id: string) => {
    set({ loading: true });
    try {
      const response: any = await scheduleApi.scheduleDelete(id);

      if (response.data.success) {
        set({ loading: false });
        return response.data;
      }

      throw new Error(response.data?.message || 'Gagal menghapus jadwal');
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
}));
