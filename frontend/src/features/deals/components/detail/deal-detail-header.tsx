'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft, Pencil, Trash2, Sparkles, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DealStatusBadge } from '../deal-status-badge';
import type { Deal } from '../../types';

interface DealDetailHeaderProps {
  deal: Deal;
  onEdit: () => void;
  onDelete: () => void;
}

export function DealDetailHeader({
  deal,
  onEdit,
  onDelete,
}: DealDetailHeaderProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-border pb-6">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Link
          href="/deals"
          className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="size-3.5" />
          <span>Deals</span>
        </Link>
        <span>/</span>
        <span className="truncate max-w-xs sm:max-w-sm text-foreground font-medium">
          {deal.title}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="font-heading text-2xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
              {deal.title}
            </h1>
            <DealStatusBadge status={deal.status} />
            {deal.source !== 'MANUAL' && (
              <span
                className="flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                title={`Sourced via ${deal.source}`}
              >
                <Sparkles className="size-3" />
                <span>AI</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="size-4 shrink-0 text-muted-foreground/70" />
            <span className="font-medium text-foreground">
              {deal.brand?.name ?? 'Unknown Brand'}
            </span>
            {deal.brand?.contactName && (
              <>
                <span className="text-muted-foreground/40">&bull;</span>
                <span>{deal.brand.contactName}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="gap-1.5"
          >
            <Pencil className="size-3.5" />
            <span>Edit Deal</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
