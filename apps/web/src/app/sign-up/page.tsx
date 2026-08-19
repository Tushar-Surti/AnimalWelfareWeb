'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import { signUpSchema } from '@aww/shared';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/field';
import { Button, ButtonLink } from '@/components/ui/button';
import { AuthShell } from '@/components/forms/auth-shell';

function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  // /sign-up?role=ngo comes from the "list your shelter" calls to action.
  const asNgo = params.get('role') === 'ngo';

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    const parsed = signUpSchema.safeParse({ ...form, role: asNgo ? 'ngo' : 'citizen' });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.');
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }

    setBusy(true);
    const { data, error } = await supabase().auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        // Read by the handle_new_user trigger, which creates the profile row.
        data: {
          full_name: parsed.data.fullName,
          role: parsed.data.role,
          phone: parsed.data.phone ?? '',
        },
        // Must point at the callback route — the confirmation link comes back
        // as a PKCE code that needs exchanging before a session exists.
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${
          parsed.data.role === 'ngo' ? '/organizations/new' : '/dashboard'
        }`,
      },
    });

    if (error) {
      setErrors({ _: error.message });
      setBusy(false);
      return;
    }

    // With email confirmation on, there is no session yet — say so instead of
    // bouncing to a dashboard that will kick them straight back out.
    if (!data.session) {
      setCheckEmail(true);
      setBusy(false);
      return;
    }

    router.push(asNgo ? '/organizations/new' : '/dashboard');
    router.refresh();
  }

  if (checkEmail) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-md rounded-[2.5rem] border-2 border-sage-deep bg-paper p-10 text-center shadow-[0.5rem_0.5rem_0_var(--color-sage-deep)]">
          <span className="mx-auto grid size-16 place-items-center rounded-full border-2 border-sage-deep bg-sage text-white">
            <MailCheck className="size-8" />
          </span>
          <h1 className="mt-5 font-display text-2xl font-semibold">Check your inbox</h1>
          <p className="mt-3 text-ink-soft">
            We sent a confirmation link to <strong className="text-ink">{form.email}</strong>. Click it
            and you are in.
          </p>
          <ButtonLink href="/rescues" variant="paper" className="mt-6">
            Browse rescues meanwhile
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <AuthShell
      title={asNgo ? 'Register your shelter.' : 'Join the helpers.'}
      subtitle={
        asNgo
          ? 'Claim rescues near you, list animals for adoption, and raise funds for treatment.'
          : 'Follow your reports to the end, save favourites, and hear back on applications.'
      }
      photo={asNgo ? '/photos/dog.jpg' : '/photos/cat.png'}
      quote={asNgo ? 'The nearest shelter should always be the first to know.' : 'Every paw deserves a pal.'}
      footer={
        <>
          Already have an account?{' '}
          <Link href="/sign-in" className="font-semibold text-blush underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <Input
          label="Your name"
          placeholder="Aditi Sharma"
          value={form.fullName}
          onChange={set('fullName')}
          error={errors.fullName}
          autoComplete="name"
          required
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
          autoComplete="email"
          required
        />
        <Input
          label="Phone"
          type="tel"
          inputMode="tel"
          placeholder="98765 43210"
          value={form.phone}
          onChange={set('phone')}
          error={errors.phone}
          hint="So rescuers can reach you about your reports."
          autoComplete="tel"
        />
        <Input
          label="Password"
          type="password"
          placeholder="At least 8 characters"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          autoComplete="new-password"
          required
        />

        {errors._ && (
          <p className="rounded-2xl border-2 border-critical bg-critical-soft px-4 py-3 text-sm font-semibold text-critical-deep">
            {errors._}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={busy}>
          {asNgo ? 'Create shelter account' : 'Create my account'}
        </Button>

        {!asNgo && (
          <p className="text-center text-sm text-ink-faint">
            Running a shelter?{' '}
            <Link href="/sign-up?role=ngo" className="font-semibold text-blush underline underline-offset-4">
              Register as an organization
            </Link>
          </p>
        )}
      </form>
    </AuthShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <SignUpForm />
    </Suspense>
  );
}
