import { apiClient } from '@/lib/api-client';
import type { Brand, BrandFormValues } from '../types';

export const brandApi = {
  getAll: () => apiClient<Brand[]>('/brands'),

  getById: (id: string) => apiClient<Brand>(`/brands/${id}`),

  create: (data: BrandFormValues) =>
    apiClient<Brand>('/brands', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<BrandFormValues>) =>
    apiClient<Brand>(`/brands/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    apiClient<{ message: string }>(`/brands/${id}`, {
      method: 'DELETE',
    }),
};
