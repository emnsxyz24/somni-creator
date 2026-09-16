import { ConflictException } from '@nestjs/common';

export class InvoiceConflictException extends ConflictException {
  constructor(message = 'An invoice has already been created for this deal') {
    super({
      code: 'INVOICE_ALREADY_EXISTS',
      message,
    });
  }
}
