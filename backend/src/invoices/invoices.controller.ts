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
  UseGuards,
} from '@nestjs/common';
import { InvoiceStatus } from '@prisma/client';
import { InvoicesService } from './invoices.service.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { UpdateInvoiceDto } from './dto/update-invoice.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

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
