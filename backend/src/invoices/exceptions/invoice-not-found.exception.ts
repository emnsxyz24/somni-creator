import { NotFoundException } from '@nestjs/common';

export class InvoiceNotFoundException extends NotFoundException {
  constructor(message = 'Invoice not found or does not belong to your account') {
    super({
      code: 'INVOICE_NOT_FOUND',
      message,
    });
  }
}
