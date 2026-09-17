import { BadRequestException } from '@nestjs/common';

export class PaymentAmountExceededException extends BadRequestException {
  constructor(remainingBalance: number, attemptedAmount: number) {
    super({
      code: 'PAYMENT_AMOUNT_EXCEEDED',
      message: `Payment amount (${attemptedAmount}) exceeds the remaining invoice balance (${remainingBalance}).`,
      details: {
        remainingBalance,
        attemptedAmount,
      },
    });
  }
}
