import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DeliverableStatus, DeliverableType } from '@prisma/client';

export class UpdateDeliverableDto {
  @IsOptional()
  @IsEnum(DeliverableType)
  type?: DeliverableType;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(DeliverableStatus)
  status?: DeliverableStatus;
}
