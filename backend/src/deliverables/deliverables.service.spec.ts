import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException } from '@nestjs/common';
import { DeliverableStatus, DeliverableType } from '@prisma/client';
import { DeliverablesService } from './deliverables.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { DealsService } from '../deals/deals.service.js';
import { DealNotFoundException } from '../deals/exceptions/deal-not-found.exception.js';
import { DeliverableNotFoundException } from './exceptions/deliverable-not-found.exception.js';
import type { CreateDeliverableDto } from './dto/create-deliverable.dto.js';
import type { UpdateDeliverableDto } from './dto/update-deliverable.dto.js';

describe('DeliverablesService', () => {
  let service: DeliverablesService;
  let prisma: {
    deliverable: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
  };
  let dealsService: {
    findOne: ReturnType<typeof vi.fn>;
  };

  const mockUserId = 'user-uuid-1';
  const otherUserId = 'user-uuid-2';
  const mockDealId = 'deal-uuid-1';
  const mockDeliverableId = 'deliverable-uuid-1';

  const mockDeliverable = {
    id: mockDeliverableId,
    dealId: mockDealId,
    type: DeliverableType.YOUTUBE_VIDEO,
    description: '60s dedicated integration video',
    dueDate: new Date('2026-04-15T00:00:00Z'),
    status: DeliverableStatus.PENDING,
    submittedAt: null,
    createdAt: new Date('2026-03-01T00:00:00Z'),
    updatedAt: new Date('2026-03-01T00:00:00Z'),
  };

  beforeEach(() => {
    prisma = {
      deliverable: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    };

    dealsService = {
      findOne: vi.fn().mockResolvedValue({
        id: mockDealId,
        userId: mockUserId,
        title: 'Mock Deal',
      }),
    };

    service = new DeliverablesService(
      prisma as unknown as PrismaService,
      dealsService as unknown as DealsService,
    );
  });

  describe('create', () => {
    const createDto: CreateDeliverableDto = {
      type: DeliverableType.YOUTUBE_VIDEO,
      description: '60s dedicated integration video',
      dueDate: '2026-04-15',
      status: DeliverableStatus.PENDING,
    };

    it('should create a deliverable successfully when user owns the deal', () => {
      prisma.deliverable.create.mockResolvedValue(mockDeliverable);

      return expect(
        service.create(mockUserId, mockDealId, createDto),
      ).resolves.toEqual({
        id: mockDeliverableId,
        dealId: mockDealId,
        type: DeliverableType.YOUTUBE_VIDEO,
        description: '60s dedicated integration video',
        dueDate: '2026-04-15',
        status: DeliverableStatus.PENDING,
        submittedAt: null,
        createdAt: mockDeliverable.createdAt,
        updatedAt: mockDeliverable.updatedAt,
      });
    });

    it('should set submittedAt timestamp if created with SUBMITTED status', async () => {
      const submittedDeliverable = {
        ...mockDeliverable,
        status: DeliverableStatus.SUBMITTED,
        submittedAt: new Date(),
      };
      prisma.deliverable.create.mockResolvedValue(submittedDeliverable);

      const result = await service.create(mockUserId, mockDealId, {
        ...createDto,
        status: DeliverableStatus.SUBMITTED,
      });

      expect(result.status).toBe(DeliverableStatus.SUBMITTED);
      expect(result.submittedAt).toBeInstanceOf(Date);
      expect(prisma.deliverable.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            submittedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should throw DealNotFoundException if deal does not exist', async () => {
      dealsService.findOne.mockRejectedValue(new DealNotFoundException());

      await expect(
        service.create(mockUserId, 'non-existent-deal', createDto),
      ).rejects.toThrow(DealNotFoundException);
      expect(prisma.deliverable.create).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if deal belongs to another user', async () => {
      dealsService.findOne.mockRejectedValue(
        new ForbiddenException('You do not have permission to access this deal'),
      );

      await expect(
        service.create(otherUserId, mockDealId, createDto),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.deliverable.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all deliverables for the deal ordered by dueDate ASC', async () => {
      prisma.deliverable.findMany.mockResolvedValue([mockDeliverable]);

      const result = await service.findAll(mockUserId, mockDealId);

      expect(dealsService.findOne).toHaveBeenCalledWith(mockDealId, mockUserId);
      expect(prisma.deliverable.findMany).toHaveBeenCalledWith({
        where: { dealId: mockDealId },
        orderBy: { dueDate: 'asc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(mockDeliverableId);
      expect(result[0].dueDate).toBe('2026-04-15');
    });

    it('should throw ForbiddenException if user does not own the deal', async () => {
      dealsService.findOne.mockRejectedValue(
        new ForbiddenException('You do not have permission to access this deal'),
      );

      await expect(service.findAll(otherUserId, mockDealId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findOne', () => {
    it('should return deliverable if found and owned', async () => {
      prisma.deliverable.findFirst.mockResolvedValue(mockDeliverable);

      const result = await service.findOne(mockUserId, mockDealId, mockDeliverableId);

      expect(dealsService.findOne).toHaveBeenCalledWith(mockDealId, mockUserId);
      expect(result.id).toBe(mockDeliverableId);
    });

    it('should throw DeliverableNotFoundException if deliverable does not exist', async () => {
      prisma.deliverable.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne(mockUserId, mockDealId, 'non-existent-id'),
      ).rejects.toThrow(DeliverableNotFoundException);
    });
  });

  describe('update', () => {
    const updateDto: UpdateDeliverableDto = {
      description: 'Updated description',
    };

    it('should update deliverable fields', async () => {
      prisma.deliverable.findFirst.mockResolvedValue(mockDeliverable);
      prisma.deliverable.update.mockResolvedValue({
        ...mockDeliverable,
        description: 'Updated description',
      });

      const result = await service.update(
        mockUserId,
        mockDealId,
        mockDeliverableId,
        updateDto,
      );

      expect(result.description).toBe('Updated description');
      expect(prisma.deliverable.update).toHaveBeenCalledWith({
        where: { id: mockDeliverableId },
        data: expect.objectContaining({
          description: 'Updated description',
        }),
      });
    });

    it('should set submittedAt when transitioning to SUBMITTED', async () => {
      prisma.deliverable.findFirst.mockResolvedValue(mockDeliverable);
      const submittedDate = new Date();
      prisma.deliverable.update.mockResolvedValue({
        ...mockDeliverable,
        status: DeliverableStatus.SUBMITTED,
        submittedAt: submittedDate,
      });

      const result = await service.update(
        mockUserId,
        mockDealId,
        mockDeliverableId,
        { status: DeliverableStatus.SUBMITTED },
      );

      expect(result.status).toBe(DeliverableStatus.SUBMITTED);
      expect(prisma.deliverable.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: DeliverableStatus.SUBMITTED,
            submittedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should clear submittedAt when reverting to PENDING', async () => {
      const previouslySubmitted = {
        ...mockDeliverable,
        status: DeliverableStatus.SUBMITTED,
        submittedAt: new Date(),
      };
      prisma.deliverable.findFirst.mockResolvedValue(previouslySubmitted);
      prisma.deliverable.update.mockResolvedValue({
        ...previouslySubmitted,
        status: DeliverableStatus.PENDING,
        submittedAt: null,
      });

      const result = await service.update(
        mockUserId,
        mockDealId,
        mockDeliverableId,
        { status: DeliverableStatus.PENDING },
      );

      expect(result.status).toBe(DeliverableStatus.PENDING);
      expect(prisma.deliverable.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: DeliverableStatus.PENDING,
            submittedAt: null,
          }),
        }),
      );
    });

    it('should throw DeliverableNotFoundException if deliverable does not exist for the deal', async () => {
      prisma.deliverable.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockUserId, mockDealId, 'unknown-id', updateDto),
      ).rejects.toThrow(DeliverableNotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete deliverable and return confirmation message', async () => {
      prisma.deliverable.findFirst.mockResolvedValue(mockDeliverable);
      prisma.deliverable.delete.mockResolvedValue(mockDeliverable);

      const result = await service.remove(mockUserId, mockDealId, mockDeliverableId);

      expect(prisma.deliverable.delete).toHaveBeenCalledWith({
        where: { id: mockDeliverableId },
      });
      expect(result).toEqual({ message: 'Deliverable deleted successfully' });
    });

    it('should throw DeliverableNotFoundException if deliverable does not exist', async () => {
      prisma.deliverable.findFirst.mockResolvedValue(null);

      await expect(
        service.remove(mockUserId, mockDealId, 'unknown-id'),
      ).rejects.toThrow(DeliverableNotFoundException);
      expect(prisma.deliverable.delete).not.toHaveBeenCalled();
    });
  });
});
