'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Heart, PartyPopper } from 'lucide-react';
import { donationSchema, formatCurrency } from '@aww/shared';
import type { Campaign } from '@aww/shared';
import { api, ApiError } from '@/lib/api';
import { useSession } from '@/hooks/use-session';
import { Input, Textarea } from '@/components/ui/field';
import { Button } from '@/components/ui/button';

const PRESETS = [250, 500, 1000, 2500];

type Intent = { donation: { id: string }; next: { confirmUrl: string } };

/**
 * Donation flow.
 *
 * Two steps on purpose: the API records a `pending` donation, then confirms it.
 * Right now the confirm step fires immediately with a generated reference —
 * dropping Razorpay or Stripe in means opening their checkout between the two
 * calls and letting the webhook do the confirming, with no schema change.
 */
export function DonateForm({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const { user, token } = useSession();

  const [amount, setAmount] = useState(500);
  const [custom, setCustom] = useState('');
  const [form, setForm] = useState({
    donorName: user?.profile.fullName ?? '',
    donorEmail: user?.email ?? '',
    message: '',
  });
  const [anonymous, setAnonymous] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const closed = campaign.status === 'closed';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    const finalAmount = custom ? Number(custom) : amount;
    const parsed = donationSchema.safeParse({
      amount: finalAmount,
      donorName: form.donorName || undefined,
      donorEmail: form.donorEmail || undefined,
      message: form.message || undefined,
      anonymous,
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
      const intent = await api.post<Intent>(`/api/campaigns/${campaign.id}/donate`, parsed.data, { token });

      // ── Payment gateway goes here ──────────────────────────────────────
      // Open the provider's checkout with intent.donation.id as the receipt
      // reference, and let their webhook call the confirm endpoint instead.
      await api.post(`/api/campaigns/${campaign.id}/donations/${intent.donation.id}/confirm`, {
        reference: `manual-${intent.donation.id.slice(0, 8)}`,
      });

      setDone(true);
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

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 140, damping: 15 }}
        className="rounded-[1.75rem] border-2 border-sage-deep bg-paper p-7 text-center shadow-[0.35rem_0.35rem_0_var(--color-sage-deep)]"
      >
        <PartyPopper className="mx-auto size-10 text-sage-deep" />
        <p className="mt-3 font-display text-xl font-semibold">Thank you, genuinely.</p>
        <p className="mt-2 text-sm text-ink-soft">
          Your {formatCurrency(custom ? Number(custom) : amount)} is on its way to {campaign.organization?.name ?? 'the shelter'}.
          A receipt is heading to your inbox.
        </p>
      </motion.div>
    );
  }

  if (closed) {
    return (
      <div className="rounded-[1.75rem] border-2 border-line bg-cream-deep p-6 text-center text-ink-soft">
        This campaign has closed. Thank you to everyone who gave.
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-[1.75rem] border-2 border-butter bg-butter-soft p-6">
      <div>
        <span className="block font-display font-semibold text-butter-deep">Pick an amount</span>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {PRESETS.map((preset) => (
            <motion.button
              key={preset}
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setAmount(preset);
                setCustom('');
              }}
              aria-pressed={!custom && amount === preset}
              className={`rounded-2xl border-2 py-3 font-display font-bold transition-colors ${
                !custom && amount === preset
                  ? 'border-butter-deep bg-butter text-ink'
                  : 'border-butter/40 bg-paper text-ink-soft hover:border-butter'
              }`}
            >
              {formatCurrency(preset)}
            </motion.button>
          ))}
        </div>
        <Input
          className="mt-3"
          type="number"
          inputMode="numeric"
          placeholder="Or enter your own amount"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          error={errors.amount}
        />
      </div>

      <div className="grid gap-3">
        <Input
          label="Your name"
          placeholder="Aditi Sharma"
          value={form.donorName}
          onChange={(e) => setForm((p) => ({ ...p, donorName: e.target.value }))}
          error={errors.donorName}
        />
        <Input
          label="Email for the receipt"
          type="email"
          placeholder="you@example.com"
          value={form.donorEmail}
          onChange={(e) => setForm((p) => ({ ...p, donorEmail: e.target.value }))}
          error={errors.donorEmail}
          required
        />
        <Textarea
          label="Leave a note (optional)"
          placeholder="Get well soon, little one."
          rows={2}
          value={form.message}
          onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
          error={errors.message}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-butter/40 bg-paper px-4 py-3">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => setAnonymous(e.target.checked)}
          className="size-5 accent-[var(--color-butter-deep)]"
        />
        <span className="font-display text-sm font-semibold">Give anonymously</span>
      </label>

      {errors._ && <p className="text-sm font-semibold text-critical-deep">{errors._}</p>}

      <Button type="submit" variant="butter" size="lg" className="w-full" loading={busy}>
        <Heart className="size-5" />
        Give {formatCurrency(custom ? Number(custom) || 0 : amount)}
      </Button>

      <p className="text-center text-xs text-butter-deep/80">
        Goes directly to {campaign.organization?.name ?? 'the shelter'} · You get a receipt by email
      </p>
    </form>
  );
}
