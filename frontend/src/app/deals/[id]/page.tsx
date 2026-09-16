'use client';

import * as React from 'react';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { DealDetailView } from '@/features/deals/components/detail/deal-detail-view';

interface DealDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function DealDetailPage({ params }: DealDetailPageProps) {
  const { id } = React.use(params);

  return (
    <AuthGuard>
      <main className="mx-auto max-w-6xl p-6 lg:p-8">
        <DealDetailView id={id} />
      </main>
    </AuthGuard>
  );
}
