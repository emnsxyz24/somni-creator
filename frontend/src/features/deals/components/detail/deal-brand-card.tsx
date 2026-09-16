'use client';

import * as React from 'react';
import Link from 'next/link';
import { Building2, User, Mail, ExternalLink, FileText } from 'lucide-react';
import { useBrand } from '@/features/brands/hooks/use-brands';
import type { Deal } from '../../types';

interface DealBrandCardProps {
  deal: Deal;
}

export function DealBrandCard({ deal }: DealBrandCardProps) {
  const { data: brand } = useBrand(deal.brandId);

  const brandName = brand?.name ?? deal.brand?.name ?? 'Unknown Brand';
  const contactName = brand?.contactName ?? deal.brand?.contactName;
  const contactEmail = brand?.contactEmail ?? deal.brand?.contactEmail;
  const brandNotes = brand?.notes;

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-xs flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <Building2 className="size-4" />
          <span>Brand Partner</span>
        </div>

        <Link
          href="/brands"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
        >
          <span>All Brands</span>
          <ExternalLink className="size-3" />
        </Link>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-base font-bold text-foreground">{brandName}</h3>
        </div>

        <div className="flex flex-col gap-2 text-xs text-muted-foreground">
          {contactName ? (
            <div className="flex items-center gap-2">
              <User className="size-3.5 shrink-0 text-muted-foreground/70" />
              <span className="text-foreground font-medium">{contactName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground/60 italic">
              <User className="size-3.5 shrink-0" />
              <span>No contact person listed</span>
            </div>
          )}

          {contactEmail ? (
            <div className="flex items-center gap-2">
              <Mail className="size-3.5 shrink-0 text-muted-foreground/70" />
              <a
                href={`mailto:${contactEmail}`}
                className="text-primary hover:underline truncate"
              >
                {contactEmail}
              </a>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground/60 italic">
              <Mail className="size-3.5 shrink-0" />
              <span>No email provided</span>
            </div>
          )}
        </div>

        {brandNotes && (
          <div className="mt-1 rounded-lg border border-border/70 bg-muted/30 p-2.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-foreground mb-1">
              <FileText className="size-3" />
              <span>Brand Notes</span>
            </div>
            <p className="line-clamp-3">{brandNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
