import { z } from 'zod';

export const DeliverableType = {
  TIKTOK: 'TIKTOK',
  IG_STORY: 'IG_STORY',
  IG_POST: 'IG_POST',
  IG_REEL: 'IG_REEL',
  YOUTUBE_SHORT: 'YOUTUBE_SHORT',
  YOUTUBE_VIDEO: 'YOUTUBE_VIDEO',
  OTHER: 'OTHER',
} as const;

export type DeliverableType =
  (typeof DeliverableType)[keyof typeof DeliverableType];

export const DeliverableStatus = {
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
} as const;

export type DeliverableStatus =
  (typeof DeliverableStatus)[keyof typeof DeliverableStatus];

export interface Deliverable {
  id: string;
  dealId: string;
  type: DeliverableType;
  description: string | null;
  dueDate: string;
  status: DeliverableStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const deliverableFormSchema = z.object({
  type: z.enum([
    'TIKTOK',
    'IG_STORY',
    'IG_POST',
    'IG_REEL',
    'YOUTUBE_SHORT',
    'YOUTUBE_VIDEO',
    'OTHER',
  ]),
  description: z.string().trim().max(1000).optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  status: z.enum(['PENDING', 'SUBMITTED', 'APPROVED']),
});

export type DeliverableFormValues = z.infer<typeof deliverableFormSchema>;
