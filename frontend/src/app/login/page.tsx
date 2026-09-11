import Link from 'next/link';

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Sign In</h1>
      <p className="mt-2 text-sm">
        Authentication view placeholder for Somni Creator.
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
