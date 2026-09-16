'use client';

import * as React from 'react';
import Link from 'next/link';
import { Pencil, Trash2, CheckSquare, ExternalLink } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button, buttonVariants } from '@/components/ui/button';
import { DealStatusBadge } from './deal-status-badge';
import { useUpdateDealStatus } from '../hooks/use-deals';
import type { Deal, DealStatus } from '../types';
import { cn } from 'cn';

interface DealTableProps {
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
  onManageDeliverables?: (deal: Deal) => void;
  isDeletingId?: string | null;
}

export function DealTable({
  deals,
  onEdit,
  onDelete,
  onManageDeliverables,
  isDeletingId,
}: DealTableProps) {
  const { mutateAsync: updateStatus, isPending: isStatusPending } =
    useUpdateDealStatus();
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const formatCurrency = (amount: number, currency = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleStatusChange = async (dealId: string, newStatus: DealStatus) => {
    try {
      setUpdatingId(dealId);
      await updateStatus({ id: dealId, status: newStatus });
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[28%]">Deal Title</TableHead>
            <TableHead className="w-[18%]">Brand Partner</TableHead>
            <TableHead className="w-[14%]">Value</TableHead>
            <TableHead className="w-[16%]">Status</TableHead>
            <TableHead className="w-[10%]">Date</TableHead>
            <TableHead className="w-[14%] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {deals.map((deal) => {
            const isDeleting = isDeletingId === deal.id;
            const isTransitioning = isStatusPending && updatingId === deal.id;
            const allowed = deal.allowedNextStatuses || [];

            return (
              <TableRow key={deal.id} className="transition-colors">
                <TableCell>
                  <div className="flex flex-col">
                    <Link
                      href={`/deals/${deal.id}`}
                      className="font-medium text-foreground hover:text-primary hover:underline transition-colors truncate max-w-xs sm:max-w-sm"
                    >
                      {deal.title}
                    </Link>
                    {deal.notes && (
                      <span className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-sm">
                        {deal.notes}
                      </span>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <span className="text-sm font-medium text-foreground">
                    {deal.brand?.name ?? 'Unknown Brand'}
                  </span>
                </TableCell>

                <TableCell>
                  <span className="font-semibold text-foreground text-sm">
                    {formatCurrency(deal.valueAmount, deal.valueCurrency)}
                  </span>
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2">
                    <DealStatusBadge status={deal.status} />

                    {allowed.length > 0 && (
                      <div className="flex items-center">
                        <select
                          disabled={isTransitioning}
                          value=""
                          onChange={(e) => {
                            if (e.target.value) {
                              void handleStatusChange(
                                deal.id,
                                e.target.value as DealStatus,
                              );
                            }
                          }}
                          className="h-6 rounded border border-border bg-background px-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          title="Transition deal status"
                        >
                          <option value="" disabled>
                            Advance...
                          </option>
                          {allowed.map((status) => (
                            <option key={status} value={status}>
                              &rarr; {status}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(deal.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </TableCell>

                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {onManageDeliverables && (
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => onManageDeliverables(deal)}
                        className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        title="Manage Deliverables"
                      >
                        <CheckSquare className="size-3.5" />
                        <span className="hidden lg:inline">Deliverables</span>
                      </Button>
                    )}
                    <Link
                      href={`/deals/${deal.id}`}
                      className={cn(
                        buttonVariants({ variant: 'ghost', size: 'icon-sm' }),
                      )}
                      title="View Deal Details"
                      aria-label={`View ${deal.title} details`}
                    >
                      <ExternalLink className="size-3.5" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onEdit(deal)}
                      disabled={isDeleting}
                      aria-label={`Edit ${deal.title}`}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(deal)}
                      disabled={isDeleting}
                      aria-label={`Delete ${deal.title}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
