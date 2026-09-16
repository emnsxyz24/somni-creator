'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Pencil,
  Trash2,
  Building2,
  Sparkles,
  GripVertical,
  CheckSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Deal } from '../types';
import { cn } from 'cn';

interface DealKanbanCardProps {
  deal: Deal;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
  onManageDeliverables?: (deal: Deal) => void;
  isDragging?: boolean;
  onDragStart: (e: React.DragEvent, deal: Deal) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export function DealKanbanCard({
  deal,
  onEdit,
  onDelete,
  onManageDeliverables,
  isDragging,
  onDragStart,
  onDragEnd,
}: DealKanbanCardProps) {
  const canDrag = Boolean(deal.allowedNextStatuses && deal.allowedNextStatuses.length > 0);

  const formatCurrency = (amount: number, currency = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (!canDrag) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', deal.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(e, deal);
  };

  return (
    <div
      draggable={canDrag}
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      className={cn(
        'group relative flex flex-col gap-2.5 rounded-lg border border-border bg-card p-3.5 shadow-xs transition-all select-none',
        canDrag
          ? 'cursor-grab hover:border-primary/40 hover:shadow-sm active:cursor-grabbing'
          : 'cursor-default opacity-90',
        isDragging && 'opacity-30 border-dashed border-primary scale-95',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {canDrag && (
            <GripVertical className="size-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
          )}
          <div className="flex items-center gap-1 text-xs text-muted-foreground truncate">
            <Building2 className="size-3 shrink-0 text-muted-foreground/70" />
            <span className="truncate font-medium">
              {deal.brand?.name ?? 'Unknown Brand'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onEdit(deal);
            }}
            aria-label={`Edit ${deal.title}`}
          >
            <Pencil className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              onDelete(deal);
            }}
            aria-label={`Delete ${deal.title}`}
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      </div>

      <div>
        <Link
          href={`/deals/${deal.id}`}
          onClick={(e) => e.stopPropagation()}
          className="hover:underline focus-visible:underline outline-none"
        >
          <h4 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug hover:text-primary transition-colors">
            {deal.title}
          </h4>
        </Link>
        {deal.notes && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {deal.notes}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-border/60 text-xs">
        <span className="font-bold text-foreground">
          {formatCurrency(deal.valueAmount, deal.valueCurrency)}
        </span>

        <div className="flex items-center gap-1.5">
          {onManageDeliverables && (
            <Button
              variant="outline"
              size="xs"
              className="h-6 px-1.5 text-[11px] gap-1 text-muted-foreground hover:text-foreground"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onManageDeliverables(deal);
              }}
              title="Manage Deliverables"
            >
              <CheckSquare className="size-3" />
              <span>Deliverables</span>
            </Button>
          )}

          {deal.source !== 'MANUAL' && (
            <span
              className="flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary"
              title={`Sourced via ${deal.source}`}
            >
              <Sparkles className="size-2.5" />
              <span>AI</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
