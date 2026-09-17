'use client';

import * as React from 'react';
import Link from 'next/link';
import { Download, Send, Trash2, Eye, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { InvoiceStatusBadge } from './invoice-status-badge';
import {
  useDownloadInvoicePdf,
  useMarkInvoiceAsSent,
  useDeleteInvoice,
} from '../hooks/use-invoices';
import { InvoiceStatus, type Invoice } from '../types';

interface InvoiceTableProps {
  invoices: Invoice[];
  onSelectInvoice: (invoiceId: string) => void;
}

export function InvoiceTable({
  invoices,
  onSelectInvoice,
}: InvoiceTableProps) {
  const { mutateAsync: downloadPdf, isPending: isDownloading } =
    useDownloadInvoicePdf();
  const { mutateAsync: markAsSent, isPending: isSending } =
    useMarkInvoiceAsSent();
  const { mutateAsync: deleteInvoice, isPending: isDeleting } =
    useDeleteInvoice();

  const [activeDownloadingId, setActiveDownloadingId] = React.useState<string | null>(null);
  const [activeSendingId, setActiveSendingId] = React.useState<string | null>(null);
  const [activeDeletingId, setActiveDeletingId] = React.useState<string | null>(null);

  const formatCurrency = (amount: number, currency = 'IDR') => {
    return `${currency} ${Number(amount).toLocaleString('en-US')}`;
  };

  const isInvoiceOverdue = (invoice: Invoice) => {
    if (invoice.status === InvoiceStatus.PAID) return false;
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const handleDownload = async (invoice: Invoice) => {
    try {
      setActiveDownloadingId(invoice.id);
      await downloadPdf({ id: invoice.id, invoiceNumber: invoice.invoiceNumber });
    } finally {
      setActiveDownloadingId(null);
    }
  };

  const handleMarkAsSent = async (invoice: Invoice) => {
    try {
      setActiveSendingId(invoice.id);
      await markAsSent(invoice.id);
    } finally {
      setActiveSendingId(null);
    }
  };

  const handleDelete = async (invoice: Invoice) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoice.invoiceNumber}?`)) {
      try {
        setActiveDeletingId(invoice.id);
        await deleteInvoice(invoice.id);
      } finally {
        setActiveDeletingId(null);
      }
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[18%]">Invoice #</TableHead>
            <TableHead className="w-[28%]">Brand & Deal</TableHead>
            <TableHead className="w-[12%]">Issued</TableHead>
            <TableHead className="w-[14%]">Due Date</TableHead>
            <TableHead className="w-[14%]">Amount</TableHead>
            <TableHead className="w-[14%]">Status</TableHead>
            <TableHead className="w-[14%] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => {
            const overdue = isInvoiceOverdue(invoice);
            const isThisDownloading = isDownloading && activeDownloadingId === invoice.id;
            const isThisSending = isSending && activeSendingId === invoice.id;
            const isThisDeleting = isDeleting && activeDeletingId === invoice.id;

            return (
              <TableRow key={invoice.id} className="transition-colors hover:bg-muted/30">
                {/* Invoice # */}
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onSelectInvoice(invoice.id)}
                    className="font-mono text-xs font-semibold text-primary hover:underline cursor-pointer text-left"
                  >
                    {invoice.invoiceNumber}
                  </button>
                </TableCell>

                {/* Brand & Deal */}
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground text-sm truncate max-w-[220px]">
                      {invoice.deal?.brand?.name ?? 'Brand Partner'}
                    </span>
                    <Link
                      href={`/deals/${invoice.dealId}`}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors truncate max-w-[220px]"
                    >
                      {invoice.deal?.title ?? 'Deal'}
                    </Link>
                  </div>
                </TableCell>

                {/* Issued Date */}
                <TableCell>
                  <span className="text-xs text-muted-foreground">
                    {invoice.issuedDate}
                  </span>
                </TableCell>

                {/* Due Date & Overdue Indicator */}
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-xs ${
                        overdue
                          ? 'font-medium text-rose-600 dark:text-rose-400'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {invoice.dueDate}
                    </span>
                    {overdue && (
                      <span
                        title="Past due date"
                        className="inline-flex items-center rounded-full bg-rose-500/10 p-0.5 text-rose-600 dark:text-rose-400"
                      >
                        <AlertCircle className="size-3" />
                      </span>
                    )}
                  </div>
                </TableCell>

                {/* Amount */}
                <TableCell>
                  <span className="font-medium text-foreground text-xs">
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </span>
                </TableCell>

                {/* Status Badge */}
                <TableCell>
                  <InvoiceStatusBadge status={invoice.status} />
                </TableCell>

                {/* Actions */}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {/* Direct Download Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-muted-foreground hover:text-foreground"
                      title="Download PDF"
                      onClick={() => handleDownload(invoice)}
                      disabled={isThisDownloading}
                    >
                      <Download className="size-4" />
                      <span className="sr-only">Download PDF</span>
                    </Button>

                    {/* Mark as Sent (only for DRAFT) */}
                    {invoice.status === InvoiceStatus.DRAFT && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 text-muted-foreground hover:text-primary"
                        title="Mark as Sent"
                        onClick={() => handleMarkAsSent(invoice)}
                        disabled={isThisSending}
                      >
                        <Send className="size-3.5" />
                        <span className="sr-only">Mark as Sent</span>
                      </Button>
                    )}

                    {/* View Details */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-muted-foreground hover:text-foreground"
                      title="View Details"
                      onClick={() => onSelectInvoice(invoice.id)}
                    >
                      <Eye className="size-4" />
                      <span className="sr-only">View Details</span>
                    </Button>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-8 p-0 text-muted-foreground hover:text-destructive"
                      title="Delete Invoice"
                      onClick={() => handleDelete(invoice)}
                      disabled={isThisDeleting}
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">Delete Invoice</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
