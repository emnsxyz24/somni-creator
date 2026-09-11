import type { Metadata } from 'next';
import Link from 'next/link';
import { ThemeProvider } from '@/components/theme-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { QueryProvider } from '@/components/query-provider';
import { HeaderUser } from '@/components/header-user';
import './globals.css';

export const metadata: Metadata = {
  title: 'Somni Creator',
  description: 'Personal deal management OS for content creators',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <header className="flex h-14 items-center justify-between border-b border-border px-6">
              <Link href="/" className="font-semibold tracking-tight">
                Somni Creator
              </Link>
              <div className="flex items-center gap-3">
                <HeaderUser />
                <ThemeToggle />
              </div>
            </header>
            {children}
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
