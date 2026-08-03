
import { apiClient } from "./Instance";
import type { ApiResponse } from "./ApiResponse";

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
}

export const authApi = {
  login: async (username: string, password: string) => {
    return await apiClient.post("/auth/sign-in", { username, password });
  },

  logout: async (refreshToken?: string | null) => {
    return await apiClient.delete("/auth/sign-out", {
      data: refreshToken ? { refresh_token: refreshToken } : undefined,
    });
  },
   getMe: () =>  apiClient.get('/me'),
   changePassword: (payload: any) => apiClient.put('/auth/change-password', payload),
   updateInstance: (payload: any) => apiClient.post('/admin/instance', payload),
   refreshToken: (token: string): ApiResponse<AuthTokenResponse> =>
     apiClient.post('/auth/refresh', { refresh_token: token })
};
