import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { InvoiceStatus } from '@prisma/client';
import { InvoicesService } from './invoices.service.js';
import { InvoicePdfService } from './invoice-pdf.service.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { UpdateInvoiceDto } from './dto/update-invoice.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(
    private readonly invoicesService: InvoicesService,
    private readonly invoicePdfService: InvoicePdfService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.create(userId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('status') status?: InvoiceStatus,
    @Query('dealId') dealId?: string,
  ) {
    return this.invoicesService.findAll(userId, { status, dealId });
  }

  @Get(':id')
  findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.invoicesService.findOne(id, userId);
  }

  @Get(':id/pdf')
  async downloadPdf(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const invoice = await this.invoicesService.getInvoiceForPdf(id, userId);
    const buffer = await this.invoicePdfService.generate(invoice);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Invoice-${invoice.invoiceNumber}.pdf"`,
    });

    return new StreamableFile(buffer);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(id, userId, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.invoicesService.remove(id, userId);
  }
}
