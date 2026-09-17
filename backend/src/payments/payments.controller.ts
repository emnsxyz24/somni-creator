import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { InvoicePaymentSummaryResponse } from './dto/payment-summary-response.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('invoices/:invoiceId/payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  recordPayment(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePaymentDto,
  ): Promise<InvoicePaymentSummaryResponse> {
    return this.paymentsService.recordPayment(invoiceId, userId, dto);
  }

  @Get()
  findAll(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser('id') userId: string,
  ): Promise<InvoicePaymentSummaryResponse> {
    return this.paymentsService.findAllByInvoiceId(invoiceId, userId);
  }

  @Delete(':paymentId')
  @HttpCode(HttpStatus.OK)
  removePayment(
    @Param('invoiceId') invoiceId: string,
    @Param('paymentId') paymentId: string,
    @CurrentUser('id') userId: string,
  ): Promise<{ message: string }> {
    return this.paymentsService.removePayment(invoiceId, paymentId, userId);
  }
}
