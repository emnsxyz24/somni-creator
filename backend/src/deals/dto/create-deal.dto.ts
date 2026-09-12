import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { DealSource } from '@prisma/client';

export class CreateDealDto {
  @IsUUID()
  @IsNotEmpty()
  brandId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsNumber()
  @Min(0)
  valueAmount!: number;

  @IsOptional()
  @IsString()
  valueCurrency?: string;

  @IsOptional()
  @IsEnum(DealSource)
  source?: DealSource;

  @IsOptional()
  @IsString()
  notes?: string;
}
