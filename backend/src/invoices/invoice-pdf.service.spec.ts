import { describe, it, expect, beforeEach } from 'vitest';
import { DeliverableStatus, DeliverableType, InvoiceStatus } from '@prisma/client';
import { InvoicePdfService } from './invoice-pdf.service.js';
import type { InvoiceWithPdfRelations } from './types/invoice-pdf.types.js';

describe('InvoicePdfService', () => {
  let service: InvoicePdfService;

  const mockInvoiceData: InvoiceWithPdfRelations = {
    id: 'invoice-uuid-1',
    userId: 'user-uuid-1',
    dealId: 'deal-uuid-1',
    invoiceNumber: 'INV-202609-0001',
    issuedDate: new Date('2026-09-16T00:00:00.000Z'),
    dueDate: new Date('2026-09-30T00:00:00.000Z'),
    amount: BigInt(15000000),
    currency: 'IDR',
    status: InvoiceStatus.DRAFT,
    pdfUrl: null,
    notes: 'Please transfer payment to BCA Account: 1234567890 a/n Mikaeru',
    createdAt: new Date('2026-09-16T00:00:00.000Z'),
    updatedAt: new Date('2026-09-16T00:00:00.000Z'),
    deletedAt: null,
    user: {
      id: 'user-uuid-1',
      name: 'Mikaeru Creator',
      email: 'mikaeru@somnicreator.com',
    },
    deal: {
      id: 'deal-uuid-1',
      title: 'Acme Q3 Brand Campaign',
      valueAmount: BigInt(15000000),
      valueCurrency: 'IDR',
      brand: {
        id: 'brand-uuid-1',
        name: 'Acme Corporation',
        contactName: 'Alice Brand Manager',
        contactEmail: 'alice@acme.corp',
      },
      deliverables: [
        {
          id: 'deliv-1',
          type: DeliverableType.YOUTUBE_VIDEO,
          description: '60s Dedicated Integration Video',
          dueDate: new Date('2026-09-25T00:00:00.000Z'),
          status: DeliverableStatus.APPROVED,
        },
        {
          id: 'deliv-2',
          type: DeliverableType.IG_REEL,
          description: '1x Instagram Reel with product showcase',
          dueDate: new Date('2026-09-28T00:00:00.000Z'),
          status: DeliverableStatus.SUBMITTED,
        },
      ],
    },
  };

  beforeEach(() => {
    service = new InvoicePdfService();
  });

  it('should generate a valid PDF buffer starting with magic bytes %PDF-', async () => {
    const buffer = await service.generate(mockInvoiceData);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('should render successfully when notes are present', async () => {
    const buffer = await service.generate(mockInvoiceData);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(500);
  });

  it('should render successfully when notes are null or empty whitespace', async () => {
    const withoutNotes: InvoiceWithPdfRelations = {
      ...mockInvoiceData,
      notes: null,
    };
    const bufferNullNotes = await service.generate(withoutNotes);
    expect(bufferNullNotes.subarray(0, 5).toString('ascii')).toBe('%PDF-');

    const emptyNotes: InvoiceWithPdfRelations = {
      ...mockInvoiceData,
      notes: '   ',
    };
    const bufferEmptyNotes = await service.generate(emptyNotes);
    expect(bufferEmptyNotes.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('should render successfully across all 5 InvoiceStatus enum values', async () => {
    const statuses: InvoiceStatus[] = [
      InvoiceStatus.DRAFT,
      InvoiceStatus.SENT,
      InvoiceStatus.PARTIALLY_PAID,
      InvoiceStatus.PAID,
      InvoiceStatus.OVERDUE,
    ];

    for (const status of statuses) {
      const invoice: InvoiceWithPdfRelations = {
        ...mockInvoiceData,
        status,
      };
      const buffer = await service.generate(invoice);
      expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
    }
  });

  it('should render clean empty state when deliverables array is empty', async () => {
    const withoutDeliverables: InvoiceWithPdfRelations = {
      ...mockInvoiceData,
      deal: {
        ...mockInvoiceData.deal,
        deliverables: [],
      },
    };

    const buffer = await service.generate(withoutDeliverables);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('should render successfully when brand contact info is null', async () => {
    const minimalBrand: InvoiceWithPdfRelations = {
      ...mockInvoiceData,
      deal: {
        ...mockInvoiceData.deal,
        brand: {
          id: 'brand-uuid-1',
          name: 'Acme Corporation',
          contactName: null,
          contactEmail: null,
        },
      },
    };

    const buffer = await service.generate(minimalBrand);
    expect(buffer.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });
});
