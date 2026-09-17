'use client';

import * as React from 'react';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { InvoiceListView } from '@/features/invoices/components/invoice-list-view';

export default function InvoicesPage() {
  return (
    <AuthGuard>
      <main className="mx-auto max-w-6xl p-6 lg:p-8">
        <InvoiceListView />
      </main>
    </AuthGuard>
  );
}
