import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { DealsModule } from '../deals/deals.module.js';
import { InvoicesService } from './invoices.service.js';
import { InvoicePdfService } from './invoice-pdf.service.js';
import { InvoicesController } from './invoices.controller.js';
import { DealInvoiceController } from './deal-invoice.controller.js';

@Module({
  imports: [PrismaModule, AuthModule, DealsModule],
  controllers: [InvoicesController, DealInvoiceController],
  providers: [InvoicesService, InvoicePdfService],
  exports: [InvoicesService, InvoicePdfService],
})
export class InvoicesModule {}
