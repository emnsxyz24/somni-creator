'use client';

import * as React from 'react';
import { cn } from 'cn';
import { DealStatus } from '../types';

interface DealStatusBadgeProps {
  status: DealStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  DealStatus,
  { label: string; className: string; dotClassName: string }
> = {
  [DealStatus.LEAD]: {
    label: 'Lead',
    className:
      'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    dotClassName: 'bg-sky-500',
  },
  [DealStatus.NEGOTIATING]: {
    label: 'Negotiating',
    className:
      'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    dotClassName: 'bg-amber-500',
  },
  [DealStatus.CONTRACT_SENT]: {
    label: 'Contract Sent',
    className:
      'border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300',
    dotClassName: 'bg-violet-500',
  },
  [DealStatus.IN_PROGRESS]: {
    label: 'In Progress',
    className:
      'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300',
    dotClassName: 'bg-blue-500',
  },
  [DealStatus.DELIVERED]: {
    label: 'Delivered',
    className:
      'border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-300',
    dotClassName: 'bg-teal-500',
  },
  [DealStatus.INVOICED]: {
    label: 'Invoiced',
    className:
      'border-purple-500/20 bg-purple-500/10 text-purple-700 dark:text-purple-300',
    dotClassName: 'bg-purple-500',
  },
  [DealStatus.PAID]: {
    label: 'Paid',
    className:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    dotClassName: 'bg-emerald-500',
  },
  [DealStatus.LOST]: {
    label: 'Lost',
    className: 'border-border bg-muted text-muted-foreground',
    dotClassName: 'bg-muted-foreground/60',
  },
  [DealStatus.CANCELLED]: {
    label: 'Cancelled',
    className:
      'border-destructive/20 bg-destructive/10 text-destructive',
    dotClassName: 'bg-destructive',
  },
};

export function DealStatusBadge({ status, className }: DealStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'border-border bg-muted text-muted-foreground',
    dotClassName: 'bg-muted-foreground',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        config.className,
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', config.dotClassName)} />
      {config.label}
    </span>
  );
}

export function getStatusLabel(status: DealStatus): string {
  return STATUS_CONFIG[status]?.label ?? status;
}
