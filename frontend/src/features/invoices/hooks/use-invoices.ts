'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoiceApi } from '../api/invoice-api';
import type { CreateInvoiceDto, InvoiceFilterParams } from '../types';

export function useInvoices(params?: InvoiceFilterParams) {
  return useQuery({
    queryKey: ['invoices', params],
    queryFn: () => invoiceApi.getAll(params),
  });
}

export function useInvoice(id: string) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: () => invoiceApi.getById(id),
    enabled: Boolean(id),
  });
}

export function useDealInvoice(dealId: string) {
  return useQuery({
    queryKey: ['deals', dealId, 'invoice'],
    queryFn: () => invoiceApi.getByDealId(dealId),
    enabled: Boolean(dealId),
    retry: false,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInvoiceDto) => invoiceApi.create(data),
    onSuccess: (newInvoice) => {
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
      void queryClient.invalidateQueries({ queryKey: ['deals'] });
      void queryClient.invalidateQueries({ queryKey: ['deals', newInvoice.dealId] });
      void queryClient.invalidateQueries({
        queryKey: ['deals', newInvoice.dealId, 'invoice'],
      });
    },
  });
}

export function useMarkInvoiceAsSent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceApi.markAsSent(id),
    onSuccess: (updatedInvoice) => {
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
      void queryClient.invalidateQueries({
        queryKey: ['invoices', updatedInvoice.id],
      });
      void queryClient.invalidateQueries({
        queryKey: ['deals', updatedInvoice.dealId, 'invoice'],
      });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => invoiceApi.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['invoices'] });
      void queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });
}

export function useDownloadInvoicePdf() {
  return useMutation({
    mutationFn: ({ id, invoiceNumber }: { id: string; invoiceNumber: string }) =>
      invoiceApi.downloadPdf(id, invoiceNumber),
  });
}
