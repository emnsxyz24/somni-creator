'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from 'cn';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useDeal,
  useUpdateDealStatus,
  useDeleteDeal,
} from '../../hooks/use-deals';
import { DealDetailHeader } from './deal-detail-header';
import { DealStatusStepper } from './deal-status-stepper';
import { DealDeliverablesCard } from './deal-deliverables-card';
import { DealSummaryCard } from './deal-summary-card';
import { DealBrandCard } from './deal-brand-card';
import { DealInvoiceCard } from './deal-invoice-card';
import { DealDialog } from '../deal-dialog';
import type { DealStatus } from '../../types';

interface DealDetailViewProps {
  id: string;
}

export function DealDetailView({ id }: DealDetailViewProps) {
  const router = useRouter();
  const { data: deal, isLoading, isError, refetch } = useDeal(id);
  const { mutateAsync: updateStatus, isPending: isUpdatingStatus } =
    useUpdateDealStatus();
  const { mutateAsync: deleteDeal, isPending: isDeleting } = useDeleteDeal();

  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);

  const handleUpdateStatus = async (status: DealStatus) => {
    if (!deal) return;
    await updateStatus({ id: deal.id, status });
  };

  const handleConfirmDelete = async () => {
    if (!deal) return;
    try {
      await deleteDeal(deal.id);
      setDeleteDialogOpen(false);
      router.push('/deals');
    } catch {
      // Handled by query mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-14 w-3/4 bg-muted/60 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="h-44 bg-muted/40 rounded-xl" />
            <div className="h-72 bg-muted/40 rounded-xl" />
          </div>
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="h-48 bg-muted/40 rounded-xl" />
            <div className="h-40 bg-muted/40 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !deal) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-8 text-center flex flex-col items-center gap-4 max-w-md mx-auto my-12">
        <AlertCircle className="size-10 text-destructive" />
        <div>
          <h3 className="font-heading text-lg font-semibold text-destructive">
            Deal not found
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            The deal you are looking for might have been deleted or you do not
            have permission to view it.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
          <Link
            href="/deals"
            className={cn(buttonVariants({ size: 'sm' }), 'gap-1.5')}
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to Deals</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <DealDetailHeader
        deal={deal}
        onEdit={() => setEditDialogOpen(true)}
        onDelete={() => setDeleteDialogOpen(true)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Main Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <DealStatusStepper
            deal={deal}
            onUpdateStatus={handleUpdateStatus}
            isUpdating={isUpdatingStatus}
          />

          <DealDeliverablesCard deal={deal} />
          <DealInvoiceCard deal={deal} />
        </div>

        {/* Sidebar Column */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <DealSummaryCard deal={deal} />
          <DealBrandCard deal={deal} />
        </div>
      </div>

      {/* Edit Deal Modal */}
      <DealDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        deal={deal}
      />

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Deal</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deal.title}&quot;? This deal
              will be archived and removed from your active pipeline.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
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
