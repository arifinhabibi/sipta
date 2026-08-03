import type { AxiosResponse } from "axios";

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  errors?: Record<string, string[]>;
}

export type ApiResponse<T> = Promise<AxiosResponse<ApiEnvelope<T>>>;

