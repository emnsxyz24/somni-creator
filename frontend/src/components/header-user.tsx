'use client';

import * as React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/features/auth/hooks/use-auth';
import { Button } from '@/components/ui/button';

export function HeaderUser() {
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const { mutate: logout, isPending } = useLogout();

  if (!isInitialized) {
    return null;
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground hidden sm:inline">
          {user.name}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => logout()}
          disabled={isPending}
        >
          {isPending ? 'Logging out...' : 'Log out'}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/login">
        <Button variant="ghost" size="sm">
          Sign In
        </Button>
      </Link>
    </div>
  );
}
