import { DeliverableStatus, DeliverableType } from '@prisma/client';

export interface DeliverableResponse {
  id: string;
  dealId: string;
  type: DeliverableType;
  description: string | null;
  dueDate: string;
  status: DeliverableStatus;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
