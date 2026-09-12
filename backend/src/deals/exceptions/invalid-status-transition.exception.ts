import { BadRequestException } from '@nestjs/common';
import type { DealStatus } from '@prisma/client';

export class InvalidStatusTransitionException extends BadRequestException {
  constructor(from: DealStatus, to: DealStatus, allowed: DealStatus[]) {
    const allowedText =
      allowed.length > 0 ? allowed.join(', ') : 'none (terminal state)';
    super({
      code: 'INVALID_STATUS_TRANSITION',
      message: `Cannot transition deal from ${from} to ${to}. Allowed transitions: ${allowedText}`,
    });
  }
}
