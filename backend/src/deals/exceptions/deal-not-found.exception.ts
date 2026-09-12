import { NotFoundException } from '@nestjs/common';

export class DealNotFoundException extends NotFoundException {
  constructor(message = 'Deal not found or does not belong to your account') {
    super({
      code: 'DEAL_NOT_FOUND',
      message,
    });
  }
}
