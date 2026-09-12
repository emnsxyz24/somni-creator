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
import { DealStatus } from '@prisma/client';
import { DealsService } from './deals.service.js';
import { CreateDealDto } from './dto/create-deal.dto.js';
import { UpdateDealDto } from './dto/update-deal.dto.js';
import { UpdateDealStatusDto } from './dto/update-deal-status.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('deals')
@UseGuards(JwtAuthGuard)
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: string,
    @Body() createDealDto: CreateDealDto,
  ) {
    return this.dealsService.create(userId, createDealDto);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Query('status') status?: DealStatus,
    @Query('brandId') brandId?: string,
  ) {
    return this.dealsService.findAll(userId, { status, brandId });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.dealsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateDealDto: UpdateDealDto,
  ) {
    return this.dealsService.update(id, userId, updateDealDto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() updateDealStatusDto: UpdateDealStatusDto,
  ) {
    return this.dealsService.updateStatus(
      id,
      userId,
      updateDealStatusDto.status,
    );
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.dealsService.remove(id, userId);
  }
}
