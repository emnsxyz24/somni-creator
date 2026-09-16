'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  useCreateDeliverable,
  useUpdateDeliverable,
} from '../hooks/use-deliverables';
import {
  deliverableFormSchema,
  DeliverableType,
  DeliverableStatus,
  type Deliverable,
  type DeliverableFormValues,
} from '../types';
import { ApiError } from '@/lib/api-client';

interface DeliverableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId: string;
  deliverable?: Deliverable | null;
}

const TYPE_OPTIONS: Array<{ value: DeliverableType; label: string }> = [
  { value: DeliverableType.YOUTUBE_VIDEO, label: 'YouTube Video' },
  { value: DeliverableType.YOUTUBE_SHORT, label: 'YouTube Short' },
  { value: DeliverableType.IG_REEL, label: 'Instagram Reel' },
  { value: DeliverableType.IG_POST, label: 'Instagram Post' },
  { value: DeliverableType.IG_STORY, label: 'Instagram Story' },
  { value: DeliverableType.TIKTOK, label: 'TikTok Video' },
  { value: DeliverableType.OTHER, label: 'Other Deliverable' },
];

const STATUS_OPTIONS: Array<{ value: DeliverableStatus; label: string }> = [
  { value: DeliverableStatus.PENDING, label: 'Pending (Drafting/In Progress)' },
  { value: DeliverableStatus.SUBMITTED, label: 'Submitted (Awaiting Approval)' },
  { value: DeliverableStatus.APPROVED, label: 'Approved (Complete)' },
];

export function DeliverableDialog({
  open,
  onOpenChange,
  dealId,
  deliverable,
}: DeliverableDialogProps) {
  const isEditing = Boolean(deliverable);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const { mutateAsync: createDeliverable, isPending: isCreating } =
    useCreateDeliverable(dealId);
  const { mutateAsync: updateDeliverable, isPending: isUpdating } =
    useUpdateDeliverable(dealId);
  const isPending = isCreating || isUpdating;

  const defaultDueDate = React.useMemo(() => {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    return today.toISOString().split('T')[0];
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeliverableFormValues>({
    resolver: zodResolver(deliverableFormSchema),
    values: {
      type: deliverable?.type ?? DeliverableType.YOUTUBE_VIDEO,
      description: deliverable?.description ?? '',
      dueDate: deliverable?.dueDate ?? defaultDueDate,
      status: deliverable?.status ?? DeliverableStatus.PENDING,
    },
    resetOptions: {
      keepDirtyValues: false,
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setErrorMessage(null);
      reset();
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: DeliverableFormValues) => {
    try {
      setErrorMessage(null);
      const payload: DeliverableFormValues = {
        type: values.type,
        description: values.description?.trim() || undefined,
        dueDate: values.dueDate,
        status: values.status,
      };

      if (isEditing && deliverable) {
        await updateDeliverable({ id: deliverable.id, data: payload });
      } else {
        await createDeliverable(payload);
      }
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to save deliverable. Please try again.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Deliverable' : 'Add Deliverable'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the format, description, or due date for this deliverable.'
              : 'Add a new sponsored video, post, or content commitment to this deal.'}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="deliverable-type" className="text-xs font-medium">
              Platform & Format <span className="text-destructive">*</span>
            </label>
            <select
              id="deliverable-type"
              {...register('type')}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.type && (
              <p className="text-xs text-destructive">{errors.type.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="deliverable-due-date" className="text-xs font-medium">
              Contractual Due Date <span className="text-destructive">*</span>
            </label>
            <Input
              id="deliverable-due-date"
              type="date"
              {...register('dueDate')}
              aria-invalid={Boolean(errors.dueDate)}
            />
            {errors.dueDate && (
              <p className="text-xs text-destructive">{errors.dueDate.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="deliverable-status" className="text-xs font-medium">
              Current Status
            </label>
            <select
              id="deliverable-status"
              {...register('status')}
              className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="deliverable-desc" className="text-xs font-medium">
              Description / Requirements <span className="text-muted-foreground">(Optional)</span>
            </label>
            <Textarea
              id="deliverable-desc"
              rows={3}
              placeholder="e.g. 60s pre-roll dedicated integration with tracking link, must include promo code 'SOMNI'"
              {...register('description')}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? 'Saving...'
                  : 'Adding...'
                : isEditing
                  ? 'Save Changes'
                  : 'Add Deliverable'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
