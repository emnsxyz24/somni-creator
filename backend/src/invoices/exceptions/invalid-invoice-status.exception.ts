import { BadRequestException } from '@nestjs/common';

export class InvalidInvoiceStatusException extends BadRequestException {
  constructor(
    message = 'Cannot manually update status to PAID or PARTIALLY_PAID. Status is driven by payments.',
  ) {
    super({
      code: 'INVALID_INVOICE_STATUS',
      message,
    });
  }
}
