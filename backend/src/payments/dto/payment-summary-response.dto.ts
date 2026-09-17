import { InvoiceStatus } from '@prisma/client';
import { PaymentResponse } from './payment-response.dto.js';

export interface InvoicePaymentSummaryResponse {
  payments: PaymentResponse[];
  invoiceAmount: number;
  totalPaid: number;
  remainingBalance: number;
  invoiceStatus: InvoiceStatus;
}
