import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BrandsModule } from '../brands/brands.module.js';
import { DealsService } from './deals.service.js';
import { DealStatusService } from './deal-status.service.js';
import { DealsController } from './deals.controller.js';

@Module({
  imports: [AuthModule, BrandsModule],
  controllers: [DealsController],
  providers: [DealsService, DealStatusService],
  exports: [DealsService, DealStatusService],
})
export class DealsModule {}
