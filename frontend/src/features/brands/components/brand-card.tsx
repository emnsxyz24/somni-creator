'use client';

import * as React from 'react';
import { Mail, User, Pencil, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Brand } from '../types';

interface BrandCardProps {
  brand: Brand;
  onEdit: (brand: Brand) => void;
  onDelete: (brand: Brand) => void;
  isDeleting?: boolean;
}

export function BrandCard({
  brand,
  onEdit,
  onDelete,
  isDeleting = false,
}: BrandCardProps) {
  const initial = brand.name.trim().charAt(0).toUpperCase() || 'B';

  return (
    <Card className="flex flex-col justify-between transition-colors hover:border-primary/40">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-heading font-semibold text-primary">
              {initial}
            </div>
            <div className="min-w-0">
              <CardTitle className="truncate text-base font-semibold" title={brand.name}>
                {brand.name}
              </CardTitle>
              {brand.contactName && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                  <User className="size-3 shrink-0" />
                  <span className="truncate">{brand.contactName}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2.5 pb-4 text-xs">
        {brand.contactEmail ? (
          <a
            href={`mailto:${brand.contactEmail}`}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors truncate"
          >
            <Mail className="size-3.5 shrink-0" />
            <span className="truncate">{brand.contactEmail}</span>
          </a>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground/60">
            <Mail className="size-3.5 shrink-0 opacity-40" />
            <span>No email listed</span>
          </div>
        )}

        {brand.notes ? (
          <p className="rounded-md bg-muted/50 p-2 text-xs text-muted-foreground line-clamp-3">
            {brand.notes}
          </p>
        ) : (
          <p className="italic text-muted-foreground/50 text-[11px]">
            No notes added yet
          </p>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-[11px] text-muted-foreground/60">
          Added {new Date(brand.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onEdit(brand)}
            aria-label={`Edit ${brand.name}`}
            disabled={isDeleting}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(brand)}
            aria-label={`Delete ${brand.name}`}
            disabled={isDeleting}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
