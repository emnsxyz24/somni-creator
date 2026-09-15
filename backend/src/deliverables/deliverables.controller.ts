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
  UseGuards,
} from '@nestjs/common';
import { DeliverablesService } from './deliverables.service.js';
import { CreateDeliverableDto } from './dto/create-deliverable.dto.js';
import { UpdateDeliverableDto } from './dto/update-deliverable.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

@Controller('deals/:dealId/deliverables')
@UseGuards(JwtAuthGuard)
export class DeliverablesController {
  constructor(private readonly deliverablesService: DeliverablesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser('id') userId: string,
    @Param('dealId') dealId: string,
    @Body() dto: CreateDeliverableDto,
  ) {
    return this.deliverablesService.create(userId, dealId, dto);
  }

  @Get()
  findAll(
    @CurrentUser('id') userId: string,
    @Param('dealId') dealId: string,
  ) {
    return this.deliverablesService.findAll(userId, dealId);
  }

  @Get(':id')
  findOne(
    @CurrentUser('id') userId: string,
    @Param('dealId') dealId: string,
    @Param('id') id: string,
  ) {
    return this.deliverablesService.findOne(userId, dealId, id);
  }

  @Patch(':id')
  update(
    @CurrentUser('id') userId: string,
    @Param('dealId') dealId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDeliverableDto,
  ) {
    return this.deliverablesService.update(userId, dealId, id, dto);
  }

  @Delete(':id')
  remove(
    @CurrentUser('id') userId: string,
    @Param('dealId') dealId: string,
    @Param('id') id: string,
  ) {
    return this.deliverablesService.remove(userId, dealId, id);
  }
}
