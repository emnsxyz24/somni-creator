import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DealSource, DealStatus } from '@prisma/client';
import { DealsController } from './deals.controller.js';
import { DealsService } from './deals.service.js';

describe('DealsController', () => {
  let controller: DealsController;
  let dealsService: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  const mockUserId = 'user-uuid-1';
  const mockDealId = 'deal-uuid-1';
  const mockDeal = {
    id: mockDealId,
    userId: mockUserId,
    brandId: 'brand-uuid-1',
    title: 'Sponsorship Deal',
    status: DealStatus.LEAD,
    valueAmount: 15000000,
    valueCurrency: 'IDR',
    source: DealSource.MANUAL,
    notes: 'Notes here',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    allowedNextStatuses: [DealStatus.NEGOTIATING, DealStatus.LOST, DealStatus.CANCELLED],
  };

  beforeEach(() => {
    dealsService = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      updateStatus: vi.fn(),
      remove: vi.fn(),
    };

    controller = new DealsController(dealsService as unknown as DealsService);
  });

  describe('create', () => {
    it('should delegate deal creation to DealsService', async () => {
      const dto = {
        brandId: 'brand-uuid-1',
        title: 'Sponsorship Deal',
        valueAmount: 15000000,
      };
      dealsService.create.mockResolvedValue(mockDeal);

      const result = await controller.create(mockUserId, dto);

      expect(dealsService.create).toHaveBeenCalledWith(mockUserId, dto);
      expect(result).toEqual(mockDeal);
    });
  });

  describe('findAll', () => {
    it('should delegate retrieving deals with optional filters to DealsService', async () => {
      const list = [mockDeal];
      dealsService.findAll.mockResolvedValue(list);

      const result = await controller.findAll(
        mockUserId,
        DealStatus.LEAD,
        'brand-uuid-1',
      );

      expect(dealsService.findAll).toHaveBeenCalledWith(mockUserId, {
        status: DealStatus.LEAD,
        brandId: 'brand-uuid-1',
      });
      expect(result).toEqual(list);
    });
  });

  describe('findOne', () => {
    it('should delegate retrieving a single deal to DealsService', async () => {
      dealsService.findOne.mockResolvedValue(mockDeal);

      const result = await controller.findOne(mockDealId, mockUserId);

      expect(dealsService.findOne).toHaveBeenCalledWith(mockDealId, mockUserId);
      expect(result).toEqual(mockDeal);
    });
  });

  describe('update', () => {
    it('should delegate deal update to DealsService', async () => {
      const updateDto = { title: 'Updated Deal' };
      const updated = { ...mockDeal, title: 'Updated Deal' };
      dealsService.update.mockResolvedValue(updated);

      const result = await controller.update(mockDealId, mockUserId, updateDto);

      expect(dealsService.update).toHaveBeenCalledWith(
        mockDealId,
        mockUserId,
        updateDto,
      );
      expect(result).toEqual(updated);
    });
  });

  describe('updateStatus', () => {
    it('should delegate status update to DealsService', async () => {
      const updated = { ...mockDeal, status: DealStatus.NEGOTIATING };
      dealsService.updateStatus.mockResolvedValue(updated);

      const result = await controller.updateStatus(mockDealId, mockUserId, {
        status: DealStatus.NEGOTIATING,
      });

      expect(dealsService.updateStatus).toHaveBeenCalledWith(
        mockDealId,
        mockUserId,
        DealStatus.NEGOTIATING,
      );
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should delegate deal removal to DealsService', async () => {
      const response = { message: 'Deal deleted successfully' };
      dealsService.remove.mockResolvedValue(response);

      const result = await controller.remove(mockDealId, mockUserId);

      expect(dealsService.remove).toHaveBeenCalledWith(mockDealId, mockUserId);
      expect(result).toEqual(response);
    });
  });
});
