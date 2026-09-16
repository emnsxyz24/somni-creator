'use client';

import * as React from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Calendar,
  Send,
  CheckCircle2,
  Undo2,
  Layers,
  AlertCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DeliverableTypeBadge } from './deliverable-type-badge';
import {
  DeliverableStatusBadge,
  OverdueBadge,
  isDeliverableOverdue,
} from './deliverable-status-badge';
import { DeliverableDialog } from './deliverable-dialog';
import {
  useDeliverables,
  useUpdateDeliverable,
  useDeleteDeliverable,
} from '../hooks/use-deliverables';
import {
  DeliverableStatus,
  type Deliverable,
} from '../types';
import type { Deal } from '@/features/deals/types';
import { cn } from 'cn';

interface DeliverablesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: Deal | null;
}

export function DeliverablesModal({
  open,
  onOpenChange,
  deal,
}: DeliverablesModalProps) {
  const dealId = deal?.id ?? '';
  const { data: deliverables, isLoading, isError, refetch } =
    useDeliverables(dealId);
  const { mutateAsync: updateDeliverable } = useUpdateDeliverable(dealId);
  const { mutateAsync: deleteDeliverable, isPending: isDeleting } =
    useDeleteDeliverable(dealId);

  const [formDialogOpen, setFormDialogOpen] = React.useState(false);
  const [editingDeliverable, setEditingDeliverable] =
    React.useState<Deliverable | null>(null);
  const [deletingDeliverable, setDeletingDeliverable] =
    React.useState<Deliverable | null>(null);
  const [updatingId, setUpdatingId] = React.useState<string | null>(null);

  const totalCount = deliverables?.length ?? 0;
  const approvedCount =
    deliverables?.filter((d) => d.status === DeliverableStatus.APPROVED).length ??
    0;
  const submittedCount =
    deliverables?.filter((d) => d.status === DeliverableStatus.SUBMITTED).length ??
    0;
  const progressPercent =
    totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  const handleCreate = () => {
    setEditingDeliverable(null);
    setFormDialogOpen(true);
  };

  const handleEdit = (del: Deliverable) => {
    setEditingDeliverable(del);
    setFormDialogOpen(true);
  };

  const handleQuickStatusChange = async (
    deliverableId: string,
    nextStatus: DeliverableStatus,
  ) => {
    try {
      setUpdatingId(deliverableId);
      await updateDeliverable({
        id: deliverableId,
        data: { status: nextStatus },
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDeliverable) return;
    try {
      await deleteDeliverable(deletingDeliverable.id);
      setDeletingDeliverable(null);
    } catch {
      // Handled by query mutation
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4 pr-6">
              <div>
                <DialogTitle className="text-xl">
                  Deliverables & Milestones
                </DialogTitle>
                <DialogDescription className="text-xs mt-1">
                  Tracking content commitments for{' '}
                  <span className="font-semibold text-foreground">
                    {deal?.title}
                  </span>{' '}
                  ({deal?.brand?.name ?? 'Brand Partner'}).
                </DialogDescription>
              </div>

              <Button
                size="sm"
                onClick={handleCreate}
                className="gap-1.5 shrink-0"
              >
                <Plus className="size-3.5" />
                <span>Add Deliverable</span>
              </Button>
            </div>
          </DialogHeader>

          {totalCount > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-card/60 p-3.5 mt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">
                  Progress ({approvedCount}/{totalCount} Approved)
                </span>
                <span className="text-muted-foreground font-semibold">
                  {progressPercent}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground pt-0.5">
                <span>Pending: {totalCount - approvedCount - submittedCount}</span>
                <span>Submitted: {submittedCount}</span>
                <span>Approved: {approvedCount}</span>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 py-2 scrollbar-thin">
            {isLoading && (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-20 rounded-xl border border-border bg-muted/40 animate-pulse"
                  />
                ))}
              </div>
            )}

            {isError && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center flex flex-col items-center gap-2">
                <AlertCircle className="size-6 text-destructive" />
                <p className="text-xs font-semibold text-destructive">
                  Failed to load deliverables
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Retry
                </Button>
              </div>
            )}

            {!isLoading && !isError && deliverables && deliverables.length === 0 && (
              <div className="rounded-xl border border-dashed border-border/80 p-8 text-center flex flex-col items-center gap-3 bg-muted/20 my-2">
                <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Layers className="size-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-sm">No deliverables yet</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
                    Add content milestones like videos, reels, or posts with due
                    dates to stay on track.
                  </p>
                </div>
                <Button size="sm" onClick={handleCreate} className="gap-1.5 mt-1">
                  <Plus className="size-3.5" />
                  <span>Add First Deliverable</span>
                </Button>
              </div>
            )}

            {!isLoading &&
              !isError &&
              deliverables &&
              deliverables.map((item) => {
                const isOverdue = isDeliverableOverdue(item.dueDate, item.status);
                const isItemUpdating = updatingId === item.id;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-card p-3.5 transition-colors',
                      item.status === DeliverableStatus.APPROVED &&
                        'border-emerald-500/20 bg-emerald-500/5',
                    )}
                  >
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <DeliverableTypeBadge type={item.type} />
                        <DeliverableStatusBadge status={item.status} />
                        {isOverdue && <OverdueBadge />}
                      </div>

                      {item.description && (
                        <p className="text-xs text-foreground font-medium line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          Due:{' '}
                          {new Date(item.dueDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>

                        {item.submittedAt && (
                          <span className="text-muted-foreground/80">
                            Submitted:{' '}
                            {new Date(item.submittedAt).toLocaleDateString(
                              undefined,
                              {
                                month: 'short',
                                day: 'numeric',
                              },
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 self-end sm:self-center shrink-0">
                      {item.status === DeliverableStatus.PENDING && (
                        <Button
                          variant="outline"
                          size="xs"
                          disabled={isItemUpdating}
                          onClick={() =>
                            handleQuickStatusChange(
                              item.id,
                              DeliverableStatus.SUBMITTED,
                            )
                          }
                          className="gap-1 text-sky-600 dark:text-sky-400 hover:bg-sky-500/10"
                        >
                          <Send className="size-3" />
                          <span>Submit</span>
                        </Button>
                      )}

                      {item.status === DeliverableStatus.SUBMITTED && (
                        <>
                          <Button
                            variant="outline"
                            size="xs"
                            disabled={isItemUpdating}
                            onClick={() =>
                              handleQuickStatusChange(
                                item.id,
                                DeliverableStatus.APPROVED,
                              )
                            }
                            className="gap-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
                          >
                            <CheckCircle2 className="size-3" />
                            <span>Approve</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="xs"
                            disabled={isItemUpdating}
                            onClick={() =>
                              handleQuickStatusChange(
                                item.id,
                                DeliverableStatus.PENDING,
                              )
                            }
                            className="gap-1 text-muted-foreground hover:text-foreground"
                            title="Revert to Pending"
                          >
                            <Undo2 className="size-3" />
                          </Button>
                        </>
                      )}

                      {item.status === DeliverableStatus.APPROVED && (
                        <Button
                          variant="ghost"
                          size="xs"
                          disabled={isItemUpdating}
                          onClick={() =>
                            handleQuickStatusChange(
                              item.id,
                              DeliverableStatus.SUBMITTED,
                            )
                          }
                          className="gap-1 text-muted-foreground hover:text-foreground text-[11px]"
                          title="Revert to Submitted"
                        >
                          <Undo2 className="size-3" />
                          <span>Reopen</span>
                        </Button>
                      )}

                      <div className="w-px h-4 bg-border/60 mx-1" />

                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleEdit(item)}
                        aria-label="Edit deliverable"
                      >
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingDeliverable(item)}
                        aria-label="Delete deliverable"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
          </div>

          <DialogFooter className="pt-2 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {deal && (
        <DeliverableDialog
          open={formDialogOpen}
          onOpenChange={setFormDialogOpen}
          dealId={deal.id}
          deliverable={editingDeliverable}
        />
      )}

      <Dialog
        open={Boolean(deletingDeliverable)}
        onOpenChange={(next) => !next && setDeletingDeliverable(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Deliverable</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this deliverable? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setDeletingDeliverable(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
