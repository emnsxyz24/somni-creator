'use client';

import * as React from 'react';
import { DealKanbanColumn } from './deal-kanban-column';
import { useUpdateDealStatus } from '../hooks/use-deals';
import { ApiError } from '@/lib/api-client';
import type { Deal, DealStatus } from '../types';

interface DealKanbanBoardProps {
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
}

const PROGRESSION_COLUMNS: DealStatus[] = [
  'LEAD',
  'NEGOTIATING',
  'CONTRACT_SENT',
  'IN_PROGRESS',
  'DELIVERED',
  'INVOICED',
  'PAID',
];

const TERMINAL_COLUMNS: DealStatus[] = ['LOST', 'CANCELLED'];

export function DealKanbanBoard({
  deals,
  onEdit,
  onDelete,
}: DealKanbanBoardProps) {
  const { mutateAsync: updateStatus } = useUpdateDealStatus();
  const [draggingDeal, setDraggingDeal] = React.useState<Deal | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = React.useState<DealStatus | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const dealsByStatus = React.useMemo(() => {
    const buckets: Record<DealStatus, Deal[]> = {
      LEAD: [],
      NEGOTIATING: [],
      CONTRACT_SENT: [],
      IN_PROGRESS: [],
      DELIVERED: [],
      INVOICED: [],
      PAID: [],
      LOST: [],
      CANCELLED: [],
    };

    for (const deal of deals) {
      if (buckets[deal.status]) {
        buckets[deal.status].push(deal);
      }
    }

    return buckets;
  }, [deals]);

  const handleCardDragStart = (_e: React.DragEvent, deal: Deal) => {
    setErrorMessage(null);
    setDraggingDeal(deal);
  };

  const handleCardDragEnd = () => {
    setDraggingDeal(null);
    setDropTargetStatus(null);
  };

  const handleDragOver = (_e: React.DragEvent, status: DealStatus) => {
    if (dropTargetStatus !== status) {
      setDropTargetStatus(status);
    }
  };

  const handleDragLeave = (_e: React.DragEvent, status: DealStatus) => {
    if (dropTargetStatus === status) {
      setDropTargetStatus(null);
    }
  };

  const handleDrop = async (_e: React.DragEvent, targetStatus: DealStatus) => {
    if (!draggingDeal) return;
    const dealToUpdate = draggingDeal;
    setDraggingDeal(null);
    setDropTargetStatus(null);

    if (dealToUpdate.status === targetStatus) return;

    try {
      setErrorMessage(null);
      await updateStatus({ id: dealToUpdate.id, status: targetStatus });
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to advance deal status. Please try again.');
      }
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {errorMessage && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start scrollbar-thin">
        {PROGRESSION_COLUMNS.map((status) => (
          <DealKanbanColumn
            key={status}
            status={status}
            deals={dealsByStatus[status]}
            draggingDeal={draggingDeal}
            isDropTarget={dropTargetStatus === status}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onEdit={onEdit}
            onDelete={onDelete}
            onCardDragStart={handleCardDragStart}
            onCardDragEnd={handleCardDragEnd}
          />
        ))}

        <div className="flex items-center self-stretch px-1">
          <div className="w-px h-[90%] bg-border/70 my-auto" />
        </div>

        {TERMINAL_COLUMNS.map((status) => (
          <DealKanbanColumn
            key={status}
            status={status}
            deals={dealsByStatus[status]}
            draggingDeal={draggingDeal}
            isDropTarget={dropTargetStatus === status}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onEdit={onEdit}
            onDelete={onDelete}
            onCardDragStart={handleCardDragStart}
            onCardDragEnd={handleCardDragEnd}
          />
        ))}
      </div>
    </div>
  );
}
