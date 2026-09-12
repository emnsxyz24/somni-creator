import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { DealSource, DealStatus } from '@prisma/client';
import { DealsService } from './deals.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { BrandsService } from '../brands/brands.service.js';
import { DealStatusService } from './deal-status.service.js';
import { DealNotFoundException } from './exceptions/deal-not-found.exception.js';
import { InvalidStatusTransitionException } from './exceptions/invalid-status-transition.exception.js';

describe('DealsService', () => {
  let service: DealsService;
  let prisma: {
    deal: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let brandsService: {
    findOne: ReturnType<typeof vi.fn>;
  };
  let dealStatusService: DealStatusService;

  const mockUserId = 'user-uuid-1';
  const otherUserId = 'user-uuid-2';
  const mockBrandId = 'brand-uuid-1';
  const mockDealId = 'deal-uuid-1';

  const mockPrismaDeal = {
    id: mockDealId,
    userId: mockUserId,
    brandId: mockBrandId,
    title: 'YouTube Sponsorship',
    status: DealStatus.LEAD,
    valueAmount: BigInt(25000000),
    valueCurrency: 'IDR',
    source: DealSource.MANUAL,
    notes: 'Q3 integrated sponsor',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
    brand: {
      id: mockBrandId,
      name: 'Spotify',
      contactName: 'Sarah',
      contactEmail: 'sarah@spotify.com',
    },
  };

  beforeEach(() => {
    prisma = {
      deal: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    brandsService = {
      findOne: vi.fn(),
    };

    dealStatusService = new DealStatusService();

    service = new DealsService(
      prisma as unknown as PrismaService,
      brandsService as unknown as BrandsService,
      dealStatusService,
    );
  });

  describe('create', () => {
    it('should verify brand ownership and create a deal with BigInt value mapped to number', async () => {
      brandsService.findOne.mockResolvedValue({ id: mockBrandId, userId: mockUserId });
      prisma.deal.create.mockResolvedValue(mockPrismaDeal);

      const result = await service.create(mockUserId, {
        brandId: mockBrandId,
        title: 'YouTube Sponsorship',
        valueAmount: 25000000,
        valueCurrency: 'IDR',
        source: DealSource.MANUAL,
        notes: 'Q3 integrated sponsor',
      });

      expect(brandsService.findOne).toHaveBeenCalledWith(mockBrandId, mockUserId);
      expect(prisma.deal.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          brandId: mockBrandId,
          title: 'YouTube Sponsorship',
          valueAmount: BigInt(25000000),
          valueCurrency: 'IDR',
          source: DealSource.MANUAL,
          status: DealStatus.LEAD,
          notes: 'Q3 integrated sponsor',
        },
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              contactName: true,
              contactEmail: true,
            },
          },
        },
      });
      expect(result.valueAmount).toBe(25000000);
      expect(result.allowedNextStatuses).toEqual([
        DealStatus.NEGOTIATING,
        DealStatus.LOST,
        DealStatus.CANCELLED,
      ]);
    });

    it('should throw if brand does not exist or is not owned by user', async () => {
      brandsService.findOne.mockRejectedValue(new NotFoundException('Brand not found'));

      await expect(
        service.create(mockUserId, {
          brandId: 'foreign-brand',
          title: 'YouTube Sponsorship',
          valueAmount: 1000,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return active deals filtered by userId and convert BigInt values', async () => {
      prisma.deal.findMany.mockResolvedValue([mockPrismaDeal]);

      const result = await service.findAll(mockUserId);

      expect(prisma.deal.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          deletedAt: null,
        },
        include: {
          brand: {
            select: {
              id: true,
              name: true,
              contactName: true,
              contactEmail: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toHaveLength(1);
      expect(result[0].valueAmount).toBe(25000000);
      expect(result[0].allowedNextStatuses).toContain(DealStatus.NEGOTIATING);
    });

    it('should support filtering by status and brandId', async () => {
      prisma.deal.findMany.mockResolvedValue([]);

      await service.findAll(mockUserId, {
        status: DealStatus.IN_PROGRESS,
        brandId: mockBrandId,
      });

      expect(prisma.deal.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          deletedAt: null,
          status: DealStatus.IN_PROGRESS,
          brandId: mockBrandId,
        },
        include: expect.any(Object),
        orderBy: {
          createdAt: 'desc',
        },
      });
    });
  });

  describe('findOne', () => {
    it('should return deal when found and owned by user', async () => {
      prisma.deal.findUnique.mockResolvedValue(mockPrismaDeal);

      const result = await service.findOne(mockDealId, mockUserId);

      expect(result.id).toBe(mockDealId);
      expect(result.valueAmount).toBe(25000000);
    });

    it('should throw DealNotFoundException if deal does not exist', async () => {
      prisma.deal.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing-id', mockUserId)).rejects.toThrow(
        DealNotFoundException,
      );
    });

    it('should throw DealNotFoundException if deal has been soft-deleted', async () => {
      prisma.deal.findUnique.mockResolvedValue({
        ...mockPrismaDeal,
        deletedAt: new Date(),
      });

      await expect(service.findOne(mockDealId, mockUserId)).rejects.toThrow(
        DealNotFoundException,
      );
    });

    it('should throw ForbiddenException if deal belongs to another user', async () => {
      prisma.deal.findUnique.mockResolvedValue(mockPrismaDeal);

      await expect(service.findOne(mockDealId, otherUserId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('update', () => {
    it('should update deal attributes and return mapped response', async () => {
      prisma.deal.findUnique.mockResolvedValue(mockPrismaDeal);
      prisma.deal.update.mockResolvedValue({
        ...mockPrismaDeal,
        title: 'Updated Title',
        valueAmount: BigInt(30000000),
      });

      const result = await service.update(mockDealId, mockUserId, {
        title: 'Updated Title',
        valueAmount: 30000000,
      });

      expect(prisma.deal.update).toHaveBeenCalledWith({
        where: { id: mockDealId },
        data: {
          title: 'Updated Title',
          valueAmount: BigInt(30000000),
        },
        include: expect.any(Object),
      });
      expect(result.title).toBe('Updated Title');
      expect(result.valueAmount).toBe(30000000);
    });

    it('should verify brand ownership if brandId is modified', async () => {
      prisma.deal.findUnique.mockResolvedValue(mockPrismaDeal);
      brandsService.findOne.mockResolvedValue({ id: 'new-brand-id', userId: mockUserId });
      prisma.deal.update.mockResolvedValue({
        ...mockPrismaDeal,
        brandId: 'new-brand-id',
      });

      await service.update(mockDealId, mockUserId, {
        brandId: 'new-brand-id',
      });

      expect(brandsService.findOne).toHaveBeenCalledWith('new-brand-id', mockUserId);
    });

    it('should validate status transition if status is updated', async () => {
      prisma.deal.findUnique.mockResolvedValue(mockPrismaDeal);
      prisma.deal.update.mockResolvedValue({
        ...mockPrismaDeal,
        status: DealStatus.NEGOTIATING,
      });

      const result = await service.update(mockDealId, mockUserId, {
        status: DealStatus.NEGOTIATING,
      });

      expect(result.status).toBe(DealStatus.NEGOTIATING);
    });

    it('should throw InvalidStatusTransitionException on invalid status update', async () => {
      prisma.deal.findUnique.mockResolvedValue(mockPrismaDeal);

      await expect(
        service.update(mockDealId, mockUserId, {
          status: DealStatus.PAID,
        }),
      ).rejects.toThrow(InvalidStatusTransitionException);
    });
  });

  describe('updateStatus', () => {
    it('should update status when transition is valid', async () => {
      prisma.deal.findUnique.mockResolvedValue(mockPrismaDeal);
      prisma.deal.update.mockResolvedValue({
        ...mockPrismaDeal,
        status: DealStatus.NEGOTIATING,
      });

      const result = await service.updateStatus(
        mockDealId,
        mockUserId,
        DealStatus.NEGOTIATING,
      );

      expect(prisma.deal.update).toHaveBeenCalledWith({
        where: { id: mockDealId },
        data: { status: DealStatus.NEGOTIATING },
        include: expect.any(Object),
      });
      expect(result.status).toBe(DealStatus.NEGOTIATING);
    });

    it('should throw InvalidStatusTransitionException on invalid transition', async () => {
      prisma.deal.findUnique.mockResolvedValue(mockPrismaDeal);

      await expect(
        service.updateStatus(mockDealId, mockUserId, DealStatus.PAID),
      ).rejects.toThrow(InvalidStatusTransitionException);
    });
  });

  describe('remove', () => {
    it('should soft delete the deal by setting deletedAt', async () => {
      prisma.deal.findUnique.mockResolvedValue(mockPrismaDeal);
      prisma.deal.update.mockResolvedValue({
        ...mockPrismaDeal,
        deletedAt: new Date(),
      });

      const result = await service.remove(mockDealId, mockUserId);

      expect(prisma.deal.update).toHaveBeenCalledWith({
        where: { id: mockDealId },
        data: { deletedAt: expect.any(Date) },
      });
      expect(result).toEqual({ message: 'Deal deleted successfully' });
    });
  });
});
