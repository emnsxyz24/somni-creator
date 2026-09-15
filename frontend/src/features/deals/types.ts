import { z } from 'zod';

export const DealStatus = {
  LEAD: 'LEAD',
  NEGOTIATING: 'NEGOTIATING',
  CONTRACT_SENT: 'CONTRACT_SENT',
  IN_PROGRESS: 'IN_PROGRESS',
  DELIVERED: 'DELIVERED',
  INVOICED: 'INVOICED',
  PAID: 'PAID',
  LOST: 'LOST',
  CANCELLED: 'CANCELLED',
} as const;

export type DealStatus = (typeof DealStatus)[keyof typeof DealStatus];

export const DealSource = {
  MANUAL: 'MANUAL',
  AI_EXTRACTED_WEB: 'AI_EXTRACTED_WEB',
  AI_EXTRACTED_TELEGRAM: 'AI_EXTRACTED_TELEGRAM',
} as const;

export type DealSource = (typeof DealSource)[keyof typeof DealSource];

export interface Deal {
  id: string;
  userId: string;
  brandId: string;
  title: string;
  status: DealStatus;
  valueAmount: number;
  valueCurrency: string;
  source: DealSource;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  allowedNextStatuses: DealStatus[];
  brand?: {
    id: string;
    name: string;
    contactName: string | null;
    contactEmail: string | null;
  };
}

export const dealFormSchema = z.object({
  brandId: z.string().min(1, 'Please select a brand'),
  title: z
    .string()
    .trim()
    .min(1, 'Deal title is required')
    .max(150, 'Title must be under 150 characters'),
  valueAmount: z
    .number({ message: 'Value must be a number' })
    .min(0, 'Value must be 0 or greater'),
  valueCurrency: z.string(),
  source: z.enum(['MANUAL', 'AI_EXTRACTED_WEB', 'AI_EXTRACTED_TELEGRAM']),
  notes: z.string().trim().max(1000).optional(),
});

export type DealFormValues = z.infer<typeof dealFormSchema>;

export interface DealFilters {
  status?: DealStatus | 'ALL';
  brandId?: string | 'ALL';
  searchQuery?: string;
}
