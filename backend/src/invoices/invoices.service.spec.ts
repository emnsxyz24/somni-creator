import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { DealStatus, InvoiceStatus } from '@prisma/client';
import { InvoicesService } from './invoices.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DealsService } from '../deals/deals.service.js';
import { InvoiceNotFoundException } from './exceptions/invoice-not-found.exception.js';
import { InvoiceConflictException } from './exceptions/invoice-conflict.exception.js';
import { InvalidInvoiceStatusException } from './exceptions/invalid-invoice-status.exception.js';
import type { CreateInvoiceDto } from './dto/create-invoice.dto.js';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let prisma: {
    invoice: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    invoiceSequence: {
      upsert: ReturnType<typeof vi.fn>;
    };
  };
  let dealsService: {
    findOne: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  };

  const mockUserId = 'user-uuid-1';
  const otherUserId = 'user-uuid-2';
  const mockDealId = 'deal-uuid-1';
  const mockInvoiceId = 'invoice-uuid-1';

  const mockDeal = {
    id: mockDealId,
    userId: mockUserId,
    brandId: 'brand-uuid-1',
    title: 'Brand Sponsorship Q2',
    status: DealStatus.DELIVERED,
    valueAmount: 15000000,
    valueCurrency: 'IDR',
    allowedNextStatuses: [DealStatus.INVOICED],
    brand: {
      id: 'brand-uuid-1',
      name: 'Acme Corp',
      contactName: 'Alice',
      contactEmail: 'alice@acme.com',
    },
  };

  const mockInvoice = {
    id: mockInvoiceId,
    userId: mockUserId,
    dealId: mockDealId,
    invoiceNumber: 'INV-202609-0001',
    issuedDate: new Date('2026-09-16T00:00:00Z'),
    dueDate: new Date('2026-09-30T00:00:00Z'),
    amount: BigInt(15000000),
    currency: 'IDR',
    status: InvoiceStatus.DRAFT,
    pdfUrl: null,
    notes: 'Payment via BCA Transfer',
    createdAt: new Date('2026-09-16T00:00:00Z'),
    updatedAt: new Date('2026-09-16T00:00:00Z'),
    deletedAt: null,
    deal: mockDeal,
  };

  beforeEach(() => {
    prisma = {
      invoice: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      invoiceSequence: {
        upsert: vi.fn(),
      },
    };

    dealsService = {
      findOne: vi.fn().mockResolvedValue(mockDeal),
      updateStatus: vi.fn().mockResolvedValue({
        ...mockDeal,
        status: DealStatus.INVOICED,
      }),
    };

    service = new InvoicesService(
      prisma as unknown as PrismaService,
      dealsService as unknown as DealsService,
    );
  });

  describe('generateInvoiceNumber', () => {
    it('should generate atomic monthly padded invoice number', async () => {
      prisma.invoiceSequence.upsert.mockResolvedValue({
        id: 'seq-1',
        userId: mockUserId,
        period: '202609',
        lastNumber: 7,
        updatedAt: new Date(),
      });

      const number = await service.generateInvoiceNumber(
        mockUserId,
        new Date('2026-09-16T12:00:00Z'),
      );

      expect(number).toBe('INV-202609-0007');
      expect(prisma.invoiceSequence.upsert).toHaveBeenCalledWith({
        where: {
          userId_period: {
            userId: mockUserId,
            period: '202609',
          },
        },
        update: {
          lastNumber: {
            increment: 1,
          },
        },
        create: {
          userId: mockUserId,
          period: '202609',
          lastNumber: 1,
        },
      });
    });
  });

  describe('create', () => {
    const createDto: CreateInvoiceDto = {
      dealId: mockDealId,
      dueDate: '2026-09-30',
      issuedDate: '2026-09-16',
      notes: 'Payment via BCA Transfer',
    };

    it('should create an invoice and sync deal status from DELIVERED to INVOICED', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);
      prisma.invoiceSequence.upsert.mockResolvedValue({
        id: 'seq-1',
        userId: mockUserId,
        period: '202609',
        lastNumber: 1,
        updatedAt: new Date(),
      });
      prisma.invoice.create.mockResolvedValue(mockInvoice);

      const result = await service.create(mockUserId, createDto);

      expect(dealsService.findOne).toHaveBeenCalledWith(mockDealId, mockUserId);
      expect(prisma.invoice.findFirst).toHaveBeenCalledWith({
        where: { dealId: mockDealId, deletedAt: null },
      });
      expect(prisma.invoice.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          dealId: mockDealId,
          invoiceNumber: 'INV-202609-0001',
          issuedDate: new Date('2026-09-16'),
          dueDate: new Date('2026-09-30'),
          amount: BigInt(15000000),
          currency: 'IDR',
          status: InvoiceStatus.DRAFT,
          notes: 'Payment via BCA Transfer',
        },
        include: {
          deal: {
            include: {
              brand: true,
            },
          },
        },
      });
      expect(dealsService.updateStatus).toHaveBeenCalledWith(
        mockDealId,
        mockUserId,
        DealStatus.INVOICED,
      );
      expect(result.amount).toBe(15000000);
      expect(result.invoiceNumber).toBe('INV-202609-0001');
      expect(result.issuedDate).toBe('2026-09-16');
      expect(result.dueDate).toBe('2026-09-30');
    });

    it('should not update deal status if deal status is not DELIVERED', async () => {
      dealsService.findOne.mockResolvedValue({
        ...mockDeal,
        status: DealStatus.IN_PROGRESS,
      });
      prisma.invoice.findFirst.mockResolvedValue(null);
      prisma.invoiceSequence.upsert.mockResolvedValue({
        id: 'seq-1',
        userId: mockUserId,
        period: '202609',
        lastNumber: 1,
        updatedAt: new Date(),
      });
      prisma.invoice.create.mockResolvedValue(mockInvoice);

      await service.create(mockUserId, createDto);

      expect(dealsService.updateStatus).not.toHaveBeenCalled();
    });

    it('should throw InvoiceConflictException if invoice already exists for deal', async () => {
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);

      await expect(service.create(mockUserId, createDto)).rejects.toThrow(
        InvoiceConflictException,
      );
      expect(prisma.invoice.create).not.toHaveBeenCalled();
    });

    it('should throw if deal does not belong to user', async () => {
      dealsService.findOne.mockRejectedValue(
        new ForbiddenException('You do not have permission to access this deal'),
      );

      await expect(service.create(otherUserId, createDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all invoices for the authenticated user', async () => {
      prisma.invoice.findMany.mockResolvedValue([mockInvoice]);

      const result = await service.findAll(mockUserId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockInvoiceId);
      expect(prisma.invoice.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          deletedAt: null,
        },
        include: {
          deal: {
            include: {
              brand: true,
            },
          },
        },
        orderBy: {
          issuedDate: 'desc',
        },
      });
    });

    it('should filter by status and dealId when provided', async () => {
      prisma.invoice.findMany.mockResolvedValue([mockInvoice]);

      await service.findAll(mockUserId, {
        status: InvoiceStatus.DRAFT,
        dealId: mockDealId,
      });

      expect(prisma.invoice.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          deletedAt: null,
          status: InvoiceStatus.DRAFT,
          dealId: mockDealId,
        },
        include: {
          deal: {
            include: {
              brand: true,
            },
          },
        },
        orderBy: {
          issuedDate: 'desc',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return invoice when found and owned by user', async () => {
      prisma.invoice.findUnique.mockResolvedValue(mockInvoice);

      const result = await service.findOne(mockInvoiceId, mockUserId);

      expect(result.id).toBe(mockInvoiceId);
      expect(result.amount).toBe(15000000);
    });

    it('should throw InvoiceNotFoundException if invoice not found', async () => {
      prisma.invoice.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent', mockUserId),
      ).rejects.toThrow(InvoiceNotFoundException);
    });

    it('should throw InvoiceNotFoundException if invoice is soft-deleted', async () => {
      prisma.invoice.findUnique.mockResolvedValue({
        ...mockInvoice,
        deletedAt: new Date(),
      });

      await expect(
        service.findOne(mockInvoiceId, mockUserId),
      ).rejects.toThrow(InvoiceNotFoundException);
    });

    it('should throw ForbiddenException if invoice belongs to another user', async () => {
      prisma.invoice.findUnique.mockResolvedValue(mockInvoice);

      await expect(
        service.findOne(mockInvoiceId, otherUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findByDealId', () => {
    it('should return invoice belonging to deal', async () => {
      prisma.invoice.findFirst.mockResolvedValue(mockInvoice);

      const result = await service.findByDealId(mockDealId, mockUserId);

      expect(dealsService.findOne).toHaveBeenCalledWith(mockDealId, mockUserId);
      expect(result.dealId).toBe(mockDealId);
    });

    it('should throw InvoiceNotFoundException if no invoice exists for deal', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);

      await expect(
        service.findByDealId(mockDealId, mockUserId),
      ).rejects.toThrow(InvoiceNotFoundException);
    });
  });

  describe('update', () => {
    it('should update allowed fields (dueDate, status to SENT, notes, pdfUrl)', async () => {
      prisma.invoice.findUnique.mockResolvedValue(mockInvoice);
      prisma.invoice.update.mockResolvedValue({
        ...mockInvoice,
        status: InvoiceStatus.SENT,
        notes: 'Updated terms',
      });

      const result = await service.update(mockInvoiceId, mockUserId, {
        status: InvoiceStatus.SENT,
        notes: 'Updated terms',
      });

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: mockInvoiceId },
        data: {
          status: InvoiceStatus.SENT,
          notes: 'Updated terms',
        },
        include: {
          deal: {
            include: {
              brand: true,
            },
          },
        },
      });
      expect(result.status).toBe(InvoiceStatus.SENT);
    });

    it('should reject status change to PAID via PATCH (guarded for C4 payments)', async () => {
      prisma.invoice.findUnique.mockResolvedValue(mockInvoice);

      await expect(
        service.update(mockInvoiceId, mockUserId, {
          status: InvoiceStatus.PAID as unknown as InvoiceStatus.SENT,
        }),
      ).rejects.toThrow(InvalidInvoiceStatusException);
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });

    it('should reject status change to PARTIALLY_PAID via PATCH (guarded for C4 payments)', async () => {
      prisma.invoice.findUnique.mockResolvedValue(mockInvoice);

      await expect(
        service.update(mockInvoiceId, mockUserId, {
          status: InvoiceStatus.PARTIALLY_PAID as unknown as InvoiceStatus.SENT,
        }),
      ).rejects.toThrow(InvalidInvoiceStatusException);
      expect(prisma.invoice.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft-delete invoice by populating deletedAt', async () => {
      prisma.invoice.findUnique.mockResolvedValue(mockInvoice);
      prisma.invoice.update.mockResolvedValue({
        ...mockInvoice,
        deletedAt: new Date(),
      });

      const result = await service.remove(mockInvoiceId, mockUserId);

      expect(prisma.invoice.update).toHaveBeenCalledWith({
        where: { id: mockInvoiceId },
        data: {
          deletedAt: expect.any(Date),
        },
      });
      expect(result).toEqual({ message: 'Invoice deleted successfully' });
    });
  });
});
