import { apiClient } from '@/lib/api-client';
import type { Deal, DealFormValues, DealStatus } from '../types';

export const dealApi = {
  getAll: (params?: { status?: DealStatus; brandId?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.status) {
      searchParams.set('status', params.status);
    }
    if (params?.brandId) {
      searchParams.set('brandId', params.brandId);
    }
    const qs = searchParams.toString();
    return apiClient<Deal[]>(`/deals${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) => apiClient<Deal>(`/deals/${id}`),

  create: (data: DealFormValues) =>
    apiClient<Deal>('/deals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<DealFormValues>) =>
    apiClient<Deal>(`/deals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: DealStatus) =>
    apiClient<Deal>(`/deals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  delete: (id: string) =>
    apiClient<{ message: string }>(`/deals/${id}`, {
      method: 'DELETE',
    }),
};
