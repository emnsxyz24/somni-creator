import { z } from 'zod';

export const InvoiceStatus = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  PARTIALLY_PAID: 'PARTIALLY_PAID',
  PAID: 'PAID',
  OVERDUE: 'OVERDUE',
} as const;

export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export interface InvoiceDeliverable {
  id: string;
  type: string;
  description: string | null;
  dueDate: string;
  status: string;
}

export interface InvoiceBrand {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
}

export interface InvoiceDeal {
  id: string;
  title: string;
  status: string;
  valueAmount?: number;
  valueCurrency?: string;
  brand?: InvoiceBrand;
  deliverables?: InvoiceDeliverable[];
}

export interface Invoice {
  id: string;
  userId: string;
  dealId: string;
  invoiceNumber: string;
  issuedDate: string;
  dueDate: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  pdfUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deal?: InvoiceDeal;
}

export interface CreateInvoiceDto {
  dealId: string;
  dueDate: string;
  issuedDate?: string;
  notes?: string;
}

export interface UpdateInvoiceDto {
  status?: 'SENT';
  notes?: string;
}

export interface InvoiceFilterParams {
  status?: InvoiceStatus;
  dealId?: string;
}

export const createInvoiceFormSchema = z.object({
  dealId: z.string().min(1, 'Please select a deal'),
  dueDate: z.string().min(1, 'Due date is required'),
  issuedDate: z.string().optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type CreateInvoiceFormData = z.infer<typeof createInvoiceFormSchema>;
