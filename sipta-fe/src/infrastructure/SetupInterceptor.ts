// src/infrastructure/setupInterceptors.ts
import axios from "axios";
import { apiClient, getErrorMessage } from "./Instance";
import { useAuthStore } from "../state/AuthStore";

let interceptorsRegistered = false;

const setAuthorizationHeader = (headers: unknown, token: string) => {
  const mergedHeaders = axios.AxiosHeaders.from(headers as any);
  mergedHeaders.set("Authorization", `Bearer ${token}`);
  return mergedHeaders;
};

const isAuthEndpoint = (url?: string) => {
  const skipEndpoints = ["/auth/sign-in", "/auth/refresh", "/auth/sign-out"];
  return skipEndpoints.some((endpoint) => url?.includes(endpoint));
};

const isRetryableError = (error: unknown) => {
  if (!error || typeof error !== "object") {
    return false;
  }

  const axiosError = error as { response?: { status?: number } };
  if (!axiosError.response) {
    return true;
  }

  return [408, 429, 500, 502, 503, 504].includes(axiosError.response.status ?? 0);
};

export const setupAuthInterceptor = () => {
  if (interceptorsRegistered) {
    return;
  }

  interceptorsRegistered = true;

  apiClient.interceptors.request.use(
    (config) => {
      const token = useAuthStore.getState().token;

      if (token && !isAuthEndpoint(config.url)) {
        config.headers = setAuthorizationHeader(config.headers, token);
      }

      return config;
    },
    (error) => Promise.reject(error)
  );

  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config ?? {};

      if (isAuthEndpoint(originalRequest.url)) {
        return Promise.reject(error);
      }

      if (isRetryableError(error) && !originalRequest._retry) {
        originalRequest._retry = true;

        await new Promise((resolve) => setTimeout(resolve, 300));
        return apiClient(originalRequest);
      }

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          await useAuthStore.getState().refreshAuthToken();

          const newToken = useAuthStore.getState().token;
          if (newToken) {
            originalRequest.headers = setAuthorizationHeader(
              originalRequest.headers,
              newToken
            );
          }

          return apiClient(originalRequest);
        } catch {
          useAuthStore.getState().clearAuth();
          return Promise.reject(error);
        }
      }

      return Promise.reject(new Error(getErrorMessage(error)));
    }
  );
};