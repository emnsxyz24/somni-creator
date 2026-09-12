'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { brandApi } from '../api/brand-api';
import type { BrandFormValues } from '../types';

export function useBrands() {
  return useQuery({
    queryKey: ['brands'],
    queryFn: () => brandApi.getAll(),
  });
}

export function useBrand(id: string) {
  return useQuery({
    queryKey: ['brands', id],
    queryFn: () => brandApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BrandFormValues) => brandApi.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<BrandFormValues>;
    }) => brandApi.update(id, data),
    onSuccess: (_, { id }) => {
      void queryClient.invalidateQueries({ queryKey: ['brands'] });
      void queryClient.invalidateQueries({ queryKey: ['brands', id] });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => brandApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['brands'] });
    },
  });
}
