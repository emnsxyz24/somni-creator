import { NotFoundException } from '@nestjs/common';

export class PaymentNotFoundException extends NotFoundException {
  constructor(message = 'Payment not found or does not belong to this invoice') {
    super({
      code: 'PAYMENT_NOT_FOUND',
      message,
    });
  }
}
