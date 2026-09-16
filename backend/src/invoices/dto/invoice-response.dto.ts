import { InvoiceStatus } from '@prisma/client';

export interface InvoiceResponse {
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
  deal?: {
    id: string;
    title: string;
    status: string;
    brand?: {
      id: string;
      name: string;
      contactName: string | null;
      contactEmail: string | null;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
