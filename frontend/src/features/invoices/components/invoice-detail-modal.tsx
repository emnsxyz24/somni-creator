'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Download,
  Send,
  Trash2,
  ExternalLink,
  Building2,
  FileText,
  AlertTriangle,
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
import { InvoiceStatusBadge } from './invoice-status-badge';
import {
  useInvoice,
  useMarkInvoiceAsSent,
  useDeleteInvoice,
  useDownloadInvoicePdf,
} from '../hooks/use-invoices';
import { InvoiceStatus } from '../types';

interface InvoiceDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoiceId: string | null;
}

export function InvoiceDetailModal({
  open,
  onOpenChange,
  invoiceId,
}: InvoiceDetailModalProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  const { data: invoice, isLoading } = useInvoice(invoiceId || '');
  const { mutateAsync: markAsSent, isPending: isSending } = useMarkInvoiceAsSent();
  const { mutateAsync: deleteInvoice, isPending: isDeleting } = useDeleteInvoice();
  const { mutateAsync: downloadPdf, isPending: isDownloading } = useDownloadInvoicePdf();

  const isOverdue = React.useMemo(() => {
    if (!invoice || invoice.status === InvoiceStatus.PAID) return false;
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  }, [invoice]);

  const handleDownload = async () => {
    if (!invoice) return;
    await downloadPdf({ id: invoice.id, invoiceNumber: invoice.invoiceNumber });
  };

  const handleMarkAsSent = async () => {
    if (!invoice) return;
    await markAsSent(invoice.id);
  };

  const handleDelete = async () => {
    if (!invoice) return;
    await deleteInvoice(invoice.id);
    setDeleteConfirmOpen(false);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
          {isLoading || !invoice ? (
            <div className="space-y-4 py-8">
              <div className="h-6 w-1/3 animate-pulse rounded bg-muted" />
              <div className="h-24 w-full animate-pulse rounded bg-muted" />
              <div className="h-32 w-full animate-pulse rounded bg-muted" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between gap-3 pt-1">
                  <div>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Invoice Reference
                    </span>
                    <DialogTitle className="font-mono text-xl text-foreground">
                      {invoice.invoiceNumber}
                    </DialogTitle>
                  </div>
                  <InvoiceStatusBadge status={invoice.status} />
                </div>
                <DialogDescription className="sr-only">
                  Details and actions for invoice {invoice.invoiceNumber}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Overdue Alert Banner */}
                {isOverdue && (
                  <div className="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs font-medium text-rose-700 dark:text-rose-300">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>This invoice has passed its due date ({invoice.dueDate}) and is awaiting payment.</span>
                  </div>
                )}

                {/* Client & Deal Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Billed To */}
                  <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <Building2 className="size-3.5" />
                      <span className="font-semibold uppercase tracking-wider text-[10px]">
                        Billed To
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground">
                      {invoice.deal?.brand?.name || 'Brand Partner'}
                    </p>
                    {invoice.deal?.brand?.contactName && (
                      <p className="text-xs text-muted-foreground">
                        Attn: {invoice.deal.brand.contactName}
                      </p>
                    )}
                    {invoice.deal?.brand?.contactEmail && (
                      <p className="text-xs text-muted-foreground">
                        {invoice.deal.brand.contactEmail}
                      </p>
                    )}
                  </div>

                  {/* Deal / Campaign */}
                  <div className="rounded-lg border border-border bg-card p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                      <FileText className="size-3.5" />
                      <span className="font-semibold uppercase tracking-wider text-[10px]">
                        Deal & Campaign
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {invoice.deal?.title || 'Associated Deal'}
                    </p>
                    <Link
                      href={`/deals/${invoice.dealId}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline pt-0.5"
                    >
                      <span>View Deal Page</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>
                </div>

                {/* Dates & Amount Overview */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                      Issued Date
                    </span>
                    <span className="text-xs font-medium text-foreground mt-0.5 block">
                      {invoice.issuedDate}
                    </span>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/20 p-3">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                      Due Date
                    </span>
                    <span className="text-xs font-medium text-foreground mt-0.5 block">
                      {invoice.dueDate}
                    </span>
                  </div>

                  <div className="col-span-2 sm:col-span-1 rounded-lg border border-border bg-card p-3">
                    <span className="text-[10px] uppercase font-semibold text-muted-foreground tracking-wider block">
                      Total Amount
                    </span>
                    <span className="text-base font-bold text-foreground mt-0.5 block">
                      {invoice.currency} {Number(invoice.amount).toLocaleString('en-US')}
                    </span>
                  </div>
                </div>

                {/* Deliverables Summary Table */}
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wider text-[11px]">
                    Deliverables / Line Items
                  </span>
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-muted/50 border-b border-border text-[11px] font-semibold text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 w-8">#</th>
                          <th className="px-3 py-2">Description</th>
                          <th className="px-3 py-2">Format</th>
                          <th className="px-3 py-2 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {invoice.deal?.deliverables && invoice.deal.deliverables.length > 0 ? (
                          invoice.deal.deliverables.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-muted/20">
                              <td className="px-3 py-2 text-muted-foreground font-mono">
                                {idx + 1}
                              </td>
                              <td className="px-3 py-2 font-medium text-foreground">
                                {item.description || 'Deliverable item'}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {item.type.replace('_', ' ')}
                              </td>
                              <td className="px-3 py-2 text-right font-medium text-foreground">
                                {item.status.replace('_', ' ')}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-3 py-3 text-center text-muted-foreground italic">
                              No deliverables recorded
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment Instructions & Notes */}
                {invoice.notes && invoice.notes.trim().length > 0 && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Payment Instructions & Notes
                    </span>
                    <p className="text-xs text-foreground whitespace-pre-wrap">
                      {invoice.notes}
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
                <div className="flex items-center gap-2 mr-auto">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="size-3.5 mr-1" />
                    Delete
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {invoice.status === InvoiceStatus.DRAFT && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleMarkAsSent}
                      disabled={isSending}
                    >
                      <Send className="size-3.5 mr-1" />
                      {isSending ? 'Updating...' : 'Mark as Sent'}
                    </Button>
                  )}

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleDownload}
                    disabled={isDownloading}
                  >
                    <Download className="size-3.5 mr-1" />
                    {isDownloading ? 'Downloading...' : 'Download PDF'}
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-destructive">Delete Invoice?</DialogTitle>
            <DialogDescription>
              This invoice will be soft-deleted and removed from your active invoice registry.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
