// src/state/scheduleStore.ts
import { create } from 'zustand';
import { ClassroomStore } from '../domain/ClassroomEntity';
import { classroomApi } from '../infrastructure/ClassroomApi';

export const useClassroomStore = create<ClassroomStore>((set, get) => ({
  classrooms: [],
  targetClassrooms: [],
  promotionContext: null,
  classroom: null,
  loading: false,

  fetchClassrooms: async () => {
    set({ loading: true });
    try {
      const result: any = await classroomApi.getClassrooms();

      // Jika API sukses
      if (result.data.success) {
        set({ classrooms: result.data.data, loading: false });
      } else {
        throw new Error(result?.data.message || "Gagal mengambil data kelas");
      }
    } catch (error) {
      // console.error("❌ Error fetching classrooms:", error);
      set({ loading: false });
    }
  },
  fetchTargetUpgradeClassrooms: async () => {
    set({ loading: true });
    try {
      const result: any = await classroomApi.fetchTargetUpgradeClassrooms();
      // Jika API sukses
      // console.log(result);
      if (result.data.success) {
        set({
          targetClassrooms: result.data.data.classrooms,
          promotionContext: result.data.data,
          loading: false,
        });
        return result.data.data;
      } else {
        throw new Error(result?.data.message || "Gagal mengambil data kelas");
      }
    } catch (error) {
      // console.error("❌ Error fetching classrooms:", error);
      set({ loading: false });
    } 
  },
  createClassroom: async (payload: any) => {
    set({ loading: true });
    try {
      const result: any = await classroomApi.createClassroom(payload);

      // Jika API sukses
      if (result.data.success) {
        // set({ classrooms: result.data.data, loading: false });
        return result.data
      } else {
        throw new Error(result?.data.message || "Gagal mengambil data kelas");
      }
    } catch (error) {
      // console.error("❌ Error fetching classrooms:", error);
      set({ loading: false });
    }
  },
  updateClassroom: async (id: string, payload: any) => {
    set({ loading: true });
    try {
      const result: any = await classroomApi.updateClassroom(id, payload);

      // Jika API sukses
      if (result.data.success) {
        // set({ classrooms: result.data.data, loading: false });
        return result.data
      } else {
        throw new Error(result?.data.message || "Gagal mengambil data kelas");
      }
    } catch (error) {
      // console.error("❌ Error fetching classrooms:", error);
      set({ loading: false });
    }
  },
  deleteClassroom: async (id:string) => {
    set({loading: true})
     try {
      const result: any = await classroomApi.deleteClassroom(id);

      // Jika API sukses
      if (result.data.success) {
        // set({ classrooms: result.data.data, loading: false });
        return result.data
      } else {
        throw new Error(result?.data.message || "Gagal mengambil data kelas");
      }
    } catch (error) {
      // console.error("❌ Error fetching classrooms:", error);
      set({ loading: false });
    }
  },
   createStudent: async (payload: any) => {
    set({ loading: true });
    try {
      const result: any = await classroomApi.createStudent(payload);

      // Jika API sukses
      if (result.data.success) {
        // set({ classrooms: result.data.data, loading: false });
        return result.data
      } else {
        throw new Error(result?.data.message || "Gagal mengambil data kelas");
      }
    } catch (error) {
      // console.error("❌ Error fetching classrooms:", error);
      set({ loading: false });
    }
  },
  updateStudent: async (id:string, payload: any) => {
    set({ loading: true });
    try {
      const result: any = await classroomApi.updateStudent(id, payload);

      if (result.data.success) {
        set({ loading: false });
        return result.data
      } else {
        throw new Error(result?.data.message || "Gagal mengambil data kelas");
      }
    } catch (error) {
      // console.error("❌ Error fetching classrooms:", error);
      set({ loading: false });
    }
  },
  deleteStudent: async (id: string) => {
    set({ loading: true });
    try {
      const result: any = await classroomApi.deleteStudent(id);

      // Jika API sukses
      if (result.data.success) {
        set({ loading: false });
        return result.data
      } else {
        throw new Error(result?.data.message || "Gagal mengambil data kelas");
      }
    } catch (error) {
      // console.error("❌ Error fetching classrooms:", error);
      set({ loading: false });
    }
  },
  promotedStudents: async (studentIds: string[], targetClassroomId: string) => {
  set({ loading: true });
  try {
    const promotionContext = get().promotionContext;
    if (!promotionContext) {
      throw new Error("Konteks tahun ajaran promosi belum dimuat.");
    }

    const result: any = await classroomApi.promotedStudents({
      student_ids: studentIds,
      source_academic_year_id: promotionContext.current_academic_year.id,
      target_academic_year_id: promotionContext.target_academic_year.id,
      target_classroom_id: targetClassroomId,
    });
    
    // Jika API sukses
    if (result.data.success) {
      // Refresh data kelas setelah upgrade berhasil
      await get().fetchClassrooms();
      return result.data;
    } else {
      throw new Error(result?.data.message || "Gagal menaikkan kelas siswa");
    }
  } catch (error) {
    // console.error("❌ Error upgrading selected students:", error);
    set({ loading: false });
    throw error;
  }
},

}));
