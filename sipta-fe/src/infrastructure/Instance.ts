// src/infrastructure/apiBase.ts
import axios from "axios";

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api/v1",
  timeout: 10000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
  },
});

export const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.message) {
      return String(error.response.data.message);
    }

    if (error.response?.statusText) {
      return error.response.statusText;
    }

    if (error.message) {
      return error.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Terjadi kesalahan jaringan. Silakan coba lagi.";
};

// Fungsi untuk set token (dipanggil setelah login)
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common["Authorization"];
  }
};
