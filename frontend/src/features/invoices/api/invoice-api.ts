import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import type {
  Invoice,
  CreateInvoiceDto,
  UpdateInvoiceDto,
  InvoiceFilterParams,
} from '../types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const invoiceApi = {
  getAll: (params?: InvoiceFilterParams) => {
    const searchParams = new URLSearchParams();
    if (params?.status) {
      searchParams.set('status', params.status);
    }
    if (params?.dealId) {
      searchParams.set('dealId', params.dealId);
    }
    const qs = searchParams.toString();
    return apiClient<Invoice[]>(`/invoices${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) => apiClient<Invoice>(`/invoices/${id}`),

  getByDealId: (dealId: string) =>
    apiClient<Invoice>(`/deals/${dealId}/invoice`),

  create: (data: CreateInvoiceDto) =>
    apiClient<Invoice>('/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  markAsSent: (id: string) =>
    apiClient<Invoice>(`/invoices/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'SENT' } satisfies UpdateInvoiceDto),
    }),

  delete: (id: string) =>
    apiClient<{ message: string }>(`/invoices/${id}`, {
      method: 'DELETE',
    }),

  downloadPdf: async (id: string, invoiceNumber: string): Promise<void> => {
    const token = useAuthStore.getState().accessToken;
    const response = await fetch(`${API_BASE_URL}/invoices/${id}/pdf`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to download invoice PDF: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};
