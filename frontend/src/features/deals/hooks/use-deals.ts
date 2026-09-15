'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dealApi } from '../api/deal-api';
import type { DealFormValues, DealStatus } from '../types';

export function useDeals(params?: { status?: DealStatus; brandId?: string }) {
  return useQuery({
    queryKey: ['deals', params],
    queryFn: () => dealApi.getAll(params),
  });
}

export function useDeal(id: string) {
  return useQuery({
    queryKey: ['deals', id],
    queryFn: () => dealApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DealFormValues) => dealApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useUpdateDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<DealFormValues>;
    }) => dealApi.update(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['deals'] });
      void queryClient.invalidateQueries({ queryKey: ['deals', id] });
    },
  });
}

export function useUpdateDealStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: DealStatus;
    }) => dealApi.updateStatus(id, status),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['deals'] });
      void queryClient.invalidateQueries({ queryKey: ['deals', id] });
    },
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => dealApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}
