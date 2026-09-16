import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { InvoiceStatus } from '@prisma/client';

export const ALLOWED_UPDATE_INVOICE_STATUSES = [
  InvoiceStatus.DRAFT,
  InvoiceStatus.SENT,
] as const;

export type AllowedUpdateInvoiceStatus =
  (typeof ALLOWED_UPDATE_INVOICE_STATUSES)[number];

export class UpdateInvoiceDto {
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsIn(ALLOWED_UPDATE_INVOICE_STATUSES, {
    message: 'Status can only be updated to DRAFT or SENT in this phase',
  })
  status?: AllowedUpdateInvoiceStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  pdfUrl?: string;
}
