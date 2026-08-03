import { create } from "zustand";
import { TeacherStore } from "../domain/TeacherEntity";
import { teacherApi } from "../infrastructure/TeacherApi";


// ---- Zustand Store ----
export const useTeacherStore = create<TeacherStore>((set) => ({
  teachers: [],
  teacher: null,
  loading: false,

  fetchTeachers: async () => {
    set({ loading: true });
    try {
    const result: any = await teacherApi.getTeachers();
    
      if (result.data.success) {
        set({ teachers: result.data.data, loading: false });
      } else {
        throw new Error(result?.data.message || "Gagal mengambil data kelas");
      }
    } catch (error) {
      // console.error("Failed to fetch teachers:", error);
      set({ loading: false });
    }
  },

  fetchTeacherById: async (id: string) => {
    set({ loading: true });
    try {
      const response = await teacherApi.getTeacher(id);
      set({ teacher: response.data.data, loading: false });
    } catch (error) {
      // console.error("Failed to fetch teacher:", error);
      set({ loading: false });
    }
  },
  createTeacher: async (payload: any) => {
    set({ loading: true });
    try {
      const result: any = await teacherApi.createTeacher(payload);
      if (result.data.success) {
        set({loading: false });
        return result.data
      } else {
        throw new Error(result?.data.message || "Gagal mengambil data kelas");
      }
    } catch (error) {
      // console.error("Failed to fetch teacher:", error);
      set({ loading: false });
    }
  },
  updateTeacher:  async (id: string, payload: any) => {
    set({ loading: true });
    try {
      const result: any = await teacherApi.updateTeacher(id, payload);
      if (result.data.success) {
        set({loading: false });
        return result.data
      } else {
        throw new Error(result?.data.message || "Gagal mengambil data kelas");
      }
    } catch (error) {
      // console.error("Failed to fetch teacher:", error);
      set({ loading: false });
    }
  },
  deleteTeacher: async (id: string) => {
    set({ loading: true });
    try {
      const result: any = await teacherApi.deleteTeacher(id);

      if (result.data.success) {
        set({loading: false });
        return result.data
      } else {
        throw new Error(result?.data.message || "Gagal mengambil data kelas");
      }
    } catch (error) {
      // console.error("Failed to fetch teacher:", error);
      set({ loading: false });
    }
  },
}));
