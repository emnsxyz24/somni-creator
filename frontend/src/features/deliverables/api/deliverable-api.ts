import { apiClient } from '@/lib/api-client';
import type { Deliverable, DeliverableFormValues } from '../types';

export const deliverableApi = {
  getAll: (dealId: string) =>
    apiClient<Deliverable[]>(`/deals/${dealId}/deliverables`),

  getById: (dealId: string, id: string) =>
    apiClient<Deliverable>(`/deals/${dealId}/deliverables/${id}`),

  create: (dealId: string, data: DeliverableFormValues) =>
    apiClient<Deliverable>(`/deals/${dealId}/deliverables`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (
    dealId: string,
    id: string,
    data: Partial<DeliverableFormValues>,
  ) =>
    apiClient<Deliverable>(`/deals/${dealId}/deliverables/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: (dealId: string, id: string) =>
    apiClient<{ message: string }>(`/deals/${dealId}/deliverables/${id}`, {
      method: 'DELETE',
    }),
};
