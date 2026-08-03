// services/academicYearApi.ts
import { AcademicYear, AcademicYearRolloverPayload, CreateAcademicYearPayload, UpdateAcademicYearPayload } from "../domain/AcademicYearEntity";
import { apiClient } from "./Instance";
import type { ApiResponse } from "./ApiResponse";

export const academicYearApi = {
  // Get all academic years
  getAcademicYears: (): ApiResponse<AcademicYear[]> =>
    apiClient.get("/instance/academic-years"),

  // Create new academic year
  createAcademicYear: (payload: CreateAcademicYearPayload): ApiResponse<AcademicYear> =>
    apiClient.post("/admin/instance/academic-year", payload),

  // Update academic year
  updateAcademicYear: (id: string, payload: UpdateAcademicYearPayload): ApiResponse<AcademicYear> =>
    apiClient.put(`/admin/instance/academic-year/${id}`, payload),

  // Delete academic year
  deleteAcademicYear: (id: string): ApiResponse<null> =>
    apiClient.delete(`/admin/instance/academic-year/${id}`),

  // Set active academic year
  setActiveAcademicYear: (id: string): ApiResponse<AcademicYear> =>
    apiClient.put(`/admin/instance/academic-year/${id}`, { is_active: true }),

  closeAcademicYear: (id: string): ApiResponse<AcademicYear> =>
    apiClient.post(`/admin/academic-years/${id}/close`),

  rolloverAcademicYear: (id: string, payload: AcademicYearRolloverPayload) =>
    apiClient.post(`/admin/academic-years/${id}/rollover`, payload),

  transitionAcademicYear: (id: string, payload: AcademicYearRolloverPayload) =>
    apiClient.post(`/admin/academic-years/${id}/transition`, payload),
};
