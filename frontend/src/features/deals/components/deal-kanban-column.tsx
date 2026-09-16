'use client';

import * as React from 'react';
import { DealKanbanCard } from './deal-kanban-card';
import { DealStatusBadge } from './deal-status-badge';
import type { Deal, DealStatus } from '../types';
import { cn } from 'cn';

interface DealKanbanColumnProps {
  status: DealStatus;
  deals: Deal[];
  draggingDeal: Deal | null;
  isDropTarget: boolean;
  onDragOver: (e: React.DragEvent, status: DealStatus) => void;
  onDragLeave: (e: React.DragEvent, status: DealStatus) => void;
  onDrop: (e: React.DragEvent, status: DealStatus) => void;
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
  onManageDeliverables?: (deal: Deal) => void;
  onCardDragStart: (e: React.DragEvent, deal: Deal) => void;
  onCardDragEnd: (e: React.DragEvent) => void;
}

export function DealKanbanColumn({
  status,
  deals,
  draggingDeal,
  isDropTarget,
  onDragOver,
  onDragLeave,
  onDrop,
  onEdit,
  onDelete,
  onManageDeliverables,
  onCardDragStart,
  onCardDragEnd,
}: DealKanbanColumnProps) {
  const isTerminal = status === 'LOST' || status === 'CANCELLED';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const columnTotal = React.useMemo(() => {
    return deals.reduce((sum, d) => sum + Number(d.valueAmount || 0), 0);
  }, [deals]);

  const isValidTarget = React.useMemo(() => {
    if (!draggingDeal) return false;
    if (draggingDeal.status === status) return false;
    return Boolean(draggingDeal.allowedNextStatuses?.includes(status));
  }, [draggingDeal, status]);

  const isInvalidTarget = React.useMemo(() => {
    if (!draggingDeal) return false;
    if (draggingDeal.status === status) return false;
    return !isValidTarget;
  }, [draggingDeal, status, isValidTarget]);

  const handleDragOver = (e: React.DragEvent) => {
    if (isValidTarget) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      onDragOver(e, status);
    } else {
      e.dataTransfer.dropEffect = 'none';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (isValidTarget) {
      e.preventDefault();
      onDrop(e, status);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={(e) => onDragLeave(e, status)}
      onDrop={handleDrop}
      className={cn(
        'flex flex-col w-72 shrink-0 rounded-xl border bg-card/40 transition-all min-h-[500px]',
        isTerminal ? 'border-dashed border-border/80 bg-muted/20' : 'border-border',
        isDropTarget && isValidTarget && 'ring-2 ring-primary bg-primary/5 border-primary shadow-md',
        isInvalidTarget && 'opacity-55',
      )}
    >
      <div className="flex flex-col gap-1.5 p-3.5 border-b border-border/60">
        <div className="flex items-center justify-between gap-2">
          <DealStatusBadge status={status} />
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
            {deals.length}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span>Stage Total</span>
          <span className="font-medium text-foreground">
            {formatCurrency(columnTotal)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 p-3 overflow-y-auto flex-1 max-h-[calc(100vh-22rem)] scrollbar-thin">
        {deals.map((deal) => (
          <DealKanbanCard
            key={deal.id}
            deal={deal}
            onEdit={onEdit}
            onDelete={onDelete}
            onManageDeliverables={onManageDeliverables}
            isDragging={draggingDeal?.id === deal.id}
            onDragStart={onCardDragStart}
            onDragEnd={onCardDragEnd}
          />
        ))}

        {deals.length === 0 && (
          <div
            className={cn(
              'flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 p-6 text-center text-xs text-muted-foreground/60 select-none min-h-[120px]',
              isDropTarget && isValidTarget && 'border-primary/50 bg-primary/10 text-primary font-medium',
            )}
          >
            {isDropTarget && isValidTarget ? 'Drop here to transition' : 'No deals'}
          </div>
        )}
      </div>
    </div>
  );
}
