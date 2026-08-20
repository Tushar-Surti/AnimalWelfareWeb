'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { HandHeart, PartyPopper, Lock, Users } from 'lucide-react';
import { volunteerApplicationSchema, pluralize } from '@aww/shared';
import type { VolunteerOpportunity, ApplicationStatus } from '@aww/shared';
import { api, ApiError } from '@/lib/api';
import { useSession } from '@/hooks/use-session';
import { Input, Textarea } from '@/components/ui/field';
import { Button, ButtonLink } from '@/components/ui/button';

type Props = { opportunity: VolunteerOpportunity & { applicationStatus?: ApplicationStatus | null } };

export function VolunteerSignupForm({ opportunity }: Props) {
  const router = useRouter();
  const { user, token, loading } = useSession();
  const [form, setForm] = useState({ fullName: '', phone: '', email: '', message: '', availability: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const spotsLeft = Math.max(0, opportunity.slots - opportunity.filled);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  if (loading) return <div className="h-40 animate-pulse rounded-[1.75rem] bg-cream-deep" />;

  if (sent || opportunity.applicationStatus) {
    const status = sent ? 'submitted' : opportunity.applicationStatus;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-[1.75rem] border-2 border-sage-deep bg-paper p-7 text-center shadow-[0.35rem_0.35rem_0_var(--color-sage-deep)]"
      >
        <PartyPopper className="mx-auto size-10 text-sage-deep" />
        <p className="mt-3 font-display text-xl font-semibold">
          {status === 'approved' ? 'You are in!' : 'Signed up.'}
        </p>
        <p className="mt-2 text-sm text-ink-soft">
          {status === 'approved'
            ? 'The organization confirmed you. They will be in touch with the details.'
            : 'The organization will confirm shortly. Watch your dashboard.'}
        </p>
        <ButtonLink href="/dashboard" variant="paper" size="sm" className="mt-4">
          Go to dashboard
        </ButtonLink>
      </motion.div>
    );
  }

  if (opportunity.status !== 'open' || spotsLeft === 0) {
    return (
      <div className="rounded-[1.75rem] border-2 border-line bg-cream-deep p-6 text-center text-ink-soft">
        <Users className="mx-auto size-8 text-ink-faint" />
        <p className="mt-3 font-display font-semibold text-ink">All spots are taken</p>
        <p className="mt-1.5 text-sm">Plenty of other shelters need hands right now.</p>
        <ButtonLink href="/volunteer" variant="paper" size="sm" className="mt-4">
          See other opportunities
        </ButtonLink>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-[1.75rem] border-2 border-line bg-paper p-6 text-center">
        <Lock className="mx-auto size-8 text-ink-faint" />
        <p className="mt-3 font-display text-lg font-semibold">Sign in to volunteer</p>
        <p className="mt-1.5 text-sm text-ink-soft">
          The organization needs a way to reach you before the day itself.
        </p>
        <ButtonLink href={`/sign-in?next=/volunteer/${opportunity.id}`} size="lg" className="mt-5 w-full">
          Sign in
        </ButtonLink>
      </div>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    const parsed = volunteerApplicationSchema.safeParse(form);
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
    try {
      await api.post(`/api/volunteers/${opportunity.id}/apply`, parsed.data, { token });
      setSent(true);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        setErrors(Object.fromEntries(Object.entries(error.fields).map(([k, v]) => [k, v[0] ?? ''])));
      } else {
        setErrors({ _: (error as Error).message });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-[1.75rem] border-2 border-sage bg-sage-soft p-6">
      <div>
        <p className="font-display text-lg font-semibold text-sage-deep">Count me in</p>
        <p className="mt-1 text-sm text-sage-deep/80">
          {pluralize(spotsLeft, 'spot')} left. No commitment beyond what is described.
        </p>
      </div>

      <Input
        label="Your name"
        value={form.fullName || user.profile.fullName || ''}
        onChange={set('fullName')}
        error={errors.fullName}
        required
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label="Phone"
          inputMode="tel"
          value={form.phone || user.profile.phone || ''}
          onChange={set('phone')}
          error={errors.phone}
          required
        />
        <Input
          label="Email"
          type="email"
          value={form.email || user.email}
          onChange={set('email')}
          error={errors.email}
          required
        />
      </div>
      <Input
        label="When are you free?"
        placeholder="Most weekends, and weekday evenings after 7"
        value={form.availability}
        onChange={set('availability')}
        error={errors.availability}
      />
      <Textarea
        label="Anything they should know?"
        placeholder="I have a hatchback and I am comfortable handling nervous dogs."
        rows={3}
        value={form.message}
        onChange={set('message')}
        error={errors.message}
      />

      {errors._ && <p className="text-sm font-semibold text-critical-deep">{errors._}</p>}

      <Button type="submit" variant="sage" size="lg" className="w-full" loading={busy}>
        <HandHeart className="size-5" />
        Sign me up
      </Button>
    </form>
  );
}
