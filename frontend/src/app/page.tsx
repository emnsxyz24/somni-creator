import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight">Somni Creator</h1>
      <p className="mt-3 max-w-md text-base">
        Personal operating system for managing brand deals, deliverables, and invoices.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/login"
          className="rounded-md px-4 py-2 text-sm font-medium underline underline-offset-4"
        >
          Go to Login
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md px-4 py-2 text-sm font-medium underline underline-offset-4"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
