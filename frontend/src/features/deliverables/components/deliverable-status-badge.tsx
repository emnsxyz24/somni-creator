'use client';

import * as React from 'react';
import { Clock, Send, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from 'cn';
import { DeliverableStatus } from '../types';

interface DeliverableStatusBadgeProps {
  status: DeliverableStatus;
  className?: string;
}

const STATUS_CONFIG: Record<
  DeliverableStatus,
  {
    label: string;
    className: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  [DeliverableStatus.PENDING]: {
    label: 'Pending',
    className:
      'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    icon: Clock,
  },
  [DeliverableStatus.SUBMITTED]: {
    label: 'Submitted',
    className:
      'border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    icon: Send,
  },
  [DeliverableStatus.APPROVED]: {
    label: 'Approved',
    className:
      'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    icon: CheckCircle2,
  },
};

export function DeliverableStatusBadge({
  status,
  className,
}: DeliverableStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    className: 'border-border bg-muted text-muted-foreground',
    icon: Clock,
  };
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap select-none',
        config.className,
        className,
      )}
    >
      <Icon className="size-3 shrink-0" />
      {config.label}
    </span>
  );
}

export function OverdueBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-destructive/30 bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive select-none',
        className,
      )}
    >
      <AlertTriangle className="size-3 shrink-0" />
      Overdue
    </span>
  );
}

export function isDeliverableOverdue(
  dueDate: string,
  status: DeliverableStatus,
): boolean {
  if (status === DeliverableStatus.APPROVED) {
    return false;
  }
  const due = new Date(dueDate);
  due.setHours(23, 59, 59, 999);
  return due.getTime() < Date.now();
}
