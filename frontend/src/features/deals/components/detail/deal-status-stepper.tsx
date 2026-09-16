'use client';

import * as React from 'react';
import {
  Check,
  ArrowRight,
  Undo2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Deal, DealStatus } from '../../types';
import { cn } from 'cn';

interface DealStatusStepperProps {
  deal: Deal;
  onUpdateStatus: (status: DealStatus) => Promise<void>;
  isUpdating?: boolean;
}

const PIPELINE_STAGES: Array<{ status: DealStatus; label: string }> = [
  { status: 'LEAD', label: 'Lead' },
  { status: 'NEGOTIATING', label: 'Negotiating' },
  { status: 'CONTRACT_SENT', label: 'Contract Sent' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'DELIVERED', label: 'Delivered' },
  { status: 'INVOICED', label: 'Invoiced' },
  { status: 'PAID', label: 'Paid' },
];

export function DealStatusStepper({
  deal,
  onUpdateStatus,
  isUpdating = false,
}: DealStatusStepperProps) {
  const [terminalConfirmOpen, setTerminalConfirmOpen] = React.useState(false);
  const [pendingTerminalStatus, setPendingTerminalStatus] =
    React.useState<DealStatus | null>(null);

  const currentStageIndex = PIPELINE_STAGES.findIndex(
    (s) => s.status === deal.status,
  );
  const isTerminal = deal.status === 'LOST' || deal.status === 'CANCELLED';
  const allowed = React.useMemo(
    () => deal.allowedNextStatuses || [],
    [deal.allowedNextStatuses],
  );

  // Determine next linear forward stage
  const nextLinearStage = React.useMemo(() => {
    if (currentStageIndex < 0 || currentStageIndex >= PIPELINE_STAGES.length - 1) {
      return null;
    }
    const candidate = PIPELINE_STAGES[currentStageIndex + 1].status;
    return allowed.includes(candidate) ? candidate : null;
  }, [currentStageIndex, allowed]);

  // Determine previous linear stage for revert
  const prevLinearStage = React.useMemo(() => {
    if (currentStageIndex <= 0) return null;
    const candidate = PIPELINE_STAGES[currentStageIndex - 1].status;
    return allowed.includes(candidate) ? candidate : null;
  }, [currentStageIndex, allowed]);

  // Other non-linear forward transitions
  const otherAllowedStages = React.useMemo(() => {
    return allowed.filter(
      (s) =>
        s !== nextLinearStage &&
        s !== prevLinearStage &&
        s !== 'LOST' &&
        s !== 'CANCELLED',
    );
  }, [allowed, nextLinearStage, prevLinearStage]);

  const canMarkLost = allowed.includes('LOST');
  const canCancel = allowed.includes('CANCELLED');

  const handlePromptTerminal = (status: DealStatus) => {
    setPendingTerminalStatus(status);
    setTerminalConfirmOpen(true);
  };

  const handleConfirmTerminal = async () => {
    if (!pendingTerminalStatus) return;
    const target = pendingTerminalStatus;
    setTerminalConfirmOpen(false);
    setPendingTerminalStatus(null);
    await onUpdateStatus(target);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Pipeline Stage</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track deal progression from lead qualification to final payment.
          </p>
        </div>

        {isTerminal && (
          <div
            className={cn(
              'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold',
              deal.status === 'LOST'
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'bg-muted text-muted-foreground',
            )}
          >
            <XCircle className="size-3.5" />
            <span>Deal {deal.status === 'LOST' ? 'Lost' : 'Cancelled'}</span>
          </div>
        )}
      </div>

      {/* Visual Stepper */}
      <div className="overflow-x-auto pb-2 scrollbar-none">
        <div className="flex items-center min-w-[620px] justify-between relative px-2">
          {PIPELINE_STAGES.map((stage, idx) => {
            const isCompleted = currentStageIndex > idx;
            const isCurrent = deal.status === stage.status;
            const isFuture = currentStageIndex < idx && !isTerminal;

            return (
              <React.Fragment key={stage.status}>
                <div className="flex flex-col items-center gap-2 z-10">
                  <div
                    className={cn(
                      'size-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                      isCompleted &&
                        'bg-primary/15 text-primary border border-primary/30',
                      isCurrent &&
                        'bg-primary text-primary-foreground shadow-xs ring-4 ring-primary/20',
                      isFuture &&
                        'bg-muted/70 text-muted-foreground/80 border border-border',
                      isTerminal &&
                        !isCompleted &&
                        !isCurrent &&
                        'opacity-40 bg-muted text-muted-foreground border border-border',
                    )}
                  >
                    {isCompleted ? (
                      <Check className="size-4 stroke-[2.5]" />
                    ) : (
                      <span>{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium whitespace-nowrap transition-colors',
                      isCurrent
                        ? 'text-foreground font-semibold'
                        : isCompleted
                          ? 'text-foreground/80'
                          : 'text-muted-foreground/70',
                    )}
                  >
                    {stage.label}
                  </span>
                </div>

                {idx < PIPELINE_STAGES.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 bg-border relative -top-3">
                    <div
                      className={cn(
                        'h-full transition-all duration-300',
                        currentStageIndex > idx
                          ? 'bg-primary'
                          : 'bg-transparent',
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Action Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-border">
        <div className="flex items-center gap-2 flex-wrap">
          {nextLinearStage && (
            <Button
              size="sm"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(nextLinearStage)}
              className="gap-1.5"
            >
              <span>
                Advance to{' '}
                {
                  PIPELINE_STAGES.find((s) => s.status === nextLinearStage)
                    ?.label
                }
              </span>
              <ArrowRight className="size-3.5" />
            </Button>
          )}

          {prevLinearStage && (
            <Button
              variant="outline"
              size="sm"
              disabled={isUpdating}
              onClick={() => onUpdateStatus(prevLinearStage)}
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              title="Revert to previous pipeline stage"
            >
              <Undo2 className="size-3.5" />
              <span>
                Revert to{' '}
                {
                  PIPELINE_STAGES.find((s) => s.status === prevLinearStage)
                    ?.label
                }
              </span>
            </Button>
          )}

          {otherAllowedStages.map((status) => {
            const label =
              PIPELINE_STAGES.find((s) => s.status === status)?.label ?? status;
            return (
              <Button
                key={status}
                variant="outline"
                size="sm"
                disabled={isUpdating}
                onClick={() => onUpdateStatus(status)}
                className="gap-1 text-xs"
              >
                <span>&rarr; {label}</span>
              </Button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {canMarkLost && (
            <Button
              variant="ghost"
              size="sm"
              disabled={isUpdating}
              onClick={() => handlePromptTerminal('LOST')}
              className="text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              Mark as Lost
            </Button>
          )}

          {canCancel && (
            <Button
              variant="ghost"
              size="sm"
              disabled={isUpdating}
              onClick={() => handlePromptTerminal('CANCELLED')}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel Deal
            </Button>
          )}
        </div>
      </div>

      {/* Confirmation Dialog for Terminal Actions */}
      <Dialog
        open={terminalConfirmOpen}
        onOpenChange={setTerminalConfirmOpen}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertTriangle className="size-5" />
              <DialogTitle>
                {pendingTerminalStatus === 'LOST'
                  ? 'Mark Deal as Lost'
                  : 'Cancel Deal'}
              </DialogTitle>
            </div>
            <DialogDescription>
              Are you sure you want to transition this deal to{' '}
              <strong className="text-foreground">
                {pendingTerminalStatus === 'LOST' ? 'Lost' : 'Cancelled'}
              </strong>
              ? This stops active progress on this collaboration.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTerminalConfirmOpen(false)}
            >
              Keep Deal Active
            </Button>
            <Button
              variant={
                pendingTerminalStatus === 'LOST' ? 'destructive' : 'secondary'
              }
              size="sm"
              disabled={isUpdating}
              onClick={handleConfirmTerminal}
            >
              {isUpdating
                ? 'Updating...'
                : pendingTerminalStatus === 'LOST'
                  ? 'Confirm Lost'
                  : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
