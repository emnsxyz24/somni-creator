import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function HomePage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Somni Creator</CardTitle>
          <CardDescription>
            Personal operating system for managing brand deals, deliverables, and invoices.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center gap-3">
          <Link href="/login">
            <Button variant="default">Go to Login</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline">Go to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
