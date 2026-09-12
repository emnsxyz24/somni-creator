import { Injectable } from '@nestjs/common';
import { DealStatus } from '@prisma/client';
import { InvalidStatusTransitionException } from './exceptions/invalid-status-transition.exception.js';

const ALLOWED_TRANSITIONS: Record<DealStatus, readonly DealStatus[]> = {
  [DealStatus.LEAD]: [
    DealStatus.NEGOTIATING,
    DealStatus.LOST,
    DealStatus.CANCELLED,
  ],
  [DealStatus.NEGOTIATING]: [
    DealStatus.CONTRACT_SENT,
    DealStatus.LOST,
    DealStatus.CANCELLED,
  ],
  [DealStatus.CONTRACT_SENT]: [
    DealStatus.IN_PROGRESS,
    DealStatus.LOST,
    DealStatus.CANCELLED,
  ],
  [DealStatus.IN_PROGRESS]: [
    DealStatus.DELIVERED,
    DealStatus.LOST,
    DealStatus.CANCELLED,
  ],
  [DealStatus.DELIVERED]: [
    DealStatus.INVOICED,
    DealStatus.LOST,
    DealStatus.CANCELLED,
  ],
  [DealStatus.INVOICED]: [
    DealStatus.PAID,
    DealStatus.LOST,
    DealStatus.CANCELLED,
  ],
  [DealStatus.PAID]: [],
  [DealStatus.LOST]: [],
  [DealStatus.CANCELLED]: [],
};

@Injectable()
export class DealStatusService {
  getAllowedTransitions(currentStatus: DealStatus): DealStatus[] {
    return [...(ALLOWED_TRANSITIONS[currentStatus] ?? [])];
  }

  isValidTransition(from: DealStatus, to: DealStatus): boolean {
    const allowed = ALLOWED_TRANSITIONS[from];
    if (!allowed) {
      return false;
    }
    return allowed.includes(to);
  }

  validateTransition(from: DealStatus, to: DealStatus): void {
    if (from === to) {
      return;
    }

    if (!this.isValidTransition(from, to)) {
      throw new InvalidStatusTransitionException(
        from,
        to,
        this.getAllowedTransitions(from),
      );
    }
  }
}
