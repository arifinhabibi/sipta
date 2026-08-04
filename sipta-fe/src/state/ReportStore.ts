// src/state/ReportStore.ts
import { create } from 'zustand';
import { reportApi } from '../infrastructure/ReportApi';

interface ReportStore {
  loading: boolean;
  error: string | null;
  
  generateStudentReport: (studentId: string) => Promise<void>;
  generateBulkReport: () => Promise<void>;
  generateTeacherReport: () => Promise<void>;
  generateClassroomReport: (classroomId: string) => Promise<void>;
  attendancesTeacher: (startDate: string, endDate: string) => Promise<void>;
  performanceStudents: (classroom_id: string) => Promise<void>;
  performanceStudentsByStudent: (student_id: string) => Promise<void>;
  /**
   * Read-only, semester-aware student report.
   * When `academicYearId` is omitted the backend returns the active term.
   * See docs/frontend-architecture/21-semester-student-report.md.
   */
  canonicalPerformanceStudent: (student_id: string, academicYearId?: string) => Promise<any>;
  exportAttendanceTeachers: (startDate: string, endDate: string) => Promise<void>;
  updatePerformanceStudent: (studentId: string, payload: any) => Promise<void>;
  exportPerformanceStudentPDF: (studentId: string) => Promise<void>;
}

export const useReportStore = create<ReportStore>((set, get) => ({
  loading: false,
  error: null,
  attendancesTeacher:  async (startDate: string, endDate: string) => {
    try {
      const response = await reportApi.attendancesTeacher(startDate, endDate);
      return response.data;
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      throw error;
    }
  },
  generateStudentReport: async (studentId: string) => {
    set({ loading: true, error: null });
    try {
      const response: any = await reportApi.generateStudentReport(studentId);
      
      // Create download link for PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laporan-siswa-${studentId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      set({ loading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Gagal generate laporan siswa';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  generateBulkReport: async () => {
    set({ loading: true, error: null });
    try {
      const response: any = await reportApi.generateBulkReport('');
      
      // Create download link for PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laporan-semua-siswa-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      set({ loading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Gagal generate laporan bulk';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  generateTeacherReport: async () => {
    set({ loading: true, error: null });
    try {
      const response: any = await reportApi.generateTeacherReport();
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laporan-guru.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      set({ loading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Gagal generate laporan guru';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },

  generateClassroomReport: async (classroomId: string) => {
    set({ loading: true, error: null });
    try {
      const response: any = await reportApi.generateClassroomReport(classroomId);
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laporan-kelas-${classroomId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      set({ loading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Gagal generate laporan kelas';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  },
  performanceStudents: async (classroom_id: string) => {
      try {
        const response: any = await reportApi.performanceStudents(classroom_id);
        // console.log(response)
          if (response.data.success) {
            return response.data
          }
        } catch (error) {
          throw error;
        }
  }, 
  performanceStudentsByStudent: async (student_id: string) => {

      try {
        const response: any = await reportApi.performanceStudentsByStudent(student_id);
        if (response.data.success) {
          return response.data
        }
        } catch (error) {
          throw error;
        }
  },
  canonicalPerformanceStudent: async (student_id: string, academicYearId?: string) => {
    // Semester-aware read. Uses the correctly-spelled canonical endpoint.
    try {
      const response: any = await reportApi.canonicalPerformanceStudent(student_id, academicYearId);
      if (response.data?.success) {
        return response.data;
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  updatePerformanceStudent: async (studentId: string, payload: any) => {
      try {
        const response: any = await reportApi.updatePerformanceStudent(studentId, payload);
        if (response.data.success) {
          return response.data
        }
        } catch (error) {
          throw error;
        }
  },
  exportAttendanceTeachers: async (startDate: string, endDate: string) => {
    try {
        const response: any = await reportApi.exportAttendancesTeacher(startDate, endDate);
        return response.data
        } catch (error) {
          throw error;
        }
  },
  exportPerformanceStudentPDF: async (studentId: string) => {
    set({ loading: true, error: null });
    try {
      const response: any = await reportApi.exportPerformanceStudentPDF(studentId);
      
      // Create download link for PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `laporan-performa-siswa-${studentId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      set({ loading: false });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Gagal mengunduh PDF performa siswa';
      set({ error: errorMessage, loading: false });
      throw error;
    }
  } 
}));
