import { Injectable } from '@nestjs/common';
import { DeliverableStatus, type Deliverable } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { DealsService } from '../deals/deals.service.js';
import { CreateDeliverableDto } from './dto/create-deliverable.dto.js';
import { UpdateDeliverableDto } from './dto/update-deliverable.dto.js';
import type { DeliverableResponse } from './dto/deliverable-response.dto.js';
import { DeliverableNotFoundException } from './exceptions/deliverable-not-found.exception.js';

@Injectable()
export class DeliverablesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dealsService: DealsService,
  ) {}

  async create(
    userId: string,
    dealId: string,
    dto: CreateDeliverableDto,
  ): Promise<DeliverableResponse> {
    await this.dealsService.findOne(dealId, userId);

    let submittedAt: Date | null = null;
    if (
      dto.status === DeliverableStatus.SUBMITTED ||
      dto.status === DeliverableStatus.APPROVED
    ) {
      submittedAt = new Date();
    }

    const deliverable = await this.prisma.deliverable.create({
      data: {
        dealId,
        type: dto.type,
        description: dto.description,
        dueDate: new Date(dto.dueDate),
        status: dto.status ?? DeliverableStatus.PENDING,
        submittedAt,
      },
    });

    return this.formatDeliverableResponse(deliverable);
  }

  async findAll(
    userId: string,
    dealId: string,
  ): Promise<DeliverableResponse[]> {
    await this.dealsService.findOne(dealId, userId);

    const deliverables = await this.prisma.deliverable.findMany({
      where: { dealId },
      orderBy: { dueDate: 'asc' },
    });

    return deliverables.map((d) => this.formatDeliverableResponse(d));
  }

  async findOne(
    userId: string,
    dealId: string,
    id: string,
  ): Promise<DeliverableResponse> {
    await this.dealsService.findOne(dealId, userId);

    const deliverable = await this.prisma.deliverable.findFirst({
      where: { id, dealId },
    });

    if (!deliverable) {
      throw new DeliverableNotFoundException();
    }

    return this.formatDeliverableResponse(deliverable);
  }

  async update(
    userId: string,
    dealId: string,
    id: string,
    dto: UpdateDeliverableDto,
  ): Promise<DeliverableResponse> {
    await this.dealsService.findOne(dealId, userId);

    const existing = await this.prisma.deliverable.findFirst({
      where: { id, dealId },
    });

    if (!existing) {
      throw new DeliverableNotFoundException();
    }

    let submittedAt: Date | null | undefined = undefined;
    if (dto.status !== undefined) {
      if (
        dto.status === DeliverableStatus.SUBMITTED ||
        dto.status === DeliverableStatus.APPROVED
      ) {
        submittedAt = existing.submittedAt ?? new Date();
      } else if (dto.status === DeliverableStatus.PENDING) {
        submittedAt = null;
      }
    }

    const updated = await this.prisma.deliverable.update({
      where: { id },
      data: {
        type: dto.type,
        description: dto.description,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        status: dto.status,
        submittedAt,
      },
    });

    return this.formatDeliverableResponse(updated);
  }

  async remove(
    userId: string,
    dealId: string,
    id: string,
  ): Promise<{ message: string }> {
    await this.dealsService.findOne(dealId, userId);

    const existing = await this.prisma.deliverable.findFirst({
      where: { id, dealId },
    });

    if (!existing) {
      throw new DeliverableNotFoundException();
    }

    await this.prisma.deliverable.delete({
      where: { id },
    });

    return { message: 'Deliverable deleted successfully' };
  }

  private formatDeliverableResponse(
    deliverable: Deliverable,
  ): DeliverableResponse {
    return {
      id: deliverable.id,
      dealId: deliverable.dealId,
      type: deliverable.type,
      description: deliverable.description,
      dueDate: deliverable.dueDate.toISOString().split('T')[0],
      status: deliverable.status,
      submittedAt: deliverable.submittedAt,
      createdAt: deliverable.createdAt,
      updatedAt: deliverable.updatedAt,
    };
  }
}
