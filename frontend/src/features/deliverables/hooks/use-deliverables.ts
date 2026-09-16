'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deliverableApi } from '../api/deliverable-api';
import type { DeliverableFormValues } from '../types';

export function useDeliverables(dealId: string) {
  return useQuery({
    queryKey: ['deals', dealId, 'deliverables'],
    queryFn: () => deliverableApi.getAll(dealId),
    enabled: Boolean(dealId),
  });
}

export function useCreateDeliverable(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeliverableFormValues) =>
      deliverableApi.create(dealId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['deals', dealId, 'deliverables'],
      });
      void queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useUpdateDeliverable(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<DeliverableFormValues>;
    }) => deliverableApi.update(dealId, id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['deals', dealId, 'deliverables'],
      });
      void queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useDeleteDeliverable(dealId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deliverableApi.delete(dealId, id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['deals', dealId, 'deliverables'],
      });
      void queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}
