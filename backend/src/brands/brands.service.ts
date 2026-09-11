import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBrandDto } from './dto/create-brand.dto.js';
import { UpdateBrandDto } from './dto/update-brand.dto.js';

@Injectable()
export class BrandsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateBrandDto) {
    return this.prisma.brand.create({
      data: {
        userId,
        name: dto.name,
        contactName: dto.contactName,
        contactEmail: dto.contactEmail,
        notes: dto.notes,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.brand.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, userId: string) {
    const brand = await this.prisma.brand.findUnique({
      where: { id },
    });

    if (!brand || brand.deletedAt !== null) {
      throw new NotFoundException('Brand not found');
    }

    if (brand.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this brand',
      );
    }

    return brand;
  }

  async update(id: string, userId: string, dto: UpdateBrandDto) {
    await this.findOne(id, userId);

    return this.prisma.brand.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.contactName !== undefined && { contactName: dto.contactName }),
        ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);

    await this.prisma.brand.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'Brand deleted successfully' };
  }
}
