import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function LoginPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-6">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-xl">Sign In</CardTitle>
          <CardDescription>
            Authentication view placeholder for Somni Creator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/">
            <Button variant="outline" size="sm">
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
