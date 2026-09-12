import { z } from 'zod';

export interface Brand {
  id: string;
  userId: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export const brandFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Brand name is required')
    .max(100, 'Brand name must be under 100 characters'),
  contactName: z.string().trim().max(100).optional(),
  contactEmail: z
    .string()
    .trim()
    .email('Please enter a valid email address')
    .or(z.literal(''))
    .optional(),
  notes: z.string().trim().max(1000).optional(),
});

export type BrandFormValues = z.infer<typeof brandFormSchema>;
