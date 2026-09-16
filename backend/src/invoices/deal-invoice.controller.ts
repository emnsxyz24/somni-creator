import {
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { InvoicesService } from './invoices.service.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('deals/:dealId/invoice')
@UseGuards(JwtAuthGuard)
export class DealInvoiceController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  findByDealId(
    @CurrentUser('id') userId: string,
    @Param('dealId') dealId: string,
  ) {
    return this.invoicesService.findByDealId(dealId, userId);
  }
}
