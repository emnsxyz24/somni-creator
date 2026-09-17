'use client';

import * as React from 'react';
import {
  Download,
  Eye,
  Plus,
  Receipt,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useDealInvoice,
  useDownloadInvoicePdf,
} from '@/features/invoices/hooks/use-invoices';
import { InvoiceStatusBadge } from '@/features/invoices/components/invoice-status-badge';
import { InvoiceDialog } from '@/features/invoices/components/invoice-dialog';
import { InvoiceDetailModal } from '@/features/invoices/components/invoice-detail-modal';
import type { Deal } from '../../types';

interface DealInvoiceCardProps {
  deal: Deal;
}

export function DealInvoiceCard({ deal }: DealInvoiceCardProps) {
  const [generateOpen, setGenerateOpen] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);

  const { data: invoice, isLoading } = useDealInvoice(deal.id);
  const { mutateAsync: downloadPdf, isPending: isDownloading } =
    useDownloadInvoicePdf();

  const handleDownload = async () => {
    if (!invoice) return;
    await downloadPdf({ id: invoice.id, invoiceNumber: invoice.invoiceNumber });
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="h-5 w-1/3 animate-pulse rounded bg-muted" />
        <div className="h-16 w-full animate-pulse rounded bg-muted" />
      </div>
    );
  }

  // Case 1: Deal already has an attached invoice
  if (invoice) {
    return (
      <>
        <div className="rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Receipt className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Attached Invoice</h2>
            </div>
            <InvoiceStatusBadge status={invoice.status} />
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                  Invoice Number
                </span>
                <span className="font-mono text-base font-bold text-foreground">
                  {invoice.invoiceNumber}
                </span>
              </div>

              <div className="sm:text-right">
                <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                  Invoice Amount
                </span>
                <span className="text-base font-bold text-foreground">
                  {invoice.currency} {Number(invoice.amount).toLocaleString('en-US')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1 border-t border-border">
              <Calendar className="size-3.5" />
              <span>Due on <strong className="text-foreground">{invoice.dueDate}</strong></span>
              <span className="mx-1.5 text-border">·</span>
              <span>Issued on {invoice.issuedDate}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setDetailOpen(true)}
            >
              <Eye className="size-3.5 mr-1.5" />
              View Details
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download className="size-3.5 mr-1.5" />
              {isDownloading ? 'Downloading...' : 'Download PDF'}
            </Button>
          </div>
        </div>

        <InvoiceDetailModal
          open={detailOpen}
          onOpenChange={setDetailOpen}
          invoiceId={invoice.id}
        />
      </>
    );
  }

  // Case 2: Deal is DELIVERED and ready for billing
  if (deal.status === 'DELIVERED') {
    return (
      <>
        <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-teal-600 dark:text-teal-400" />
              <h2 className="text-sm font-semibold text-foreground">Deliverables Complete</h2>
            </div>
            <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-teal-700 dark:text-teal-300">
              Ready to Bill
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            All deliverables for this deal have been marked as complete. Generate an official PDF invoice to bill <strong className="text-foreground">{deal.brand?.name ?? 'the brand'}</strong> and transition this deal to Invoiced.
          </p>

          <Button
            size="sm"
            onClick={() => setGenerateOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="size-4 mr-1.5" />
            Generate Invoice
          </Button>
        </div>

        <InvoiceDialog
          open={generateOpen}
          onOpenChange={setGenerateOpen}
          dealId={deal.id}
          dealSummary={{
            title: deal.title,
            brandName: deal.brand?.name,
            amount: deal.valueAmount,
            currency: deal.valueCurrency,
          }}
        />
      </>
    );
  }

  // Case 3: Deal is in earlier pipeline stage
  return (
    <div className="rounded-xl border border-border bg-card/60 p-5 space-y-2">
      <div className="flex items-center gap-2">
        <Receipt className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">Invoice</h2>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Invoices can be generated once all deliverables are completed and the pipeline advances to the Delivered stage.
      </p>
    </div>
  );
}
