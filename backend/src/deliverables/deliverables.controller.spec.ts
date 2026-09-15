import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DeliverableStatus, DeliverableType } from '@prisma/client';
import { DeliverablesController } from './deliverables.controller.js';
import { DeliverablesService } from './deliverables.service.js';
import type { CreateDeliverableDto } from './dto/create-deliverable.dto.js';
import type { UpdateDeliverableDto } from './dto/update-deliverable.dto.js';

describe('DeliverablesController', () => {
  let controller: DeliverablesController;
  let deliverablesService: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  const mockUserId = 'user-uuid-1';
  const mockDealId = 'deal-uuid-1';
  const mockDeliverableId = 'deliverable-uuid-1';

  const mockDeliverable = {
    id: mockDeliverableId,
    dealId: mockDealId,
    type: DeliverableType.TIKTOK,
    description: '1x TikTok Dedicated Video',
    dueDate: '2026-05-01',
    status: DeliverableStatus.PENDING,
    submittedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    deliverablesService = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    controller = new DeliverablesController(
      deliverablesService as unknown as DeliverablesService,
    );
  });

  describe('create', () => {
    it('should delegate deliverable creation to DeliverablesService', async () => {
      const dto: CreateDeliverableDto = {
        type: DeliverableType.TIKTOK,
        description: '1x TikTok Dedicated Video',
        dueDate: '2026-05-01',
      };
      deliverablesService.create.mockResolvedValue(mockDeliverable);

      const result = await controller.create(mockUserId, mockDealId, dto);

      expect(deliverablesService.create).toHaveBeenCalledWith(
        mockUserId,
        mockDealId,
        dto,
      );
      expect(result).toEqual(mockDeliverable);
    });
  });

  describe('findAll', () => {
    it('should delegate fetching all deliverables to DeliverablesService', async () => {
      deliverablesService.findAll.mockResolvedValue([mockDeliverable]);

      const result = await controller.findAll(mockUserId, mockDealId);

      expect(deliverablesService.findAll).toHaveBeenCalledWith(
        mockUserId,
        mockDealId,
      );
      expect(result).toEqual([mockDeliverable]);
    });
  });

  describe('findOne', () => {
    it('should delegate fetching single deliverable to DeliverablesService', async () => {
      deliverablesService.findOne.mockResolvedValue(mockDeliverable);

      const result = await controller.findOne(
        mockUserId,
        mockDealId,
        mockDeliverableId,
      );

      expect(deliverablesService.findOne).toHaveBeenCalledWith(
        mockUserId,
        mockDealId,
        mockDeliverableId,
      );
      expect(result).toEqual(mockDeliverable);
    });
  });

  describe('update', () => {
    it('should delegate update to DeliverablesService', async () => {
      const dto: UpdateDeliverableDto = {
        status: DeliverableStatus.SUBMITTED,
      };
      const updated = {
        ...mockDeliverable,
        status: DeliverableStatus.SUBMITTED,
        submittedAt: new Date(),
      };
      deliverablesService.update.mockResolvedValue(updated);

      const result = await controller.update(
        mockUserId,
        mockDealId,
        mockDeliverableId,
        dto,
      );

      expect(deliverablesService.update).toHaveBeenCalledWith(
        mockUserId,
        mockDealId,
        mockDeliverableId,
        dto,
      );
      expect(result).toEqual(updated);
    });
  });

  describe('remove', () => {
    it('should delegate removal to DeliverablesService', async () => {
      deliverablesService.remove.mockResolvedValue({
        message: 'Deliverable deleted successfully',
      });

      const result = await controller.remove(
        mockUserId,
        mockDealId,
        mockDeliverableId,
      );

      expect(deliverablesService.remove).toHaveBeenCalledWith(
        mockUserId,
        mockDealId,
        mockDeliverableId,
      );
      expect(result).toEqual({ message: 'Deliverable deleted successfully' });
    });
  });
});
