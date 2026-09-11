import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { BrandsService } from './brands.service.js';
import { BrandsController } from './brands.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [BrandsController],
  providers: [BrandsService],
  exports: [BrandsService],
})
export class BrandsModule {}
