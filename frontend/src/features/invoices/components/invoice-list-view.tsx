'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceTable } from './invoice-table';
import { InvoiceEmptyState } from './invoice-empty-state';
import { InvoiceDialog } from './invoice-dialog';
import { InvoiceDetailModal } from './invoice-detail-modal';
import { useInvoices } from '../hooks/use-invoices';
import { InvoiceStatus } from '../types';
import { cn } from 'cn';

const STATUS_TABS: Array<{ label: string; value: InvoiceStatus | 'ALL' }> = [
  { label: 'All Invoices', value: 'ALL' },
  { label: 'Draft', value: InvoiceStatus.DRAFT },
  { label: 'Sent', value: InvoiceStatus.SENT },
  { label: 'Partially Paid', value: InvoiceStatus.PARTIALLY_PAID },
  { label: 'Paid', value: InvoiceStatus.PAID },
  { label: 'Overdue', value: InvoiceStatus.OVERDUE },
];

export function InvoiceListView() {
  const [selectedStatus, setSelectedStatus] = React.useState<InvoiceStatus | 'ALL'>('ALL');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = React.useState<string | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);

  const queryParams = React.useMemo(() => {
    return selectedStatus === 'ALL' ? undefined : { status: selectedStatus };
  }, [selectedStatus]);

  const { data: invoices, isLoading } = useInvoices(queryParams);

  const handleSelectInvoice = (id: string) => {
    setSelectedInvoiceId(id);
    setIsDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Invoices</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track, issue, and manage invoices and client billing.
          </p>
        </div>

        <Button onClick={() => setIsCreateOpen(true)} className="sm:self-center">
          <Plus className="size-4 mr-1.5" />
          New Invoice
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-border">
        {STATUS_TABS.map((tab) => {
          const isActive = selectedStatus === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setSelectedStatus(tab.value)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap',
                isActive
                  ? 'bg-muted text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="rounded-xl border border-border bg-card p-8 space-y-4">
          <div className="h-6 w-1/4 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
        </div>
      ) : !invoices || invoices.length === 0 ? (
        <InvoiceEmptyState
          hasFilter={selectedStatus !== 'ALL'}
          onClearFilter={() => setSelectedStatus('ALL')}
          onCreateInvoice={() => setIsCreateOpen(true)}
        />
      ) : (
        <InvoiceTable
          invoices={invoices}
          onSelectInvoice={handleSelectInvoice}
        />
      )}

      {/* Global Invoice Dialog */}
      <InvoiceDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        invoiceId={selectedInvoiceId}
      />
    </div>
  );
}
