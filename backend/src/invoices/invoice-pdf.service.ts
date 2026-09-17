import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { InvoiceStatus } from '@prisma/client';
import type { InvoiceWithPdfRelations, InvoicePdfDeliverable } from './types/invoice-pdf.types.js';

interface StatusStyle {
  bg: string;
  text: string;
  label: string;
}

const STATUS_STYLES: Record<InvoiceStatus, StatusStyle> = {
  [InvoiceStatus.DRAFT]: {
    bg: '#F1F5F9',
    text: '#475569',
    label: 'DRAFT',
  },
  [InvoiceStatus.SENT]: {
    bg: '#E0F2FE',
    text: '#0369A1',
    label: 'SENT',
  },
  [InvoiceStatus.PARTIALLY_PAID]: {
    bg: '#FEF3C7',
    text: '#B45309',
    label: 'PARTIALLY PAID',
  },
  [InvoiceStatus.PAID]: {
    bg: '#DCFCE7',
    text: '#15803D',
    label: 'PAID',
  },
  [InvoiceStatus.OVERDUE]: {
    bg: '#FFE4E6',
    text: '#BE123C',
    label: 'OVERDUE',
  },
};

@Injectable()
export class InvoicePdfService {
  private readonly pageWidth = 595.28;
  private readonly pageMargin = 48;
  private readonly contentWidth = 595.28 - 48 * 2; // 499.28

