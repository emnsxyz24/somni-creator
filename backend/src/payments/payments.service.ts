import { Injectable } from '@nestjs/common';
import { DealStatus, InvoiceStatus, type Payment } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { InvoicesService } from '../invoices/invoices.service.js';
import { DealsService } from '../deals/deals.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { PaymentResponse } from './dto/payment-response.dto.js';
import { InvoicePaymentSummaryResponse } from './dto/payment-summary-response.dto.js';
import { PaymentNotFoundException } from './exceptions/payment-not-found.exception.js';
import { PaymentAmountExceededException } from './exceptions/payment-amount-exceeded.exception.js';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoicesService: InvoicesService,
    private readonly dealsService: DealsService,
  ) {}

  async recordPayment(
    invoiceId: string,
    userId: string,
    dto: CreatePaymentDto,
  ): Promise<InvoicePaymentSummaryResponse> {
    const invoice = await this.invoicesService.findOne(invoiceId, userId);

    const aggregate = await this.prisma.payment.aggregate({
      where: { invoiceId },
      _sum: { amount: true },
    });

    const currentTotal = aggregate._sum.amount ?? BigInt(0);
    const invoiceAmount = BigInt(invoice.amount);
    const remainingBalance = invoiceAmount - currentTotal;
    const paymentAmount = BigInt(dto.amount);

    if (paymentAmount > remainingBalance) {
      throw new PaymentAmountExceededException(
        Number(remainingBalance),
        Number(paymentAmount),
      );
    }

    const newTotal = currentTotal + paymentAmount;
    const newInvoiceStatus: InvoiceStatus =
      newTotal >= invoiceAmount
        ? InvoiceStatus.PAID
        : InvoiceStatus.PARTIALLY_PAID;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          invoiceId,
          amount: paymentAmount,
          paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
          method: dto.method?.trim() || null,
          note: dto.note?.trim() || null,
        },
      });

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: newInvoiceStatus },
      });
    });

    // Advance Deal status to PAID if invoice is fully settled
    if (newInvoiceStatus === InvoiceStatus.PAID && invoice.dealId) {
      await this.dealsService.updateStatus(
        invoice.dealId,
        userId,
        DealStatus.PAID,
      );
    }

    return this.findAllByInvoiceId(invoiceId, userId);
  }

  async findAllByInvoiceId(
    invoiceId: string,
    userId: string,
  ): Promise<InvoicePaymentSummaryResponse> {
    const invoice = await this.invoicesService.findOne(invoiceId, userId);

    const payments = await this.prisma.payment.findMany({
      where: { invoiceId },
      orderBy: { paidAt: 'desc' },
    });

    const totalPaidBigInt = payments.reduce(
      (acc, p) => acc + p.amount,
      BigInt(0),
    );

    const invoiceAmount = Number(invoice.amount);
    const totalPaid = Number(totalPaidBigInt);
    const remainingBalance = Math.max(0, invoiceAmount - totalPaid);

    return {
      payments: payments.map((p) => this.formatPaymentResponse(p)),
      invoiceAmount,
      totalPaid,
      remainingBalance,
      invoiceStatus: invoice.status,
    };
  }

  async removePayment(
    invoiceId: string,
    paymentId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const invoice = await this.invoicesService.findOne(invoiceId, userId);

    const payment = await this.prisma.payment.findFirst({
      where: { id: paymentId, invoiceId },
    });

    if (!payment) {
      throw new PaymentNotFoundException();
    }

    const previousInvoiceStatus = invoice.status;

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.delete({
        where: { id: paymentId },
      });

      const agg = await tx.payment.aggregate({
        where: { invoiceId },
        _sum: { amount: true },
      });

      const newTotal = agg._sum.amount ?? BigInt(0);
      const invoiceAmount = BigInt(invoice.amount);

      let targetStatus: InvoiceStatus;
      if (newTotal === BigInt(0)) {
        targetStatus = InvoiceStatus.SENT;
      } else if (newTotal < invoiceAmount) {
        targetStatus = InvoiceStatus.PARTIALLY_PAID;
      } else {
        targetStatus = InvoiceStatus.PAID;
      }

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: targetStatus },
      });

      // If deal was previously PAID and now payments are incomplete, revert deal to INVOICED
      if (
        previousInvoiceStatus === InvoiceStatus.PAID &&
        targetStatus !== InvoiceStatus.PAID &&
        invoice.dealId
      ) {
        await tx.deal.update({
          where: { id: invoice.dealId },
          data: { status: DealStatus.INVOICED },
        });
      }

      return targetStatus;
    });

    return { message: 'Payment deleted successfully' };
  }

  private formatPaymentResponse(payment: Payment): PaymentResponse {
    return {
      id: payment.id,
      invoiceId: payment.invoiceId,
      amount: Number(payment.amount),
      paidAt: payment.paidAt.toISOString(),
      method: payment.method,
      note: payment.note,
      createdAt: payment.createdAt,
    };
  }
}
