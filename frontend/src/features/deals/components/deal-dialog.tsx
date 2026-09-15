'use client';

import * as React from 'react';
import Link from 'next/link';
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
import { useBrands } from '@/features/brands/hooks/use-brands';
import { useCreateDeal, useUpdateDeal } from '../hooks/use-deals';
import { dealFormSchema, type Deal, type DealFormValues } from '../types';
import { ApiError } from '@/lib/api-client';

interface DealDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal?: Deal | null;
  defaultBrandId?: string;
}

export function DealDialog({
  open,
  onOpenChange,
  deal,
  defaultBrandId,
}: DealDialogProps) {
  const isEditing = Boolean(deal);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const { data: brands, isLoading: isBrandsLoading } = useBrands();
  const { mutateAsync: createDeal, isPending: isCreating } = useCreateDeal();
  const { mutateAsync: updateDeal, isPending: isUpdating } = useUpdateDeal();
  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DealFormValues>({
    resolver: zodResolver(dealFormSchema),
    values: {
      brandId: deal?.brandId ?? defaultBrandId ?? '',
      title: deal?.title ?? '',
      valueAmount: deal?.valueAmount ?? 0,
      valueCurrency: deal?.valueCurrency ?? 'IDR',
      source: deal?.source ?? 'MANUAL',
      notes: deal?.notes ?? '',
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

  const onSubmit = async (values: DealFormValues) => {
    try {
      setErrorMessage(null);
      const payload: DealFormValues = {
        brandId: values.brandId,
        title: values.title.trim(),
        valueAmount: Number(values.valueAmount),
        valueCurrency: values.valueCurrency || 'IDR',
        source: values.source || 'MANUAL',
        notes: values.notes?.trim() || undefined,
      };

      if (isEditing && deal) {
        await updateDeal({ id: deal.id, data: payload });
      } else {
        await createDeal(payload);
      }
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Deal' : 'New Deal'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update deal value, brand, or contract details.'
              : 'Log a new brand sponsorship or creator deal into your pipeline.'}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="deal-brand" className="text-xs font-medium">
              Brand Partner <span className="text-destructive">*</span>
            </label>
            {isBrandsLoading ? (
              <div className="h-9 w-full rounded-lg border border-input bg-muted animate-pulse" />
            ) : brands && brands.length > 0 ? (
              <select
                id="deal-brand"
                {...register('brandId')}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-invalid={Boolean(errors.brandId)}
              >
                <option value="">Select a brand partner...</option>
                {brands.map((brand) => (
                  <option key={brand.id} value={brand.id}>
                    {brand.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground flex items-center justify-between">
                <span>No brands found in your directory.</span>
                <Link
                  href="/brands"
                  onClick={() => onOpenChange(false)}
                  className="font-medium text-primary hover:underline"
                >
                  + Add Brand first
                </Link>
              </div>
            )}
            {errors.brandId && (
              <p className="text-xs text-destructive">{errors.brandId.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="deal-title" className="text-xs font-medium">
              Deal Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="deal-title"
              placeholder="e.g. YouTube 60s Dedicated Integration, Instagram Reel"
              {...register('title')}
              aria-invalid={Boolean(errors.title)}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="deal-value" className="text-xs font-medium">
                Value Amount (IDR) <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  Rp
                </span>
                <Input
                  id="deal-value"
                  type="number"
                  min="0"
                  step="100000"
                  className="pl-9"
                  placeholder="25000000"
                  {...register('valueAmount', { valueAsNumber: true })}
                  aria-invalid={Boolean(errors.valueAmount)}
                />
              </div>
              {errors.valueAmount && (
                <p className="text-xs text-destructive">
                  {errors.valueAmount.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="deal-source" className="text-xs font-medium">
                Deal Intake Source
              </label>
              <select
                id="deal-source"
                {...register('source')}
                className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="MANUAL">Manual Input</option>
                <option value="AI_EXTRACTED_WEB">AI Extracted (Web)</option>
                <option value="AI_EXTRACTED_TELEGRAM">AI Extracted (Telegram)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="deal-notes" className="text-xs font-medium">
              Notes & Deliverable Details
            </label>
            <Textarea
              id="deal-notes"
              placeholder="Deliverable milestones, video deadlines, exclusivity clauses, discount code..."
              rows={3}
              {...register('notes')}
              aria-invalid={Boolean(errors.notes)}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">{errors.notes.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? 'Saving changes...'
                  : 'Creating deal...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Deal'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
