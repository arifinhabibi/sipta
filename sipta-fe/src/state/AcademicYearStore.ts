// stores/useAcademicYearStore.ts
import { create } from "zustand";
import { AcademicYear, AcademicYearRolloverPayload, CreateAcademicYearPayload, UpdateAcademicYearPayload } from "../domain/AcademicYearEntity";
import { academicYearApi } from "../infrastructure/AcademicYearApi";
import { updateAcademicYearInLocalStorage } from "../utils/LocalStorageAuth";
import { useAuthStore } from "./AuthStore";

interface AcademicYearStore {
  academicYears: AcademicYear[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchAcademicYears: () => Promise<void>;
  createAcademicYear: (payload: CreateAcademicYearPayload) => Promise<void>;
  updateAcademicYear: (id: string, payload: UpdateAcademicYearPayload) => Promise<void>;
  deleteAcademicYear: (id: string) => Promise<void>;
  setActiveAcademicYear: (id: string) => Promise<void>;
  closeAcademicYear: (id: string) => Promise<void>;
  rolloverAcademicYear: (id: string, payload: AcademicYearRolloverPayload) => Promise<void>;
  clearError: () => void;
}

export const useAcademicYearStore = create<AcademicYearStore>((set, get) => ({
  academicYears: [],
  loading: false,
  error: null,

  fetchAcademicYears: async () => {
    set({ loading: true, error: null });
    // console.log("Fetching academic years...");
    try {
      const response = await academicYearApi.getAcademicYears();
      
      if (response.data.success) {
        set({ academicYears: response.data.data, loading: false });
      } else {
        throw new Error(response.data.message || "Gagal mengambil data tahun akademik");
      }
    } catch (error: any) {
      // console.error("Failed to fetch academic years:", error);
      set({ 
        loading: false, 
        error: error.response?.data?.message || error.message || "Gagal mengambil data tahun akademik" 
      });
    }
  },

  createAcademicYear: async (payload: CreateAcademicYearPayload) => {
    set({ loading: true, error: null });
    try {
      const response = await academicYearApi.createAcademicYear(payload);
      
      if (response.data.success) {
        // Refresh list setelah create berhasil
        await get().fetchAcademicYears();
      } else {
        throw new Error(response.data.message || "Gagal membuat tahun akademik");
      }
    } catch (error: any) {
      // console.error("Failed to create academic year:", error);
      set({ 
        loading: false, 
        error: error.response?.data?.message || error.message || "Gagal membuat tahun akademik" 
      });
      throw error;
    }
  },

  updateAcademicYear: async (id: string, payload: UpdateAcademicYearPayload) => {
    set({ loading: true, error: null });
    try {
      const response = await academicYearApi.updateAcademicYear(id, payload);
      
      if (response.data.success) {
        // Refresh list setelah update berhasil
        await get().fetchAcademicYears();
        updateAcademicYearInLocalStorage(get().academicYears.find(ay => ay.is_active === true)!);

         setTimeout(() => {
          window.location.reload();
        }, 1500); // Tunggu 1.5 detik agar user lihat toast success dulu
        
      } else {
        throw new Error(response.data.message || "Gagal memperbarui tahun akademik");
      }
    } catch (error: any) {
      // console.error("Failed to update academic year:", error);
      set({ 
        loading: false, 
        error: error.response?.data?.message || error.message || "Gagal memperbarui tahun akademik" 
      });
      throw error;
    }
  },

  deleteAcademicYear: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await academicYearApi.deleteAcademicYear(id);
      
      if (response.data.success) {
        // Refresh list setelah delete berhasil
        await get().fetchAcademicYears();
      } else {
        throw new Error(response.data.message || "Gagal menghapus tahun akademik");
      }
    } catch (error: any) {
      // console.error("Failed to delete academic year:", error);
      set({ 
        loading: false, 
        error: error.response?.data?.message || error.message || "Gagal menghapus tahun akademik" 
      });
      throw error;
    }
  },

  setActiveAcademicYear: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const academicYears = get().academicYears;
      const currentAcademicYear = academicYears.find(ay => ay.is_active);
      const targetAcademicYear = academicYears.find(ay => ay.id === id);
      const isSequentialTransition = Boolean(
        currentAcademicYear
        && targetAcademicYear
        && currentAcademicYear.id !== targetAcademicYear.id
        && new Date(targetAcademicYear.start_periode).getTime()
          > new Date(currentAcademicYear.start_periode).getTime()
      );

      const response = isSequentialTransition
        ? await academicYearApi.transitionAcademicYear(
            currentAcademicYear!.id,
            { target_academic_year_id: id }
          )
        : await academicYearApi.setActiveAcademicYear(id);
      
      if (response.data.success) {
        // Cari academic year yang baru diaktifkan dari list
        const activatedAcademicYear = academicYears.find(ay => ay.id === id);
        
        if (activatedAcademicYear) {
          // console.log('🔄 Updating academic year in auth store...');
          
          // Get the instance_id from auth store and add it to academic year object
          const authStore = useAuthStore.getState();
          const academicYearWithInstanceId = {
            ...activatedAcademicYear,
            instance_id: authStore.instance?.id || ''
          };
          
          useAuthStore.getState().updateAcademicYear(academicYearWithInstanceId);
        }
        
        // Refresh list setelah set active berhasil
        await get().fetchAcademicYears();

        setTimeout(() => {
          window.location.reload();
        }, 1500); // Tunggu 1.5 detik agar user lihat toast success dulu
        
      } else {
        throw new Error(response.data.message || "Gagal mengaktifkan tahun akademik");
      }
    } catch (error: any) {
      // console.error("Failed to set active academic year:", error);
      set({ 
        loading: false, 
        error: error.response?.data?.message || error.message || "Gagal mengaktifkan tahun akademik" 
      });
      throw error;
    }
  },

  closeAcademicYear: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await academicYearApi.closeAcademicYear(id);
      if (!response.data.success) {
        throw new Error(response.data.message || "Gagal menutup tahun akademik");
      }
      await get().fetchAcademicYears();
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.message || error.message || "Gagal menutup tahun akademik",
      });
      throw error;
    }
  },

  rolloverAcademicYear: async (id: string, payload: AcademicYearRolloverPayload) => {
    set({ loading: true, error: null });
    try {
      const response = await academicYearApi.rolloverAcademicYear(id, payload);
      if (!response.data.success) {
        throw new Error(response.data.message || "Gagal memindahkan semester");
      }
      await get().fetchAcademicYears();
    } catch (error: any) {
      set({
        loading: false,
        error: error.response?.data?.message || error.message || "Gagal memindahkan semester",
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
