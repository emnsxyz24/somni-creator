import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BrandsController } from './brands.controller.js';
import { BrandsService } from './brands.service.js';

describe('BrandsController', () => {
  let controller: BrandsController;
  let brandsService: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  const mockUserId = 'user-uuid-1';
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
    brandsService = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    controller = new BrandsController(brandsService as unknown as BrandsService);
  });

  describe('create', () => {
    it('should delegate brand creation to BrandsService', async () => {
      const dto = {
        name: 'Acme Corp',
        contactName: 'Alice',
        contactEmail: 'alice@acme.com',
      };
      brandsService.create.mockResolvedValue(mockBrand);

      const result = await controller.create(mockUserId, dto);

      expect(brandsService.create).toHaveBeenCalledWith(mockUserId, dto);
      expect(result).toEqual(mockBrand);
    });
  });

  describe('findAll', () => {
    it('should delegate retrieving all brands to BrandsService', async () => {
      const list = [mockBrand];
      brandsService.findAll.mockResolvedValue(list);

      const result = await controller.findAll(mockUserId);

      expect(brandsService.findAll).toHaveBeenCalledWith(mockUserId);
      expect(result).toEqual(list);
    });
  });

  describe('findOne', () => {
    it('should delegate retrieving a single brand to BrandsService', async () => {
      brandsService.findOne.mockResolvedValue(mockBrand);

      const result = await controller.findOne('brand-uuid-1', mockUserId);

      expect(brandsService.findOne).toHaveBeenCalledWith(
        'brand-uuid-1',
        mockUserId,
      );
      expect(result).toEqual(mockBrand);
    });
  });

  describe('update', () => {
    it('should delegate brand updating to BrandsService', async () => {
      const updateDto = { name: 'Acme New' };
      const updatedBrand = { ...mockBrand, name: 'Acme New' };
      brandsService.update.mockResolvedValue(updatedBrand);

      const result = await controller.update(
        'brand-uuid-1',
        mockUserId,
        updateDto,
      );

      expect(brandsService.update).toHaveBeenCalledWith(
        'brand-uuid-1',
        mockUserId,
        updateDto,
      );
      expect(result).toEqual(updatedBrand);
    });
  });

  describe('remove', () => {
    it('should delegate brand removal to BrandsService', async () => {
      const response = { message: 'Brand deleted successfully' };
      brandsService.remove.mockResolvedValue(response);

      const result = await controller.remove('brand-uuid-1', mockUserId);

      expect(brandsService.remove).toHaveBeenCalledWith(
        'brand-uuid-1',
        mockUserId,
      );
      expect(result).toEqual(response);
    });
  });
});
