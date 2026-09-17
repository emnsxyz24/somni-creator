import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StreamableFile } from '@nestjs/common';
import type { Response } from 'express';
import { InvoiceStatus } from '@prisma/client';
import { InvoicesController } from './invoices.controller.js';
import { DealInvoiceController } from './deal-invoice.controller.js';
import { InvoicesService } from './invoices.service.js';
import { InvoicePdfService } from './invoice-pdf.service.js';
import type { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import type { UpdateInvoiceDto } from './dto/update-invoice.dto.js';

describe('InvoicesController & DealInvoiceController', () => {
  let invoicesController: InvoicesController;
  let dealInvoiceController: DealInvoiceController;
  let invoicesService: {
    create: ReturnType<typeof vi.fn>;
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    findByDealId: ReturnType<typeof vi.fn>;
    getInvoiceForPdf: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };
  let invoicePdfService: {
    generate: ReturnType<typeof vi.fn>;
  };

  const mockUserId = 'user-uuid-1';
  const mockDealId = 'deal-uuid-1';
  const mockInvoiceId = 'invoice-uuid-1';

  const mockInvoiceResponse = {
    id: mockInvoiceId,
    dealId: mockDealId,
    invoiceNumber: 'INV-202609-0001',
    issuedDate: '2026-09-16',
    dueDate: '2026-09-30',
    amount: 15000000,
    currency: 'IDR',
    status: InvoiceStatus.DRAFT,
    pdfUrl: null,
    notes: 'Payment via BCA Transfer',
    createdAt: new Date('2026-09-16T00:00:00Z'),
    updatedAt: new Date('2026-09-16T00:00:00Z'),
    deal: {
      id: mockDealId,
      title: 'Brand Sponsorship Q2',
      status: 'INVOICED',
      brand: {
        id: 'brand-uuid-1',
        name: 'Acme Corp',
      },
    },
  };

  beforeEach(() => {
    invoicesService = {
      create: vi.fn(),
      findAll: vi.fn(),
      findOne: vi.fn(),
      findByDealId: vi.fn(),
      getInvoiceForPdf: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    };

    invoicePdfService = {
      generate: vi.fn(),
    };

    invoicesController = new InvoicesController(
      invoicesService as unknown as InvoicesService,
      invoicePdfService as unknown as InvoicePdfService,
    );
    dealInvoiceController = new DealInvoiceController(
      invoicesService as unknown as InvoicesService,
    );
  });

  describe('InvoicesController', () => {
    describe('create', () => {
      it('should delegate invoice creation to InvoicesService', async () => {
        const dto: CreateInvoiceDto = {
          dealId: mockDealId,
          dueDate: '2026-09-30',
          issuedDate: '2026-09-16',
          notes: 'Payment via BCA Transfer',
        };
        invoicesService.create.mockResolvedValue(mockInvoiceResponse);

        const result = await invoicesController.create(mockUserId, dto);

        expect(invoicesService.create).toHaveBeenCalledWith(mockUserId, dto);
        expect(result).toEqual(mockInvoiceResponse);
      });
    });

    describe('findAll', () => {
      it('should delegate retrieving invoices with optional query filters', async () => {
        const list = [mockInvoiceResponse];
        invoicesService.findAll.mockResolvedValue(list);

        const result = await invoicesController.findAll(
          mockUserId,
          InvoiceStatus.DRAFT,
          mockDealId,
        );

        expect(invoicesService.findAll).toHaveBeenCalledWith(mockUserId, {
          status: InvoiceStatus.DRAFT,
          dealId: mockDealId,
        });
        expect(result).toEqual(list);
      });
    });

    describe('findOne', () => {
      it('should delegate invoice retrieval by id to InvoicesService', async () => {
        invoicesService.findOne.mockResolvedValue(mockInvoiceResponse);

        const result = await invoicesController.findOne(mockUserId, mockInvoiceId);

        expect(invoicesService.findOne).toHaveBeenCalledWith(mockInvoiceId, mockUserId);
        expect(result).toEqual(mockInvoiceResponse);
      });
    });

    describe('downloadPdf', () => {
      it('should orchestrate getInvoiceForPdf and generate, set headers, and return StreamableFile', async () => {
        const mockInvoiceWithPdf = {
          ...mockInvoiceResponse,
          deal: {
            ...mockInvoiceResponse.deal,
            deliverables: [],
          },
          user: {
            id: mockUserId,
            name: 'Mikaeru',
            email: 'mikaeru@somni.dev',
          },
        };
        const mockBuffer = Buffer.from('%PDF-1.4 test stream');
        invoicesService.getInvoiceForPdf.mockResolvedValue(mockInvoiceWithPdf);
        invoicePdfService.generate.mockResolvedValue(mockBuffer);

        const mockRes = {
          set: vi.fn(),
        } as unknown as Response;

        const result = await invoicesController.downloadPdf(
          mockUserId,
          mockInvoiceId,
          mockRes,
        );

        expect(invoicesService.getInvoiceForPdf).toHaveBeenCalledWith(
          mockInvoiceId,
          mockUserId,
        );
        expect(invoicePdfService.generate).toHaveBeenCalledWith(mockInvoiceWithPdf);
        expect(mockRes.set).toHaveBeenCalledWith({
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'inline; filename="Invoice-INV-202609-0001.pdf"',
        });
        expect(result).toBeInstanceOf(StreamableFile);
      });
    });

    describe('update', () => {
      it('should delegate invoice updating to InvoicesService', async () => {
        const dto: UpdateInvoiceDto = {
          status: InvoiceStatus.SENT,
          notes: 'Updated invoice instructions',
        };
        const updatedInvoice = {
          ...mockInvoiceResponse,
          status: InvoiceStatus.SENT,
          notes: 'Updated invoice instructions',
        };
        invoicesService.update.mockResolvedValue(updatedInvoice);

        const result = await invoicesController.update(
          mockUserId,
          mockInvoiceId,
          dto,
        );

        expect(invoicesService.update).toHaveBeenCalledWith(
          mockInvoiceId,
          mockUserId,
          dto,
        );
        expect(result).toEqual(updatedInvoice);
      });
    });

    describe('remove', () => {
      it('should delegate invoice soft deletion to InvoicesService', async () => {
        const deleteResponse = { success: true };
        invoicesService.remove.mockResolvedValue(deleteResponse);

        const result = await invoicesController.remove(mockUserId, mockInvoiceId);

        expect(invoicesService.remove).toHaveBeenCalledWith(mockInvoiceId, mockUserId);
        expect(result).toEqual(deleteResponse);
      });
    });
  });

  describe('DealInvoiceController', () => {
    describe('findByDealId', () => {
      it('should delegate retrieving deal invoice to InvoicesService.findByDealId', async () => {
        invoicesService.findByDealId.mockResolvedValue(mockInvoiceResponse);

        const result = await dealInvoiceController.findByDealId(
          mockUserId,
          mockDealId,
        );

        expect(invoicesService.findByDealId).toHaveBeenCalledWith(
          mockDealId,
          mockUserId,
        );
        expect(result).toEqual(mockInvoiceResponse);
      });
    });
  });
});
