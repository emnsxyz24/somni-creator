import { RegisterForm } from '@/features/auth/components/register-form';

export default function RegisterPage() {
  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-6">
      <RegisterForm />
    </main>
  );
}
