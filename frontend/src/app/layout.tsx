import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Somni Creator',
  description: 'Personal deal management OS for content creators',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
