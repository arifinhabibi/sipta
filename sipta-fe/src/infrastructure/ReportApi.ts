import { apiClient } from './Instance';

export interface UpdateStudentAssessmentPayload {
  accomplishmentStudentId: string;
  newScore: number;
  isCapable?: boolean;
}


export const reportApi = {
    generateStudentReport: (id: string) => {
        
    },
    generateBulkReport: (id: string) => {

    },
    generateTeacherReport: () => {

    },
    generateClassroomReport: (id: string) => {

    },
    attendancesTeacher: async (startDate: string, endDate: string) => {
        return await apiClient.get(`/reports/attendances-teacher`, {
        params: {
          start_date: startDate,
          end_date: endDate,
        }
      })
    },
    performanceStudents: async (classroom_id: string) => {
        return await apiClient.get(`/reports/perfomance-students/${classroom_id}`)
    },
    performanceStudentsByStudent: async (student_id: string) => {
        return await apiClient.get(`/reports/perfomance-students/student/${student_id}`)
    },
    updatePerformanceStudent: async (studentId: string, payload: UpdateStudentAssessmentPayload) => {
        return await apiClient.put(`/reports/perfomance-students/${studentId}`, payload)
    },
    canonicalPerformanceStudents: (classroomId: string, academicYearId?: string) =>
        apiClient.get(`/reports/performance-students/${classroomId}`, {
            params: academicYearId ? { academic_year_id: academicYearId } : undefined,
        }),
    canonicalPerformanceStudent: (studentId: string, academicYearId?: string) =>
        apiClient.get(`/reports/performance-students/student/${studentId}`, {
            params: academicYearId ? { academic_year_id: academicYearId } : undefined,
        }),
    exportAttendancesTeacher: async (startDate: string, endDate: string) => {
        return await apiClient.get(`/admin/attendance-teachers/export`, {
        params: {
          start_date: startDate,
          end_date: endDate,
        },
        responseType: 'blob'
      })
    },
    exportPerformanceStudentPDF: async (studentId: string) => {
        return await apiClient.get(`/reports/perfomance-students/student/${studentId}/export/pdf`, {
            responseType: 'blob'
        })
    }
}
