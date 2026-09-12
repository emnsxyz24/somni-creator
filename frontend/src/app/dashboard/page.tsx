'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';
import { AuthGuard } from '@/features/auth/components/auth-guard';
import { useAuthStore } from '@/stores/auth-store';
import { useLogout } from '@/features/auth/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function DashboardContent() {
  const user = useAuthStore((state) => state.user);
  const { mutate: logout, isPending } = useLogout();

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {user?.role || 'CREATOR'}
            </span>
          </div>
          <CardTitle className="text-2xl mt-2">
            Welcome back, {user?.name || 'Creator'}!
          </CardTitle>
          <CardDescription>
            You are authenticated as {user?.email}. This is your protected Somni Creator workspace.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-3">
          <Link
            href="/brands"
            className="flex items-center justify-between rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Building2 className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Brand Directory</p>
                <p className="text-xs text-muted-foreground">
                  View and manage sponsor and partner contacts
                </p>
              </div>
            </div>
            <ArrowRight className="size-4 text-muted-foreground" />
          </Link>
        </CardContent>

        <CardFooter className="flex justify-between border-t border-border pt-4">
          <span className="text-xs text-muted-foreground">
            Status: Authenticated
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout()}
            disabled={isPending}
          >
            {isPending ? 'Logging out...' : 'Sign Out'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
