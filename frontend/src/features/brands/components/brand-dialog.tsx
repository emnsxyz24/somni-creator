'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateBrand, useUpdateBrand } from '../hooks/use-brands';
import { brandFormSchema, type Brand, type BrandFormValues } from '../types';
import { ApiError } from '@/lib/api-client';

interface BrandDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand?: Brand | null;
}

export function BrandDialog({ open, onOpenChange, brand }: BrandDialogProps) {
  const isEditing = Boolean(brand);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const { mutateAsync: createBrand, isPending: isCreating } = useCreateBrand();
  const { mutateAsync: updateBrand, isPending: isUpdating } = useUpdateBrand();
  const isPending = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    values: {
      name: brand?.name ?? '',
      contactName: brand?.contactName ?? '',
      contactEmail: brand?.contactEmail ?? '',
      notes: brand?.notes ?? '',
    },
    resetOptions: {
      keepDirtyValues: false,
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setErrorMessage(null);
      reset();
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = async (values: BrandFormValues) => {
    try {
      setErrorMessage(null);
      const payload: BrandFormValues = {
        name: values.name.trim(),
        contactName: values.contactName?.trim() || undefined,
        contactEmail: values.contactEmail?.trim() || undefined,
        notes: values.notes?.trim() || undefined,
      };

      if (isEditing && brand) {
        await updateBrand({ id: brand.id, data: payload });
      } else {
        await createBrand(payload);
      }
      onOpenChange(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Brand' : 'Add New Brand'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update contact details or partnership notes for this brand.'
              : 'Add a sponsor, agency, or brand partner to your CRM.'}
          </DialogDescription>
        </DialogHeader>

        {errorMessage && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="brand-name" className="text-xs font-medium">
              Brand Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="brand-name"
              placeholder="e.g. Spotify, NordVPN, ASUS"
              {...register('name')}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-name" className="text-xs font-medium">
                Contact Person
              </label>
              <Input
                id="contact-name"
                placeholder="e.g. Sarah Jenkins"
                {...register('contactName')}
                aria-invalid={Boolean(errors.contactName)}
              />
              {errors.contactName && (
                <p className="text-xs text-destructive">{errors.contactName.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="contact-email" className="text-xs font-medium">
                Contact Email
              </label>
              <Input
                id="contact-email"
                type="email"
                placeholder="e.g. partner@brand.com"
                {...register('contactEmail')}
                aria-invalid={Boolean(errors.contactEmail)}
              />
              {errors.contactEmail && (
                <p className="text-xs text-destructive">{errors.contactEmail.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="brand-notes" className="text-xs font-medium">
              Notes
            </label>
            <Textarea
              id="brand-notes"
              placeholder="Campaign requirements, key contacts, payment terms..."
              rows={3}
              {...register('notes')}
              aria-invalid={Boolean(errors.notes)}
            />
            {errors.notes && (
              <p className="text-xs text-destructive">{errors.notes.message}</p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? 'Saving changes...'
                  : 'Creating brand...'
                : isEditing
                  ? 'Save Changes'
                  : 'Add Brand'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
