'use client';

import * as React from 'react';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { DealListView } from '@/features/deals/components/deal-list-view';

export default function DealsPage() {
  return (
    <AuthGuard>
      <main className="mx-auto max-w-6xl p-6 lg:p-8">
        <DealListView />
      </main>
    </AuthGuard>
  );
}
