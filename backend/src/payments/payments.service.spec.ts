import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DealStatus, InvoiceStatus } from '@prisma/client';
import { PaymentsService } from './payments.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { InvoicesService } from '../invoices/invoices.service.js';
import { DealsService } from '../deals/deals.service.js';
import { PaymentNotFoundException } from './exceptions/payment-not-found.exception.js';
import { PaymentAmountExceededException } from './exceptions/payment-amount-exceeded.exception.js';
import { InvoiceNotFoundException } from '../invoices/exceptions/invoice-not-found.exception.js';
import type { CreatePaymentDto } from './dto/create-payment.dto.js';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let prisma: {
    payment: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      aggregate: ReturnType<typeof vi.fn>;
    };
    invoice: {
      update: ReturnType<typeof vi.fn>;
    };
    deal: {
      update: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };
  let invoicesService: {
    findOne: ReturnType<typeof vi.fn>;
  };
  let dealsService: {
    updateStatus: ReturnType<typeof vi.fn>;
  };

  const mockUserId = 'user-uuid-1';
  const mockDealId = 'deal-uuid-1';
  const mockInvoiceId = 'invoice-uuid-1';
  const mockPaymentId = 'payment-uuid-1';

  const mockInvoice = {
    id: mockInvoiceId,
    userId: mockUserId,
    dealId: mockDealId,
    invoiceNumber: 'INV-202609-0001',
    issuedDate: '2026-09-16',
    dueDate: '2026-09-30',
    amount: 10000000,
    currency: 'IDR',
    status: InvoiceStatus.SENT,
    pdfUrl: null,
    notes: 'Payment via Bank Transfer',
    createdAt: new Date('2026-09-16T00:00:00Z'),
    updatedAt: new Date('2026-09-16T00:00:00Z'),
    deal: {
      id: mockDealId,
      title: 'Sponsored Reel',
      status: DealStatus.INVOICED,
      brand: { id: 'brand-1', name: 'Brand A' },
    },
  };

  const mockPaymentRecord = {
    id: mockPaymentId,
    invoiceId: mockInvoiceId,
    amount: BigInt(5000000),
    paidAt: new Date('2026-09-17T10:00:00Z'),
    method: 'Bank Transfer BCA',
    note: 'First installment 50%',
    createdAt: new Date('2026-09-17T10:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      payment: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
        aggregate: vi.fn(),
      },
      invoice: {
        update: vi.fn(),
      },
      deal: {
        update: vi.fn(),
      },
      $transaction: vi.fn((callback) => callback(prisma)),
    };

    invoicesService = {
      findOne: vi.fn().mockResolvedValue(mockInvoice),
    };

    dealsService = {
      updateStatus: vi.fn().mockResolvedValue({
        id: mockDealId,
        status: DealStatus.PAID,
      }),
    };

    service = new PaymentsService(
      prisma as unknown as PrismaService,
      invoicesService as unknown as InvoicesService,
      dealsService as unknown as DealsService,
    );
  });

  describe('recordPayment', () => {
    const partialDto: CreatePaymentDto = {
      amount: 4000000,
      paidAt: '2026-09-17T09:00:00.000Z',
      method: 'Bank Transfer BCA',
      note: 'Down payment',
    };

    it('should record partial payment and transition invoice to PARTIALLY_PAID without updating deal to PAID', async () => {
      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: BigInt(0) },
      });
      prisma.payment.findMany.mockResolvedValue([
        {
          id: 'pay-1',
          invoiceId: mockInvoiceId,
          amount: BigInt(4000000),
          paidAt: new Date('2026-09-17T09:00:00.000Z'),
          method: 'Bank Transfer BCA',
          note: 'Down payment',
          createdAt: new Date(),
        },
      ]);
      // findOne returns updated invoice status PARTIALLY_PAID on subsequent reload
      invoicesService.findOne
        .mockResolvedValueOnce(mockInvoice)
        .mockResolvedValueOnce({
          ...mockInvoice,
          status: InvoiceStatus.PARTIALLY_PAID,
        });

      const result = await service.recordPayment(
        mockInvoiceId,
        mockUserId,
        partialDto,
      );

      expect(invoicesService.findOne).toHaveBeenCalledWith(
        mockInvoiceId,
        mockUserId,
      );
      expect(prisma.payment.aggregate).toHaveBeenCalledWith({
        where: { invoiceId: mockInvoiceId },
        _sum: { amount: true },
      });
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: {
          invoiceId: mockInvoiceId,
          amount: BigInt(4000000),
          paidAt: new Date('2026-09-17T09:00:00.000Z'),
          method: 'Bank Transfer BCA',
          note: 'Down payment',
        },
      });
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: mockInvoiceId },
        data: { status: InvoiceStatus.PARTIALLY_PAID },
      });
      expect(dealsService.updateStatus).not.toHaveBeenCalled();

      expect(result.invoiceAmount).toBe(10000000);
      expect(result.totalPaid).toBe(4000000);
      expect(result.remainingBalance).toBe(6000000);
      expect(result.invoiceStatus).toBe(InvoiceStatus.PARTIALLY_PAID);
      expect(result.payments).toHaveLength(1);
    });

    it('should record final payment and transition invoice and deal to PAID', async () => {
      const fullDto: CreatePaymentDto = {
        amount: 6000000,
      };

      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: BigInt(4000000) },
      });
      prisma.payment.findMany.mockResolvedValue([
        {
          id: 'pay-2',
          invoiceId: mockInvoiceId,
          amount: BigInt(6000000),
          paidAt: new Date(),
          method: null,
          note: null,
          createdAt: new Date(),
        },
        {
          id: 'pay-1',
          invoiceId: mockInvoiceId,
          amount: BigInt(4000000),
          paidAt: new Date(),
          method: 'Bank Transfer BCA',
          note: 'Down payment',
          createdAt: new Date(),
        },
      ]);
      invoicesService.findOne
        .mockResolvedValueOnce({
          ...mockInvoice,
          status: InvoiceStatus.PARTIALLY_PAID,
        })
        .mockResolvedValueOnce({
          ...mockInvoice,
          status: InvoiceStatus.PAID,
        });

      const result = await service.recordPayment(
        mockInvoiceId,
        mockUserId,
        fullDto,
      );

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: mockInvoiceId },
        data: { status: InvoiceStatus.PAID },
      });
      expect(dealsService.updateStatus).toHaveBeenCalledWith(
        mockDealId,
        mockUserId,
        DealStatus.PAID,
      );
      expect(result.invoiceStatus).toBe(InvoiceStatus.PAID);
      expect(result.totalPaid).toBe(10000000);
      expect(result.remainingBalance).toBe(0);
    });

    it('should reject payment if amount exceeds remaining balance with PaymentAmountExceededException', async () => {
      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: BigInt(8000000) },
      });

      const overpaymentDto: CreatePaymentDto = {
        amount: 3000000, // Remaining is 2000000
      };

      await expect(
        service.recordPayment(mockInvoiceId, mockUserId, overpaymentDto),
      ).rejects.toThrow(PaymentAmountExceededException);

      expect(prisma.payment.create).not.toHaveBeenCalled();
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });

    it('should reject payment if invoice does not belong to user', async () => {
      invoicesService.findOne.mockRejectedValue(
        new InvoiceNotFoundException('non-existent'),
      );

      await expect(
        service.recordPayment('non-existent', mockUserId, partialDto),
      ).rejects.toThrow(InvoiceNotFoundException);
    });
  });

  describe('findAllByInvoiceId', () => {
    it('should return all payments for invoice with computed summary', async () => {
      prisma.payment.findMany.mockResolvedValue([mockPaymentRecord]);

      const result = await service.findAllByInvoiceId(
        mockInvoiceId,
        mockUserId,
      );

      expect(invoicesService.findOne).toHaveBeenCalledWith(
        mockInvoiceId,
        mockUserId,
      );
      expect(prisma.payment.findMany).toHaveBeenCalledWith({
        where: { invoiceId: mockInvoiceId },
        orderBy: { paidAt: 'desc' },
      });

      expect(result).toEqual({
        payments: [
          {
            id: mockPaymentId,
            invoiceId: mockInvoiceId,
            amount: 5000000,
            paidAt: mockPaymentRecord.paidAt.toISOString(),
            method: 'Bank Transfer BCA',
            note: 'First installment 50%',
            createdAt: mockPaymentRecord.createdAt,
          },
        ],
        invoiceAmount: 10000000,
        totalPaid: 5000000,
        remainingBalance: 5000000,
        invoiceStatus: InvoiceStatus.SENT,
      });
    });
  });

  describe('removePayment', () => {
    it('should delete payment and reset invoice to SENT and revert deal to INVOICED if no payments remain', async () => {
      invoicesService.findOne.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.PAID,
      });

      prisma.payment.findFirst.mockResolvedValue(mockPaymentRecord);
      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });

      const result = await service.removePayment(
        mockInvoiceId,
        mockPaymentId,
        mockUserId,
      );

      expect(prisma.payment.delete).toHaveBeenCalledWith({
        where: { id: mockPaymentId },
      });
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: mockInvoiceId },
        data: { status: InvoiceStatus.SENT },
      });
      expect(prisma.deal.update).toHaveBeenCalledWith({
        where: { id: mockDealId },
        data: { status: DealStatus.INVOICED },
      });
      expect(result).toEqual({ message: 'Payment deleted successfully' });
    });

    it('should delete payment and set invoice to PARTIALLY_PAID if partial payments remain', async () => {
      invoicesService.findOne.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.PAID,
      });

      prisma.payment.findFirst.mockResolvedValue(mockPaymentRecord);
      prisma.payment.aggregate.mockResolvedValue({
        _sum: { amount: BigInt(5000000) },
      });

      const result = await service.removePayment(
        mockInvoiceId,
        mockPaymentId,
        mockUserId,
      );

      expect(prisma.payment.delete).toHaveBeenCalledWith({
        where: { id: mockPaymentId },
      });
      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: mockInvoiceId },
        data: { status: InvoiceStatus.PARTIALLY_PAID },
      });
      expect(prisma.deal.update).toHaveBeenCalledWith({
        where: { id: mockDealId },
        data: { status: DealStatus.INVOICED },
      });
      expect(result).toEqual({ message: 'Payment deleted successfully' });
    });

    it('should throw PaymentNotFoundException if payment not found for invoice', async () => {
      prisma.payment.findFirst.mockResolvedValue(null);

      await expect(
        service.removePayment(mockInvoiceId, 'non-existent', mockUserId),
      ).rejects.toThrow(PaymentNotFoundException);

      expect(prisma.payment.delete).not.toHaveBeenCalled();
    });
  });
});
