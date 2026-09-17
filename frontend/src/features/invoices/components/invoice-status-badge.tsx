'use client';

import * as React from 'react';
import { cn } from 'cn';
import { InvoiceStatus } from '../types';

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  InvoiceStatus,
  { label: string; className: string; dotClassName: string }
> = {
  [InvoiceStatus.DRAFT]: {
    label: 'Draft',
    className: 'border-border bg-muted text-muted-foreground',
    dotClassName: 'bg-muted-foreground/70',
  },
  [InvoiceStatus.SENT]: {
    label: 'Sent',
    className:
      'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    dotClassName: 'bg-sky-500',
  },
  [InvoiceStatus.PARTIALLY_PAID]: {
    label: 'Partially Paid',
    className:
      'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    dotClassName: 'bg-amber-500',
  },
  [InvoiceStatus.PAID]: {
    label: 'Paid',
    className:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    dotClassName: 'bg-emerald-500',
  },
  [InvoiceStatus.OVERDUE]: {
    label: 'Overdue',
    className:
      'border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300',
    dotClassName: 'bg-rose-500',
  },
};

export function InvoiceStatusBadge({
  status,
  className,
}: InvoiceStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'border-border bg-muted text-muted-foreground',
    dotClassName: 'bg-muted-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        config.className,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', config.dotClassName)} />
      {config.label}
    </span>
  );
}

export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  return STATUS_CONFIG[status]?.label ?? status;
}
