'use client';

import * as React from 'react';
import { FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InvoiceEmptyStateProps {
  hasFilter?: boolean;
  onClearFilter?: () => void;
  onCreateInvoice?: () => void;
}

export function InvoiceEmptyState({
  hasFilter = false,
  onClearFilter,
  onCreateInvoice,
}: InvoiceEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
        <FileText className="size-6" />
      </div>

      <h3 className="text-base font-semibold text-foreground">
        {hasFilter ? 'No invoices match this filter' : 'No invoices yet'}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {hasFilter
          ? 'Try selecting a different status filter to find the invoices you are looking for.'
          : 'Create invoices for deals in the Delivered stage to bill brands and track payment status.'}
      </p>

      <div className="mt-6 flex items-center gap-3">
        {hasFilter && onClearFilter ? (
          <Button variant="outline" size="sm" onClick={onClearFilter}>
            Clear Filter
          </Button>
        ) : null}

        {onCreateInvoice ? (
          <Button size="sm" onClick={onCreateInvoice}>
            <Plus className="size-4 mr-1.5" />
            New Invoice
          </Button>
        ) : null}
      </div>
    </div>
  );
}
