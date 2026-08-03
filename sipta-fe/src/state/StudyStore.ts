import { create } from "zustand";
import { StudyStore } from "../domain/StudyEntity";
import { studyApi } from "../infrastructure/StudyApi";

// utils/academicYear.ts
export const getAcademicYearId = (): string => {
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const authData = JSON.parse(authStorage);
      return authData.state.academic_year.id;
    }
    throw new Error('Academic year ID not found in localStorage');
  } catch (error) {
    // console.error('Error getting academic year ID:', error);
    throw new Error('Failed to get academic year ID');
  }
};

// ---- Zustand Store ----
export const useStudyStore = create<StudyStore>((set) => ({
  subjects: [],
  subject: null,
  loading: false,
  error: null, // Tambahkan error state

  fetchSubjects: async () => {
    set({ loading: true, error: null });
    try {
      const academicYearId = getAcademicYearId();
      const result: any = await studyApi.getSubjects(academicYearId);
      
      if (result.data.success) {
        set({ subjects: result.data.data, loading: false });
      } else {
        throw new Error(result?.data.message || "Gagal mengambil data mata pelajaran");
      }
    } catch (error: any) {
      // console.error("Failed to fetch subjects:", error);
      set({ 
        loading: false, 
        error: error.message || "Gagal mengambil data mata pelajaran" 
      });
    }
  },

  createSubject: async (payload: any) => {
    set({ loading: true, error: null });
    try {
      const academicYearId = getAcademicYearId();
      
      const result: any = await studyApi.createSubject(academicYearId, payload);
      
      if (result.data.success) {
        set({ loading: false });
        
        // Refresh subjects list setelah create berhasil
        const refreshResult: any = await studyApi.getSubjects(academicYearId);
        if (refreshResult.data.success) {
          set({ subjects: refreshResult.data.data });
        }
        
        return result.data;
      } else {
        throw new Error(result?.data.message || "Gagal membuat mata pelajaran");
      }
    } catch (error: any) {
      // console.error("Failed to create subject:", error);
      set({ 
        loading: false, 
        error: error.message || "Gagal membuat mata pelajaran" 
      });
      throw error;
    }
  },

  updateSubject: async (id: string, payload: any) => {
    set({ loading: true, error: null });
    try {
      const academicYearId = getAcademicYearId();
      
      const result: any = await studyApi.updateSubject(academicYearId, id, payload);
      
      if (result.data.success) {
        set({ loading: false });
        
        // Refresh subjects list setelah update berhasil
        const refreshResult: any = await studyApi.getSubjects(academicYearId);
        if (refreshResult.data.success) {
          set({ subjects: refreshResult.data.data });
        }
        
        return result.data;
      } else {
        throw new Error(result?.data.message || "Gagal memperbarui mata pelajaran");
      }
    } catch (error: any) {
      // console.error("Failed to update subject:", error);
      set({ 
        loading: false, 
        error: error.message || "Gagal memperbarui mata pelajaran" 
      });
      throw error;
    }
  },

  deleteSubject: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const academicYearId = getAcademicYearId();
      const result: any = await studyApi.deleteSubject(academicYearId, id);
      
      if (result.data.success) {
        set({ loading: false });
        
        // Refresh subjects list setelah delete berhasil
        const refreshResult: any = await studyApi.getSubjects(academicYearId);
        if (refreshResult.data.success) {
          set({ subjects: refreshResult.data.data });
        }
        
        return result.data;
      } else {
        throw new Error(result?.data.message || "Gagal menghapus mata pelajaran");
      }
    } catch (error: any) {
      // console.error("Failed to delete subject:", error);
      set({ 
        loading: false, 
        error: error.message || "Gagal menghapus mata pelajaran" 
      });
      throw error;
    }
  },

  // Clear error function
  clearError: () => set({ error: null }),
}));