'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/forms/auth-shell';

function SignInForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const { error: authError } = await supabase().auth.signInWithPassword({ email, password });

    if (authError) {
      // Supabase says "Invalid login credentials" for both a wrong password and
      // an unknown email — on purpose, so the form cannot be used to discover
      // who has an account. Keep that property, just say it kindly.
      setError(
        authError.message === 'Invalid login credentials'
          ? 'That email and password do not match. Try again?'
          : authError.message,
      );
      setBusy(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <AuthShell
      title="Welcome back."
      subtitle="Your dashboard, your reports, and everyone you have been following."
      quote="Sixty seconds of your time is a whole life to somebody."
      footer={
        <>
          New here?{' '}
          <Link href="/sign-up" className="font-semibold text-blush underline underline-offset-4">
            Make an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="rounded-2xl border-2 border-critical bg-critical-soft px-4 py-3 text-sm font-semibold text-critical-deep">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}

export default function SignInPage() {
  // useSearchParams needs a suspense boundary to keep the route static.
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <SignInForm />
    </Suspense>
  );
}
