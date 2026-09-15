'use client';

import * as React from 'react';
import {
  Plus,
  Search,
  Briefcase,
  AlertCircle,
  TrendingUp,
  LayoutList,
  Kanban,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeals, useDeleteDeal } from '../hooks/use-deals';
import { DealTable } from './deal-table';
import { DealKanbanBoard } from './deal-kanban-board';
import { DealDialog } from './deal-dialog';
import type { Deal, DealStatus } from '../types';
import { cn } from 'cn';

const STATUS_FILTERS: Array<{ label: string; value: DealStatus | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Lead', value: 'LEAD' },
  { label: 'Negotiating', value: 'NEGOTIATING' },
  { label: 'Contract Sent', value: 'CONTRACT_SENT' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Invoiced', value: 'INVOICED' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Lost', value: 'LOST' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export function DealListView() {
  const { data: deals, isLoading, isError, refetch } = useDeals();
  const { mutateAsync: deleteDeal, isPending: isDeleting } = useDeleteDeal();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedStatus, setSelectedStatus] = React.useState<DealStatus | 'ALL'>('ALL');
  const [viewMode, setViewMode] = React.useState<'table' | 'kanban'>('kanban');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingDeal, setEditingDeal] = React.useState<Deal | null>(null);
  const [deletingDeal, setDeletingDeal] = React.useState<Deal | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const activePipelineValue = React.useMemo(() => {
    if (!deals) return 0;
    return deals
      .filter((d) => d.status !== 'LOST' && d.status !== 'CANCELLED')
      .reduce((sum, d) => sum + Number(d.valueAmount || 0), 0);
  }, [deals]);

  const filteredDeals = React.useMemo(() => {
    if (!deals) return [];
    return deals.filter((deal) => {
      const matchesStatus =
        selectedStatus === 'ALL' || deal.status === selectedStatus;
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !query ||
        deal.title.toLowerCase().includes(query) ||
        (deal.brand?.name && deal.brand.name.toLowerCase().includes(query)) ||
        (deal.notes && deal.notes.toLowerCase().includes(query));

      return matchesStatus && matchesQuery;
    });
  }, [deals, selectedStatus, searchQuery]);

  const handleCreate = () => {
    setEditingDeal(null);
    setDialogOpen(true);
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setDialogOpen(true);
  };

  const handleDeletePrompt = (deal: Deal) => {
    setDeletingDeal(deal);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDeal) return;
    try {
      await deleteDeal(deletingDeal.id);
      setDeletingDeal(null);
    } catch {
      // Handled by query mutation
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight">Deals</h1>
            {deals && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {deals.length}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Track brand collaborations, contracts, and revenue through the deal pipeline.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                viewMode === 'table'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-label="Table View"
            >
              <LayoutList className="size-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer',
                viewMode === 'kanban'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-label="Kanban View"
            >
              <Kanban className="size-3.5" />
              <span className="hidden sm:inline">Kanban</span>
            </button>
          </div>

          <Button onClick={handleCreate} className="gap-1.5 self-start sm:self-auto">
            <Plus className="size-4" />
            <span>New Deal</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Active Pipeline Value</p>
            <p className="text-xl font-bold tracking-tight text-foreground mt-1">
              {formatCurrency(activePipelineValue)}
            </p>
          </div>
          <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <TrendingUp className="size-5" />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Deals</p>
            <p className="text-xl font-bold tracking-tight text-foreground mt-1">
              {deals ? deals.length : 0}
            </p>
          </div>
          <div className="size-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
            <Briefcase className="size-5" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search deals or brands..."
              className="pl-9 h-9"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {STATUS_FILTERS.map((filter) => {
              const isSelected = selectedStatus === filter.value;
              return (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setSelectedStatus(filter.value)}
                  className={cn(
                    'px-2.5 py-1 text-xs font-medium rounded-full transition-colors whitespace-nowrap',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80',
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4 animate-pulse">
          <div className="h-6 w-1/4 bg-muted rounded" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-muted/60 rounded" />
            ))}
          </div>
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center flex flex-col items-center gap-3">
          <AlertCircle className="size-8 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              Failed to load deals
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Could not retrieve deals from the server.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {!isLoading && !isError && deals && deals.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center flex flex-col items-center gap-4 bg-muted/20">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Briefcase className="size-7" />
          </div>
          <div className="max-w-sm">
            <h3 className="font-heading text-lg font-semibold">No deals yet</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Create your first brand sponsorship or collaboration deal to begin tracking revenue.
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-1.5">
            <Plus className="size-4" />
            <span>Create your first deal</span>
          </Button>
        </div>
      )}

      {!isLoading && !isError && deals && deals.length > 0 && filteredDeals.length === 0 && (
        <div className="rounded-xl border border-border p-10 text-center flex flex-col items-center gap-2 text-muted-foreground bg-card">
          <Search className="size-8 opacity-40" />
          <p className="text-sm font-medium">No matching deals found</p>
          <p className="text-xs text-muted-foreground/70">
            No deals matched your current filters. Try adjusting your search or status selection.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedStatus('ALL');
            }}
            className="mt-2 text-primary"
          >
            Reset Filters
          </Button>
        </div>
      )}

      {!isLoading && !isError && filteredDeals.length > 0 &&
        (viewMode === 'kanban' ? (
          <DealKanbanBoard
            deals={filteredDeals}
            onEdit={handleEdit}
            onDelete={handleDeletePrompt}
          />
        ) : (
          <DealTable
            deals={filteredDeals}
            onEdit={handleEdit}
            onDelete={handleDeletePrompt}
            isDeletingId={deletingDeal?.id}
          />
        ))}

      <DealDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        deal={editingDeal}
      />

      <Dialog
        open={Boolean(deletingDeal)}
        onOpenChange={(open) => !open && setDeletingDeal(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Deal</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{deletingDeal?.title}&quot;? This deal will be archived and will no longer appear in your active pipeline.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setDeletingDeal(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
