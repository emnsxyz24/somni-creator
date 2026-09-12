'use client';

import * as React from 'react';
import { Plus, Search, Building2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useBrands, useDeleteBrand } from '../hooks/use-brands';
import { BrandCard } from './brand-card';
import { BrandDialog } from './brand-dialog';
import type { Brand } from '../types';

export function BrandList() {
  const { data: brands, isLoading, isError, refetch } = useBrands();
  const { mutateAsync: deleteBrand, isPending: isDeleting } = useDeleteBrand();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingBrand, setEditingBrand] = React.useState<Brand | null>(null);
  const [deletingBrand, setDeletingBrand] = React.useState<Brand | null>(null);

  const filteredBrands = React.useMemo(() => {
    if (!brands) return [];
    if (!searchQuery.trim()) return brands;
    const query = searchQuery.toLowerCase().trim();
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(query) ||
        (b.contactName && b.contactName.toLowerCase().includes(query)) ||
        (b.contactEmail && b.contactEmail.toLowerCase().includes(query)),
    );
  }, [brands, searchQuery]);

  const handleCreate = () => {
    setEditingBrand(null);
    setDialogOpen(true);
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setDialogOpen(true);
  };

  const handleDeletePrompt = (brand: Brand) => {
    setDeletingBrand(brand);
  };

  const handleConfirmDelete = async () => {
    if (!deletingBrand) return;
    try {
      await deleteBrand(deletingBrand.id);
      setDeletingBrand(null);
    } catch {
      // Error handled by TanStack Query
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-heading text-2xl font-bold tracking-tight">Brands</h1>
            {brands && (
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                {brands.length}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your brand partnerships, sponsors, and agency contacts.
          </p>
        </div>

        <Button onClick={handleCreate} className="gap-1.5 self-start sm:self-auto">
          <Plus className="size-4" />
          <span>Add Brand</span>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search brands or contacts..."
            className="pl-9 h-9"
          />
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 rounded-xl border border-border bg-card p-5 animate-pulse flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-lg bg-muted" />
                <div className="flex-1 flex flex-col gap-2">
                  <div className="h-4 w-28 bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
              </div>
              <div className="h-10 bg-muted/60 rounded-md" />
              <div className="h-4 w-24 bg-muted rounded self-start" />
            </div>
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-center flex flex-col items-center gap-3">
          <AlertCircle className="size-8 text-destructive" />
          <div>
            <p className="text-sm font-semibold text-destructive">
              Failed to load brands
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Could not retrieve your brand partners from the server.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Try Again
          </Button>
        </div>
      )}

      {!isLoading && !isError && brands && brands.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center flex flex-col items-center gap-4 bg-muted/20">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Building2 className="size-7" />
          </div>
          <div className="max-w-sm">
            <h3 className="font-heading text-lg font-semibold">No brands yet</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add your sponsors, companies, and agencies to begin tracking deals and contracts.
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-1.5">
            <Plus className="size-4" />
            <span>Add your first brand</span>
          </Button>
        </div>
      )}

      {!isLoading && !isError && brands && brands.length > 0 && filteredBrands.length === 0 && (
        <div className="rounded-xl border border-border p-10 text-center flex flex-col items-center gap-2 text-muted-foreground">
          <Search className="size-8 opacity-40" />
          <p className="text-sm font-medium">No matching brands found</p>
          <p className="text-xs text-muted-foreground/70">
            No brands matched &quot;{searchQuery}&quot;. Try adjusting your search query.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="mt-2 text-primary"
          >
            Clear Search
          </Button>
        </div>
      )}

      {!isLoading && !isError && filteredBrands.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBrands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              onEdit={handleEdit}
              onDelete={handleDeletePrompt}
              isDeleting={isDeleting && deletingBrand?.id === brand.id}
            />
          ))}
        </div>
      )}

      <BrandDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        brand={editingBrand}
      />

      <Dialog
        open={Boolean(deletingBrand)}
        onOpenChange={(open) => !open && setDeletingBrand(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Brand</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove &quot;{deletingBrand?.name}&quot;? This brand will be archived and will no longer appear in your active CRM.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => setDeletingBrand(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
