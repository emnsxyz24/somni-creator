import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { BrandsService } from './brands.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('BrandsService', () => {
  let service: BrandsService;
  let prisma: {
    brand: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  const mockUserId = 'user-uuid-1';
  const otherUserId = 'user-uuid-2';
  const mockBrand = {
    id: 'brand-uuid-1',
    userId: mockUserId,
    name: 'Acme Corp',
    contactName: 'Alice',
    contactEmail: 'alice@acme.com',
    notes: 'Key brand partner',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    deletedAt: null,
  };

  beforeEach(() => {
    prisma = {
      brand: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    };

    service = new BrandsService(prisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('should create a brand scoped to the authenticated user', async () => {
      const createDto = {
        name: 'Acme Corp',
        contactName: 'Alice',
        contactEmail: 'alice@acme.com',
        notes: 'Key brand partner',
      };

      prisma.brand.create.mockResolvedValue(mockBrand);

      const result = await service.create(mockUserId, createDto);

      expect(prisma.brand.create).toHaveBeenCalledWith({
        data: {
          userId: mockUserId,
          ...createDto,
        },
      });
      expect(result).toEqual(mockBrand);
    });
  });

  describe('findAll', () => {
    it('should retrieve non-deleted brands for the authenticated user ordered by createdAt desc', async () => {
      const mockList = [mockBrand];
      prisma.brand.findMany.mockResolvedValue(mockList);

      const result = await service.findAll(mockUserId);

      expect(prisma.brand.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          deletedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expect(result).toEqual(mockList);
    });
  });

  describe('findOne', () => {
    it('should return the brand if found and owned by the user', async () => {
      prisma.brand.findUnique.mockResolvedValue(mockBrand);

      const result = await service.findOne('brand-uuid-1', mockUserId);

      expect(prisma.brand.findUnique).toHaveBeenCalledWith({
        where: { id: 'brand-uuid-1' },
      });
      expect(result).toEqual(mockBrand);
    });

    it('should throw NotFoundException if brand does not exist', async () => {
      prisma.brand.findUnique.mockResolvedValue(null);

      await expect(
        service.findOne('non-existent-id', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if brand has been soft-deleted', async () => {
      prisma.brand.findUnique.mockResolvedValue({
        ...mockBrand,
        deletedAt: new Date(),
      });

      await expect(
        service.findOne('brand-uuid-1', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if brand belongs to another user', async () => {
      prisma.brand.findUnique.mockResolvedValue(mockBrand);

      await expect(
        service.findOne('brand-uuid-1', otherUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('update', () => {
    it('should update the brand when owned by user', async () => {
      const updateDto = { name: 'Acme Updated' };
      const updatedBrand = { ...mockBrand, name: 'Acme Updated' };

      prisma.brand.findUnique.mockResolvedValue(mockBrand);
      prisma.brand.update.mockResolvedValue(updatedBrand);

      const result = await service.update(
        'brand-uuid-1',
        mockUserId,
        updateDto,
      );

      expect(prisma.brand.update).toHaveBeenCalledWith({
        where: { id: 'brand-uuid-1' },
        data: {
          name: 'Acme Updated',
        },
      });
      expect(result).toEqual(updatedBrand);
    });

    it('should throw NotFoundException if brand to update does not exist', async () => {
      prisma.brand.findUnique.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', mockUserId, { name: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if brand to update belongs to another user', async () => {
      prisma.brand.findUnique.mockResolvedValue(mockBrand);

      await expect(
        service.update('brand-uuid-1', otherUserId, { name: 'New' }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft delete the brand by setting deletedAt timestamp', async () => {
      prisma.brand.findUnique.mockResolvedValue(mockBrand);
      prisma.brand.update.mockResolvedValue({
        ...mockBrand,
        deletedAt: new Date(),
      });

      const result = await service.remove('brand-uuid-1', mockUserId);

      expect(prisma.brand.update).toHaveBeenCalledWith({
        where: { id: 'brand-uuid-1' },
        data: {
          deletedAt: expect.any(Date),
        },
      });
      expect(result).toEqual({ message: 'Brand deleted successfully' });
    });

    it('should throw NotFoundException if brand to delete does not exist', async () => {
      prisma.brand.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('non-existent-id', mockUserId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if brand to delete belongs to another user', async () => {
      prisma.brand.findUnique.mockResolvedValue(mockBrand);

      await expect(
        service.remove('brand-uuid-1', otherUserId),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
