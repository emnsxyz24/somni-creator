import { IsEnum, IsNotEmpty } from 'class-validator';
import { DealStatus } from '@prisma/client';

export class UpdateDealStatusDto {
  @IsEnum(DealStatus)
  @IsNotEmpty()
  status!: DealStatus;
}
