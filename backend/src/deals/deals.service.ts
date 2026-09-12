import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { DealSource, DealStatus, type Deal } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { BrandsService } from '../brands/brands.service.js';
import { DealStatusService } from './deal-status.service.js';
import { CreateDealDto } from './dto/create-deal.dto.js';
import { UpdateDealDto } from './dto/update-deal.dto.js';
import { DealNotFoundException } from './exceptions/deal-not-found.exception.js';

export interface FormattedDealResponse extends Omit<Deal, 'valueAmount'> {
  valueAmount: number;
  allowedNextStatuses: DealStatus[];
  brand?: {
    id: string;
    name: string;
    contactName: string | null;
    contactEmail: string | null;
  };
}

@Injectable()
export class DealsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brandsService: BrandsService,
    private readonly dealStatusService: DealStatusService,
  ) {}

  async create(userId: string, dto: CreateDealDto): Promise<FormattedDealResponse> {
    await this.brandsService.findOne(dto.brandId, userId);

    const deal = await this.prisma.deal.create({
      data: {
        userId,
        brandId: dto.brandId,
        title: dto.title,
        valueAmount: BigInt(Math.round(dto.valueAmount)),
        valueCurrency: dto.valueCurrency || 'IDR',
        source: dto.source || DealSource.MANUAL,
        status: DealStatus.LEAD,
        notes: dto.notes,
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

    return this.formatDealResponse(deal);
  }

  async findAll(
    userId: string,
    filter?: { status?: DealStatus; brandId?: string },
  ): Promise<FormattedDealResponse[]> {
    const deals = await this.prisma.deal.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.brandId ? { brandId: filter.brandId } : {}),
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

    return deals.map((deal) => this.formatDealResponse(deal));
  }

  async findOne(id: string, userId: string): Promise<FormattedDealResponse> {
    const deal = await this.prisma.deal.findUnique({
      where: { id },
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

    if (!deal || deal.deletedAt !== null) {
      throw new DealNotFoundException();
    }

    if (deal.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this deal',
      );
    }

    return this.formatDealResponse(deal);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateDealDto,
  ): Promise<FormattedDealResponse> {
    const existing = await this.findOne(id, userId);

    if (dto.brandId && dto.brandId !== existing.brandId) {
      await this.brandsService.findOne(dto.brandId, userId);
    }

    if (dto.status && dto.status !== existing.status) {
      this.dealStatusService.validateTransition(existing.status, dto.status);
    }

    const updated = await this.prisma.deal.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.brandId !== undefined && { brandId: dto.brandId }),
        ...(dto.valueAmount !== undefined && {
          valueAmount: BigInt(Math.round(dto.valueAmount)),
        }),
        ...(dto.valueCurrency !== undefined && {
          valueCurrency: dto.valueCurrency,
        }),
        ...(dto.source !== undefined && { source: dto.source }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
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

    return this.formatDealResponse(updated);
  }

  async updateStatus(
    id: string,
    userId: string,
    newStatus: DealStatus,
  ): Promise<FormattedDealResponse> {
    const existing = await this.findOne(id, userId);

    this.dealStatusService.validateTransition(existing.status, newStatus);

    const updated = await this.prisma.deal.update({
      where: { id },
      data: { status: newStatus },
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

    return this.formatDealResponse(updated);
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    await this.findOne(id, userId);

    await this.prisma.deal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { message: 'Deal deleted successfully' };
  }

  private formatDealResponse(
    deal: Deal & {
      brand?: {
        id: string;
        name: string;
        contactName: string | null;
        contactEmail: string | null;
      };
    },
  ): FormattedDealResponse {
    return {
      ...deal,
      valueAmount: Number(deal.valueAmount),
      allowedNextStatuses: this.dealStatusService.getAllowedTransitions(deal.status),
    };
  }
}
