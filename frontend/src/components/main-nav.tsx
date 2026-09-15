'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from 'cn';

export function MainNav() {
  const { isAuthenticated, isInitialized } = useAuthStore();
  const pathname = usePathname();

  if (!isInitialized || !isAuthenticated) {
    return null;
  }

  const routes = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/deals', label: 'Deals' },
    { href: '/brands', label: 'Brands' },
  ];

  return (
    <nav className="flex items-center gap-1 sm:gap-2 ml-4 sm:ml-6">
      {routes.map((route) => {
        const isActive =
          pathname === route.href || pathname.startsWith(`${route.href}/`);
        return (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
              isActive
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
            )}
          >
            {route.label}
          </Link>
        );
      })}
    </nav>
  );
}
