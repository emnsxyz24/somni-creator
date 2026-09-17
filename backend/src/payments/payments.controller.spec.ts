import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InvoiceStatus } from '@prisma/client';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import type { CreatePaymentDto } from './dto/create-payment.dto.js';
import type { InvoicePaymentSummaryResponse } from './dto/payment-summary-response.dto.js';

describe('PaymentsController', () => {
  let controller: PaymentsController;
  let paymentsService: {
    recordPayment: ReturnType<typeof vi.fn>;
    findAllByInvoiceId: ReturnType<typeof vi.fn>;
    removePayment: ReturnType<typeof vi.fn>;
  };

  const mockUserId = 'user-uuid-1';
  const mockInvoiceId = 'invoice-uuid-1';
  const mockPaymentId = 'payment-uuid-1';

  const mockSummaryResponse: InvoicePaymentSummaryResponse = {
    payments: [
      {
        id: mockPaymentId,
        invoiceId: mockInvoiceId,
        amount: 5000000,
        paidAt: '2026-09-17T10:00:00.000Z',
        method: 'Bank Transfer BCA',
        note: 'First installment',
        createdAt: new Date('2026-09-17T10:00:00.000Z'),
      },
    ],
    invoiceAmount: 10000000,
    totalPaid: 5000000,
    remainingBalance: 5000000,
    invoiceStatus: InvoiceStatus.PARTIALLY_PAID,
  };

  beforeEach(() => {
    paymentsService = {
      recordPayment: vi.fn().mockResolvedValue(mockSummaryResponse),
      findAllByInvoiceId: vi.fn().mockResolvedValue(mockSummaryResponse),
      removePayment: vi
        .fn()
        .mockResolvedValue({ message: 'Payment deleted successfully' }),
    };

    controller = new PaymentsController(
      paymentsService as unknown as PaymentsService,
    );
  });

  describe('recordPayment', () => {
    it('should delegate to paymentsService.recordPayment with route params and payload', async () => {
      const dto: CreatePaymentDto = {
        amount: 5000000,
        paidAt: '2026-09-17T10:00:00.000Z',
        method: 'Bank Transfer BCA',
        note: 'First installment',
      };

      const result = await controller.recordPayment(
        mockInvoiceId,
        mockUserId,
        dto,
      );

      expect(paymentsService.recordPayment).toHaveBeenCalledWith(
        mockInvoiceId,
        mockUserId,
        dto,
      );
      expect(result).toBe(mockSummaryResponse);
    });
  });

  describe('findAll', () => {
    it('should delegate to paymentsService.findAllByInvoiceId with route params', async () => {
      const result = await controller.findAll(mockInvoiceId, mockUserId);

      expect(paymentsService.findAllByInvoiceId).toHaveBeenCalledWith(
        mockInvoiceId,
        mockUserId,
      );
      expect(result).toBe(mockSummaryResponse);
    });
  });

  describe('removePayment', () => {
    it('should delegate to paymentsService.removePayment with route params', async () => {
      const result = await controller.removePayment(
        mockInvoiceId,
        mockPaymentId,
        mockUserId,
      );

      expect(paymentsService.removePayment).toHaveBeenCalledWith(
        mockInvoiceId,
        mockPaymentId,
        mockUserId,
      );
      expect(result).toEqual({ message: 'Payment deleted successfully' });
    });
  });
});
