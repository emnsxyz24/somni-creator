import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { DealsModule } from '../deals/deals.module.js';
import { DeliverablesService } from './deliverables.service.js';
import { DeliverablesController } from './deliverables.controller.js';

@Module({
  imports: [AuthModule, DealsModule],
  controllers: [DeliverablesController],
  providers: [DeliverablesService],
  exports: [DeliverablesService],
})
export class DeliverablesModule {}
