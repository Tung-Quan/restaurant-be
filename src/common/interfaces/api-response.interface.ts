/**
 * Standard API response wrapper.
 *
 * SOLID: Single Responsibility Principle (SRP)
 * - This interface has one job: defining the shape of every API response.
 *
 * SOLID: Open/Closed Principle (OCP)
 * - Generic type T allows extending to any data shape without modifying the interface.
 */

export interface ApiResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  meta?: ApiResponseMeta;
  error?: ApiErrorDetail | null;
}
