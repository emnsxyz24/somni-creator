import type {
  DeliverableStatus,
  DeliverableType,
  InvoiceStatus,
} from '@prisma/client';

export interface InvoicePdfBrand {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
}

export interface InvoicePdfDeliverable {
  id: string;
  type: DeliverableType;
  description: string;
  dueDate: Date;
  status: DeliverableStatus;
}

export interface InvoicePdfDeal {
  id: string;
  title: string;
  valueAmount: bigint | number;
  valueCurrency: string;
  brand: InvoicePdfBrand;
  deliverables: InvoicePdfDeliverable[];
}

export interface InvoicePdfUser {
  id: string;
  name: string;
  email: string;
}

export interface InvoiceWithPdfRelations {
  id: string;
  userId: string;
  dealId: string;
  invoiceNumber: string;
  issuedDate: Date;
  dueDate: Date;
  amount: bigint | number;
  currency: string;
  status: InvoiceStatus;
  pdfUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deal: InvoicePdfDeal;
  user: InvoicePdfUser;
}