  generate(invoice: InvoiceWithPdfRelations): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: this.pageMargin,
        bufferPages: true,
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: Error) => reject(err));

      try {
        this.renderHeader(doc, invoice);
        this.renderDivider(doc);
        this.renderMetadata(doc, invoice);
        this.renderDivider(doc);
        this.renderDeliverablesTable(doc, invoice.deal.deliverables);
        this.renderSummary(doc, invoice);

        if (invoice.notes && invoice.notes.trim().length > 0) {
          this.renderNotes(doc, invoice.notes.trim());
        }

        this.renderAllFooters(doc);
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  private renderHeader(doc: typeof PDFDocument, invoice: InvoiceWithPdfRelations): void {
    const startY = 48;
    const leftX = this.pageMargin;
    const rightX = this.pageMargin + 280;

    // Left Column: Invoice Title & Number
    doc
      .fontSize(22)
      .font('Helvetica-Bold')
      .fillColor('#0F172A')
      .text('INVOICE', leftX, startY);

    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#64748B')
      .text(invoice.invoiceNumber, leftX, startY + 28);

    // Status Badge
    const statusStyle = STATUS_STYLES[invoice.status] ?? STATUS_STYLES[InvoiceStatus.DRAFT];
    const badgeY = startY + 46;
    const badgeText = statusStyle.label;
    const badgeWidth = Math.max(badgeText.length * 7 + 16, 64);
    const badgeHeight = 18;

    doc
      .roundedRect(leftX, badgeY, badgeWidth, badgeHeight, 4)
      .fill(statusStyle.bg);

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor(statusStyle.text)
      .text(badgeText, leftX, badgeY + 5, {
        width: badgeWidth,
        align: 'center',
      });

    // Right Column: Creator Info (From)
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#94A3B8')
      .text('FROM:', rightX, startY, { align: 'right', width: this.contentWidth - 280 });

    doc
      .fontSize(13)
      .font('Helvetica-Bold')
      .fillColor('#0F172A')
      .text(invoice.user.name, rightX, startY + 14, { align: 'right', width: this.contentWidth - 280 });

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#64748B')
      .text(invoice.user.email, rightX, startY + 30, { align: 'right', width: this.contentWidth - 280 });

    doc.y = Math.max(badgeY + badgeHeight + 16, startY + 70);
  }

  private renderDivider(doc: typeof PDFDocument): void {
    const y = doc.y + 6;
    doc
      .strokeColor('#E2E8F0')
      .lineWidth(1)
      .moveTo(this.pageMargin, y)
      .lineTo(this.pageMargin + this.contentWidth, y)
      .stroke();

    doc.y = y + 14;
  }

  private renderMetadata(doc: typeof PDFDocument, invoice: InvoiceWithPdfRelations): void {
    const y = doc.y;
    const colWidth = (this.contentWidth - 20) / 2;
    const col1X = this.pageMargin;
    const col2X = this.pageMargin + colWidth + 20;

    // Col 1: Billed To
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#94A3B8')
      .text('BILLED TO', col1X, y);

    doc
      .fontSize(12)
      .font('Helvetica-Bold')
      .fillColor('#0F172A')
      .text(invoice.deal.brand.name, col1X, y + 14);

    let nextY = y + 30;
    if (invoice.deal.brand.contactName) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#334155')
        .text(`Attn: ${invoice.deal.brand.contactName}`, col1X, nextY);
      nextY += 14;
    }

    if (invoice.deal.brand.contactEmail) {
      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#64748B')
        .text(invoice.deal.brand.contactEmail, col1X, nextY);
      nextY += 14;
    }

    // Col 2: Invoice Details
    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#94A3B8')
      .text('INVOICE DETAILS', col2X, y);

    const issuedDateStr = invoice.issuedDate instanceof Date
      ? invoice.issuedDate.toISOString().split('T')[0]
      : String(invoice.issuedDate).split('T')[0];

    const dueDateStr = invoice.dueDate instanceof Date
      ? invoice.dueDate.toISOString().split('T')[0]
      : String(invoice.dueDate).split('T')[0];

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#64748B')
      .text('Issued Date:', col2X, y + 14)
      .font('Helvetica-Bold')
      .fillColor('#0F172A')
      .text(issuedDateStr, col2X + 80, y + 14);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#64748B')
      .text('Due Date:', col2X, y + 30)
      .font('Helvetica-Bold')
      .fillColor('#0F172A')
      .text(dueDateStr, col2X + 80, y + 30);

    doc
      .fontSize(10)
      .font('Helvetica')
      .fillColor('#64748B')
      .text('Deal / Project:', col2X, y + 46)
      .font('Helvetica-Bold')
      .fillColor('#0F172A')
      .text(invoice.deal.title, col2X + 80, y + 46, { width: colWidth - 80 });

    const maxColY = Math.max(nextY, doc.y + 14);
    doc.y = maxColY;
  }

  private renderDeliverablesTable(
    doc: typeof PDFDocument,
    deliverables: InvoicePdfDeliverable[],
  ): void {
    let y = doc.y + 8;

    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .fillColor('#0F172A')
      .text('DELIVERABLES / LINE ITEMS', this.pageMargin, y);

    y += 18;

    // Table Header
    const colNumW = 28;
    const colTypeW = 120;
    const colStatusW = 85;
    const colDescW = this.contentWidth - (colNumW + colTypeW + colStatusW);

    const colNumX = this.pageMargin;
    const colDescX = colNumX + colNumW;
    const colTypeX = colDescX + colDescW;
    const colStatusX = colTypeX + colTypeW;

    doc
      .rect(this.pageMargin, y, this.contentWidth, 22)
      .fill('#F8FAFC');

    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#64748B')
      .text('#', colNumX + 6, y + 6)
      .text('DESCRIPTION', colDescX, y + 6)
      .text('FORMAT / TYPE', colTypeX, y + 6)
      .text('STATUS', colStatusX, y + 6);

    y += 26;

    if (!deliverables || deliverables.length === 0) {
      doc
        .fontSize(9)
        .font('Helvetica-Oblique')
        .fillColor('#94A3B8')
        .text('No deliverables recorded', colDescX, y + 6, {
          width: this.contentWidth - colNumW,
        });

      y += 24;
      doc
        .strokeColor('#F1F5F9')
        .lineWidth(1)
        .moveTo(this.pageMargin, y)
        .lineTo(this.pageMargin + this.contentWidth, y)
        .stroke();
    } else {
      deliverables.forEach((item, index) => {
        const itemNumber = String(index + 1);
        const typeLabel = this.formatDeliverableType(item.type);
        const statusLabel = (item.status ? String(item.status) : 'PENDING').replace('_', ' ');

        doc
          .fontSize(9)
          .font('Helvetica')
          .fillColor('#64748B')
          .text(itemNumber, colNumX + 6, y + 4);

        doc
          .font('Helvetica-Bold')
          .fillColor('#1E293B')
          .text(item.description, colDescX, y + 4, {
            width: colDescW - 10,
          });

        doc
          .font('Helvetica')
          .fillColor('#475569')
          .text(typeLabel, colTypeX, y + 4, {
            width: colTypeW - 10,
          });

        doc
          .font('Helvetica-Bold')
          .fillColor('#0284C7')
          .text(statusLabel, colStatusX, y + 4, {
            width: colStatusW,
          });

        const rowHeight = Math.max(doc.heightOfString(item.description, { width: colDescW - 10 }) + 8, 22);
        y += rowHeight;

        doc
          .strokeColor('#F1F5F9')
          .lineWidth(1)
          .moveTo(this.pageMargin, y)
          .lineTo(this.pageMargin + this.contentWidth, y)
          .stroke();

        y += 4;
      });
    }

    doc.y = y + 10;
  }

  private renderSummary(doc: typeof PDFDocument, invoice: InvoiceWithPdfRelations): void {
    const summaryWidth = 240;
    const summaryX = this.pageMargin + this.contentWidth - summaryWidth;
    let y = doc.y;

    if (y > 700) {
      doc.addPage();
      y = this.pageMargin;
    }

    const formattedTotal = this.formatCurrency(invoice.amount, invoice.currency);

    doc
      .rect(summaryX, y, summaryWidth, 48)
      .fill('#F8FAFC');

    doc
      .strokeColor('#E2E8F0')
      .lineWidth(1)
      .rect(summaryX, y, summaryWidth, 48)
      .stroke();

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#64748B')
      .text('TOTAL AMOUNT', summaryX + 16, y + 10);

    doc
      .fontSize(16)
      .font('Helvetica-Bold')
      .fillColor('#0F172A')
      .text(formattedTotal, summaryX + 16, y + 24, {
        width: summaryWidth - 32,
        align: 'left',
      });

    doc.y = y + 60;
  }

  private renderNotes(doc: typeof PDFDocument, notes: string): void {
    let y = doc.y;

    if (y > 680) {
      doc.addPage();
      y = this.pageMargin;
    }

    const boxWidth = this.contentWidth;
    const textHeight = doc.heightOfString(notes, { width: boxWidth - 28 });
    const boxHeight = textHeight + 36;

    doc
      .rect(this.pageMargin, y, boxWidth, boxHeight)
      .fill('#F8FAFC');

    doc
      .strokeColor('#E2E8F0')
      .lineWidth(1)
      .rect(this.pageMargin, y, boxWidth, boxHeight)
      .stroke();

    doc
      .fontSize(9)
      .font('Helvetica-Bold')
      .fillColor('#475569')
      .text('PAYMENT INSTRUCTIONS & NOTES', this.pageMargin + 14, y + 10);

    doc
      .fontSize(9)
      .font('Helvetica')
      .fillColor('#334155')
      .text(notes, this.pageMargin + 14, y + 26, {
        width: boxWidth - 28,
        lineGap: 3,
      });

    doc.y = y + boxHeight + 14;
  }

  private renderAllFooters(doc: typeof PDFDocument): void {
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);

      const footerY = 800;
      doc
        .strokeColor('#E2E8F0')
        .lineWidth(0.5)
        .moveTo(this.pageMargin, footerY)
        .lineTo(this.pageMargin + this.contentWidth, footerY)
        .stroke();

      doc
        .fontSize(8)
        .font('Helvetica')
        .fillColor('#94A3B8')
        .text(
          'Thank you for your partnership! · Generated via Somni Creator',
          this.pageMargin,
          footerY + 8,
          {
            width: this.contentWidth,
            align: 'center',
          },
        );
    }
  }

  private formatDeliverableType(type?: string | null): string {
    if (!type) return 'Other';
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private formatCurrency(amount: bigint | number, currency: string): string {
    const numeric = Number(amount);
    return `${currency} ${numeric.toLocaleString('en-US')}`;
  }
}
