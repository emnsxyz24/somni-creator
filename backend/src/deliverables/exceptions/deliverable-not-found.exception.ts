import { NotFoundException } from '@nestjs/common';

export class DeliverableNotFoundException extends NotFoundException {
  constructor(message = 'Deliverable not found or does not belong to your account') {
    super({
      code: 'DELIVERABLE_NOT_FOUND',
      message,
    });
  }
}
