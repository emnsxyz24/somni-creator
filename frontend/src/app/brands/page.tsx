'use client';

import * as React from 'react';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { BrandList } from '@/features/brands/components/brand-list';

export default function BrandsPage() {
  return (
    <AuthGuard>
      <main className="mx-auto max-w-6xl p-6 lg:p-8">
        <BrandList />
      </main>
    </AuthGuard>
  );
}
