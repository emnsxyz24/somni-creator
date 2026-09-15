import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { DeliverableStatus, DeliverableType } from '@prisma/client';

export class CreateDeliverableDto {
  @IsEnum(DeliverableType)
  @IsNotEmpty()
  type!: DeliverableType;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsDateString()
  @IsNotEmpty()
  dueDate!: string;

  @IsOptional()
  @IsEnum(DeliverableStatus)
  status?: DeliverableStatus;
}
