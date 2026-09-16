'use client';

import * as React from 'react';
import {
  DollarSign,
  Calendar,
  Clock,
  Sparkles,
  FileText,
  Tag,
} from 'lucide-react';
import type { Deal } from '../../types';

interface DealSummaryCardProps {
  deal: Deal;
}

export function DealSummaryCard({ deal }: DealSummaryCardProps) {
  const formatCurrency = (amount: number, currency = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col gap-4">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        <DollarSign className="size-4" />
        <span>Deal Summary</span>
      </div>

      <div className="flex flex-col gap-1 border-b border-border/70 pb-4">
        <span className="text-xs text-muted-foreground font-medium">
          Contract Value
        </span>
        <div className="text-2xl font-bold tracking-tight text-foreground">
          {formatCurrency(deal.valueAmount, deal.valueCurrency)}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 text-xs text-muted-foreground">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Tag className="size-3.5 text-muted-foreground/70" />
            <span>Source</span>
          </span>
          {deal.source !== 'MANUAL' ? (
            <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              <Sparkles className="size-3" />
              <span>AI Inbound</span>
            </span>
          ) : (
            <span className="font-medium text-foreground">Manual</span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-muted-foreground/70" />
            <span>Created</span>
          </span>
          <span className="font-medium text-foreground">
            {formatDate(deal.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground/70" />
            <span>Last Updated</span>
          </span>
          <span className="font-medium text-foreground">
            {formatDate(deal.updatedAt)}
          </span>
        </div>
      </div>

      {deal.notes && (
        <div className="rounded-lg border border-border/70 bg-muted/30 p-3 text-xs text-muted-foreground mt-1">
          <div className="flex items-center gap-1.5 font-medium text-foreground mb-1.5">
            <FileText className="size-3.5" />
            <span>Deal Notes & Terms</span>
          </div>
          <p className="whitespace-pre-line leading-relaxed text-foreground/90">
            {deal.notes}
          </p>
        </div>
      )}
    </div>
  );
}
