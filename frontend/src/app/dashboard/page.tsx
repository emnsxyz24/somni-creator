import Link from 'next/link';

export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p className="mt-2 text-sm">
        Workspace placeholder for managing brand partnerships.
      </p>
      <div className="mt-6">
        <Link
          href="/"
          className="text-sm font-medium underline underline-offset-4"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
