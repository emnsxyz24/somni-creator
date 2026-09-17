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
import { useDeals } from '@/features/deals/hooks/use-deals';
import { DealStatus } from '@/features/deals/types';
import { useCreateInvoice } from '../hooks/use-invoices';
import {
  createInvoiceFormSchema,
  type CreateInvoiceFormData,
} from '../types';
import { ApiError } from '@/lib/api-client';

interface InvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  dealId?: string;
  dealSummary?: {
    title: string;
    brandName?: string;
    amount?: number;
    currency?: string;
  };
}

export function InvoiceDialog({
  open,
  onOpenChange,
  dealId: contextualDealId,
  dealSummary,
}: InvoiceDialogProps) {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // When opened globally from /invoices, fetch delivered deals
  const { data: deliveredDeals, isLoading: isDealsLoading } = useDeals(
    contextualDealId ? undefined : { status: DealStatus.DELIVERED },
  );

  const { mutateAsync: createInvoice, isPending } = useCreateInvoice();

  const todayStr = React.useMemo(() => new Date().toISOString().split('T')[0], []);

  const getRelativeDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const [selectedDealId, setSelectedDealId] = React.useState<string>(
    contextualDealId ?? '',
  );

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateInvoiceFormData>({
    resolver: zodResolver(createInvoiceFormSchema),
    defaultValues: {
      dealId: contextualDealId ?? '',
      dueDate: getRelativeDate(14),
      issuedDate: todayStr,
      notes: '',
    },
    values: {
      dealId: contextualDealId ?? '',
      dueDate: getRelativeDate(14),
      issuedDate: todayStr,
      notes: '',
    },
    resetOptions: {
      keepDirtyValues: false,
    },
  });

  const selectedDealInfo = React.useMemo(() => {
    if (dealSummary) return dealSummary;
    if (!deliveredDeals || !selectedDealId) return null;
    const found = deliveredDeals.find((d) => d.id === selectedDealId);
    if (!found) return null;
    return {
      title: found.title,
      brandName: found.brand?.name,
      amount: found.valueAmount,
      currency: found.valueCurrency,
    };
  }, [dealSummary, deliveredDeals, selectedDealId]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setErrorMessage(null);
      setSelectedDealId(contextualDealId ?? '');
      reset();
    }
    onOpenChange(nextOpen);
  };

  const handleApplyPreset = (days: number) => {
    const date = getRelativeDate(days);
    setValue('dueDate', date, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values: CreateInvoiceFormData) => {
    try {
      setErrorMessage(null);
      await createInvoice({
        dealId: values.dealId,
        dueDate: values.dueDate,
        issuedDate: values.issuedDate || todayStr,
        notes: values.notes?.trim() || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to generate invoice. Please try again.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            Create an official invoice for a completed brand deal. Financial amounts are mirrored automatically from the deal contract.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
          {errorMessage && (
            <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              {errorMessage}
            </div>
          )}

          {/* Deal Selection / Summary */}
          {contextualDealId ? (
            <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Deal & Client
              </span>
              <p className="text-sm font-semibold text-foreground">
                {selectedDealInfo?.title || 'Selected Deal'}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-0.5">
                <span>{selectedDealInfo?.brandName || 'Brand Partner'}</span>
                {selectedDealInfo?.amount !== undefined && (
                  <span className="font-medium text-foreground">
                    {selectedDealInfo.currency || 'IDR'}{' '}
                    {Number(selectedDealInfo.amount).toLocaleString('en-US')}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label htmlFor="dealId" className="text-xs font-semibold text-foreground">
                Select Eligible Deal <span className="text-destructive">*</span>
              </label>
              {isDealsLoading ? (
                <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
              ) : deliveredDeals && deliveredDeals.length > 0 ? (
                <select
                  id="dealId"
                  {...register('dealId', {
                    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                      setSelectedDealId(e.target.value);
                    },
                  })}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="">-- Choose a Delivered Deal --</option>
                  {deliveredDeals.map((deal) => (
                    <option key={deal.id} value={deal.id}>
                      {deal.title} ({deal.brand?.name ?? 'No brand'} · {deal.valueCurrency}{' '}
                      {Number(deal.valueAmount).toLocaleString('en-US')})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-md border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
                  No delivered deals available for invoicing. Deliverables must be completed and marked as Delivered first.
                </div>
              )}
              {errors.dealId && (
                <p className="text-xs text-destructive">{errors.dealId.message}</p>
              )}
            </div>
          )}

          {/* Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="issuedDate" className="text-xs font-semibold text-foreground">
                Issued Date
              </label>
              <Input
                id="issuedDate"
                type="date"
                {...register('issuedDate')}
              />
              {errors.issuedDate && (
                <p className="text-xs text-destructive">{errors.issuedDate.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="dueDate" className="text-xs font-semibold text-foreground">
                Due Date <span className="text-destructive">*</span>
              </label>
              <Input
                id="dueDate"
                type="date"
                {...register('dueDate')}
              />
              {errors.dueDate && (
                <p className="text-xs text-destructive">{errors.dueDate.message}</p>
              )}
            </div>
          </div>

          {/* Quick Presets for Due Date */}
          <div className="space-y-1">
            <span className="text-[11px] text-muted-foreground">Quick Due Date Presets:</span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyPreset(7)}
                className="rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                +7 Days
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(14)}
                className="rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                +14 Days
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(30)}
                className="rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground hover:bg-muted transition-colors"
              >
                +30 Days
              </button>
            </div>
          </div>

          {/* Payment Instructions & Notes */}
          <div className="space-y-1.5">
            <label htmlFor="notes" className="text-xs font-semibold text-foreground">
              Payment Instructions & Notes
            </label>
            <Textarea
              id="notes"
              placeholder="e.g. Bank Transfer: BCA 1234567890 a/n Mikaeru"
              rows={3}
              {...register('notes')}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">{errors.notes.message}</p>
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
            <Button
              type="submit"
              disabled={isPending || (!contextualDealId && (!deliveredDeals || deliveredDeals.length === 0))}
            >
              {isPending ? 'Generating...' : 'Generate Invoice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
