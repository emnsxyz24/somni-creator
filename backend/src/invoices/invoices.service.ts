import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { DealStatus, InvoiceStatus, type Invoice, type Deal, type Brand } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { DealsService } from '../deals/deals.service.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { UpdateInvoiceDto } from './dto/update-invoice.dto.js';
import { InvoiceResponse } from './dto/invoice-response.dto.js';
import { InvoiceNotFoundException } from './exceptions/invoice-not-found.exception.js';
import { InvoiceConflictException } from './exceptions/invoice-conflict.exception.js';
import { InvalidInvoiceStatusException } from './exceptions/invalid-invoice-status.exception.js';
import type { InvoiceWithPdfRelations } from './types/invoice-pdf.types.js';

type InvoiceWithRelations = Invoice & {
  deal?: (Deal & {
    brand?: Brand | null;
  }) | null;
};

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dealsService: DealsService,
  ) {}

  async create(userId: string, dto: CreateInvoiceDto): Promise<InvoiceResponse> {
    const deal = await this.dealsService.findOne(dto.dealId, userId);

    const existingInvoice = await this.prisma.invoice.findFirst({
      where: {
        dealId: dto.dealId,
        deletedAt: null,
      },
    });

    if (existingInvoice) {
      throw new InvoiceConflictException();
    }

    const issuedDate = dto.issuedDate ? new Date(dto.issuedDate) : new Date();
    const dueDate = new Date(dto.dueDate);

    const invoiceNumber = await this.generateInvoiceNumber(userId, issuedDate);

    const invoice = await this.prisma.invoice.create({
      data: {
        userId,
        dealId: dto.dealId,
        invoiceNumber,
        issuedDate,
        dueDate,
        amount: BigInt(Math.round(deal.valueAmount)),
        currency: deal.valueCurrency,
        status: InvoiceStatus.DRAFT,
        notes: dto.notes,
      },
      include: {
        deal: {
          include: {
            brand: true,
          },
        },
      },
    });

    if (deal.status === DealStatus.DELIVERED) {
      await this.dealsService.updateStatus(deal.id, userId, DealStatus.INVOICED);
    }

    return this.formatInvoiceResponse(invoice);
  }

  async findAll(
    userId: string,
    filter?: { status?: InvoiceStatus; dealId?: string },
  ): Promise<InvoiceResponse[]> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        userId,
        deletedAt: null,
        ...(filter?.status ? { status: filter.status } : {}),
        ...(filter?.dealId ? { dealId: filter.dealId } : {}),
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

    return invoices.map((inv) => this.formatInvoiceResponse(inv));
  }

  async findOne(id: string, userId: string): Promise<InvoiceResponse> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        deal: {
          include: {
            brand: true,
          },
        },
      },
    });

    if (!invoice || invoice.deletedAt !== null) {
      throw new InvoiceNotFoundException();
    }

    if (invoice.userId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this invoice',
      );
    }

    return this.formatInvoiceResponse(invoice);
  }

  async findByDealId(dealId: string, userId: string): Promise<InvoiceResponse> {
    await this.dealsService.findOne(dealId, userId);

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        dealId,
        userId,
        deletedAt: null,
      },
      include: {
        deal: {
          include: {
            brand: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new InvoiceNotFoundException();
    }

    return this.formatInvoiceResponse(invoice);
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateInvoiceDto,
  ): Promise<InvoiceResponse> {
    const existing = await this.findOne(id, userId);

    if (
      dto.status &&
      dto.status !== InvoiceStatus.DRAFT &&
      dto.status !== InvoiceStatus.SENT
    ) {
      throw new InvalidInvoiceStatusException();
    }

    const updated = await this.prisma.invoice.update({
      where: { id: existing.id },
      data: {
        ...(dto.dueDate ? { dueDate: new Date(dto.dueDate) } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.pdfUrl !== undefined ? { pdfUrl: dto.pdfUrl } : {}),
      },
      include: {
        deal: {
          include: {
            brand: true,
          },
        },
      },
    });

    return this.formatInvoiceResponse(updated);
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const existing = await this.findOne(id, userId);

    await this.prisma.invoice.update({
      where: { id: existing.id },
      data: {
        deletedAt: new Date(),
      },
    });

    return { message: 'Invoice deleted successfully' };
  }

  async getInvoiceForPdf(id: string, userId: string): Promise<InvoiceWithPdfRelations> {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
      include: {
        deal: {
          include: {
            brand: true,
            deliverables: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new InvoiceNotFoundException(id);
    }

    return invoice as unknown as InvoiceWithPdfRelations;
  }

  async generateInvoiceNumber(userId: string, date: Date): Promise<string> {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const period = `${year}${month}`;

    const sequence = await this.prisma.invoiceSequence.upsert({
      where: {
        userId_period: {
          userId,
          period,
        },
      },
      update: {
        lastNumber: {
          increment: 1,
        },
      },
      create: {
        userId,
        period,
        lastNumber: 1,
      },
    });

    const paddedNumber = String(sequence.lastNumber).padStart(4, '0');
    return `INV-${period}-${paddedNumber}`;
  }

  private formatInvoiceResponse(invoice: InvoiceWithRelations): InvoiceResponse {
    return {
      id: invoice.id,
      userId: invoice.userId,
      dealId: invoice.dealId,
      invoiceNumber: invoice.invoiceNumber,
      issuedDate: invoice.issuedDate.toISOString().split('T')[0],
      dueDate: invoice.dueDate.toISOString().split('T')[0],
      amount: Number(invoice.amount),
      currency: invoice.currency,
      status: invoice.status,
      pdfUrl: invoice.pdfUrl,
      notes: invoice.notes,
      deal: invoice.deal
        ? {
            id: invoice.deal.id,
            title: invoice.deal.title,
            status: invoice.deal.status,
            brand: invoice.deal.brand
              ? {
                  id: invoice.deal.brand.id,
                  name: invoice.deal.brand.name,
                  contactName: invoice.deal.brand.contactName,
                  contactEmail: invoice.deal.brand.contactEmail,
                }
              : undefined,
          }
        : undefined,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }
}
