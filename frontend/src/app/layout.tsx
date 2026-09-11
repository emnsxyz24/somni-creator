import type { Metadata } from 'next';
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
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
