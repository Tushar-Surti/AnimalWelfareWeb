'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, PartyPopper, Lock } from 'lucide-react';
import { adoptionApplicationSchema } from '@aww/shared';
import type { Animal } from '@aww/shared';
import { api, ApiError } from '@/lib/api';
import { useSession } from '@/hooks/use-session';
import { Input, Textarea, Select } from '@/components/ui/field';
import { Button, ButtonLink } from '@/components/ui/button';

const APPLIED_COPY: Record<string, { title: string; body: string }> = {
  submitted: { title: 'Your application is in.', body: 'The shelter will be in touch soon. Watch your dashboard.' },
  reviewing: { title: 'They are reading it now.', body: 'Someone at the shelter has opened your application.' },
  approved: { title: 'You matched!', body: 'The shelter approved your application. Check your dashboard for next steps.' },
  rejected: { title: 'This one went elsewhere.', body: 'It happens. There are others here who need you just as much.' },
};

export function AdoptForm({ animal }: { animal: Animal }) {
  const router = useRouter();
  const { user, token, loading } = useSession();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    homeType: '',
    household: '',
    hasOtherPets: false,
    otherPets: '',
    experience: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  if (loading) return <div className="h-14 animate-pulse rounded-2xl bg-cream-deep" />;

  if (animal.status !== 'available') {
    return (
      <div className="rounded-[1.75rem] border-2 border-sage bg-sage-soft p-6 text-center">
        <PartyPopper className="mx-auto size-9 text-sage-deep" />
        <p className="mt-3 font-display text-lg font-semibold text-sage-deep">
          {animal.name} found their people.
        </p>
        <ButtonLink href="/adopt" variant="sage" className="mt-4">
          Meet someone else
        </ButtonLink>
      </div>
    );
  }

  const existing = animal.applicationStatus;
  if (sent || (existing && existing !== 'withdrawn')) {
    const copy = APPLIED_COPY[sent ? 'submitted' : (existing as string)] ?? APPLIED_COPY.submitted!;
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-[1.75rem] border-2 border-sage-deep bg-paper p-6 text-center shadow-[0.35rem_0.35rem_0_var(--color-sage-deep)]"
      >
        <Heart className="mx-auto size-9 fill-blush text-blush" />
        <p className="mt-3 font-display text-lg font-semibold">{copy.title}</p>
        <p className="mt-1.5 text-sm text-ink-soft">{copy.body}</p>
        <ButtonLink href="/dashboard/applications" variant="paper" size="sm" className="mt-4">
          View my applications
        </ButtonLink>
      </motion.div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-[1.75rem] border-2 border-line bg-paper p-6 text-center">
        <Lock className="mx-auto size-8 text-ink-faint" />
        <p className="mt-3 font-display text-lg font-semibold">Sign in to apply</p>
        <p className="mt-1.5 text-sm text-ink-soft">
          Shelters need a way to reach you — and you will want somewhere to track the reply.
        </p>
        <ButtonLink href={`/sign-in?next=/adopt/${animal.id}`} size="lg" className="mt-5 w-full">
          Sign in to meet {animal.name}
        </ButtonLink>
      </div>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    const parsed = adoptionApplicationSchema.safeParse({
      ...form,
      homeType: form.homeType || undefined,
      hasOtherPets: form.hasOtherPets,
    });
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
      await api.post(`/api/animals/${animal.id}/apply`, parsed.data, { token });
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
    <div className="rounded-[1.75rem] border-2 border-blush bg-blush-soft p-6">
      <p className="font-display text-lg font-semibold text-blush-deep">
        Think you could be {animal.name}&apos;s person?
      </p>
      <p className="mt-1.5 text-sm text-blush-deep/80">
        Tell the shelter a bit about your home. They read every one of these.
      </p>

      <AnimatePresence initial={false}>
        {!open ? (
          <Button
            key="open"
            size="lg"
            className="mt-5 w-full"
            onClick={() => {
              setOpen(true);
              setForm((prev) => ({
                ...prev,
                fullName: prev.fullName || user.profile.fullName || '',
                email: prev.email || user.email,
                phone: prev.phone || user.profile.phone || '',
              }));
            }}
          >
            <Heart className="size-5" />
            Start an application
          </Button>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-5 space-y-4 overflow-hidden"
            onSubmit={submit}
          >
            <Input label="Your name" value={form.fullName} onChange={set('fullName')} error={errors.fullName} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Phone" inputMode="tel" value={form.phone} onChange={set('phone')} error={errors.phone} required />
              <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} required />
            </div>

            <Select label="Where do you live?" value={form.homeType} onChange={set('homeType')} error={errors.homeType}>
              <option value="">Choose one</option>
              <option value="apartment">Apartment / flat</option>
              <option value="independent_house">Independent house</option>
              <option value="farm">Farm or large plot</option>
              <option value="other">Something else</option>
            </Select>

            <Input
              label="Who else lives with you?"
              placeholder="Two adults, one 6-year-old"
              value={form.household}
              onChange={set('household')}
              error={errors.household}
            />

            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-line bg-paper px-4 py-3">
              <input
                type="checkbox"
                checked={form.hasOtherPets}
                onChange={(e) => setForm((prev) => ({ ...prev, hasOtherPets: e.target.checked }))}
                className="size-5 accent-[var(--color-blush)]"
              />
              <span className="font-display text-sm font-semibold">I already have other pets</span>
            </label>

            {form.hasOtherPets && (
              <Input
                label="Tell us about them"
                placeholder="One 4-year-old indie dog, very social"
                value={form.otherPets}
                onChange={set('otherPets')}
                error={errors.otherPets}
              />
            )}

            <Textarea
              label={`Why ${animal.name}?`}
              placeholder="Say hello, and tell them what your day-to-day looks like."
              value={form.message}
              onChange={set('message')}
              error={errors.message}
              rows={4}
              required
            />

            {errors._ && <p className="text-sm font-semibold text-critical-deep">{errors._}</p>}

            <Button type="submit" size="lg" className="w-full" loading={busy}>
              Send my application
            </Button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
