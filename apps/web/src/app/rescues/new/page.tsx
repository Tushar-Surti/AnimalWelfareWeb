'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Siren, ArrowRight, PartyPopper } from 'lucide-react';
import { createRescueSchema, SPECIES, SPECIES_LABEL, SPECIES_EMOJI, URGENCY, URGENCY_LABEL } from '@aww/shared';
import type { Rescue, Species, Urgency } from '@aww/shared';
import { api, ApiError } from '@/lib/api';
import { useSession } from '@/hooks/use-session';
import type { Coords } from '@/hooks/use-geolocation';
import { Input, Textarea, ChipGroup } from '@/components/ui/field';
import { Button, ButtonLink } from '@/components/ui/button';
import { PhotoUpload } from '@/components/forms/photo-upload';
import { LocationPicker } from '@/components/map/location-picker';
import { DoodleField, Paw } from '@/components/ui/doodles';

const URGENCY_STYLE: Record<Urgency, string> = {
  critical: 'border-critical-deep bg-critical text-white',
  urgent: 'border-peach-deep bg-peach text-ink',
  stable: 'border-sage-deep bg-sage text-white',
};

export default function ReportPage() {
  const router = useRouter();
  const { token, user } = useSession();

  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    landmark: '',
    city: '',
    pincode: '',
    contactName: user?.profile.fullName ?? '',
    contactPhone: user?.profile.phone ?? '',
  });
  const [species, setSpecies] = useState<Species[]>(['dog']);
  const [urgency, setUrgency] = useState<Urgency>('urgent');
  const [photos, setPhotos] = useState<string[]>([]);
  const [coords, setCoords] = useState<Coords | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Rescue | null>(null);

  const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    if (!coords) {
      setErrors({ lat: 'Drop a pin so rescuers know where to go.' });
      document.getElementById('location')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Validate client-side first: the same schema the API uses, so the messages
    // are identical whichever side rejects it.
    const parsed = createRescueSchema.safeParse({
      ...form,
      species: species[0] ?? 'other',
      urgency,
      photos,
      lat: coords.lat,
      lng: coords.lng,
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

    setSubmitting(true);
    try {
      const rescue = await api.post<Rescue>('/api/rescues', parsed.data, { token });
      setDone(rescue);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        setErrors(Object.fromEntries(Object.entries(error.fields).map(([k, v]) => [k, v[0] ?? ''])));
      } else {
        setErrors({ _: (error as Error).message });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="relative px-6 py-32">
        <DoodleField />
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 140, damping: 16 }}
          className="relative mx-auto max-w-xl rounded-[2.5rem] border-2 border-sage-deep bg-paper p-10 text-center shadow-[0.5rem_0.5rem_0_var(--color-sage-deep)]"
        >
          <span className="mx-auto grid size-20 place-items-center rounded-full border-2 border-sage-deep bg-sage text-white">
            <PartyPopper className="size-10" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-semibold">You did a good thing.</h1>
          <p className="mt-3 text-ink-soft">
            Report <strong className="font-semibold text-ink">{done.reference}</strong> is live. Every
            shelter within range can see it right now, and you can follow it to the end.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href={`/rescues/${done.id}`} variant="sage" size="lg">
              Follow this rescue
              <ArrowRight className="size-5" />
            </ButtonLink>
            <ButtonLink href="/rescues" variant="paper" size="lg">
              See others nearby
            </ButtonLink>
          </div>
          {!user && (
            <p className="mt-6 text-sm text-ink-faint">
              Tip: <a href="/sign-up" className="font-semibold text-blush underline underline-offset-4">make an account</a>{' '}
              and we will notify you the moment this one is picked up.
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="relative">
      <section className="relative overflow-hidden px-6 pb-6 pt-32">
        <DoodleField className="opacity-60" />
        <div className="relative mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-critical-deep bg-critical px-4 py-2 font-display text-sm font-semibold text-white">
            <Siren className="size-4" />
            Report an animal
          </span>
          <h1 className="mt-5 font-display text-[clamp(2.25rem,5.5vw,3.5rem)] font-semibold">
            Tell us what you can see.
          </h1>
          <p className="mt-4 text-lg text-ink-soft">
            No account needed. Six fields, one pin, and the nearest rescuers take it from here.
          </p>
        </div>
      </section>

      <form onSubmit={submit} className="mx-auto max-w-2xl space-y-8 px-6 pb-24">
        <div className="space-y-6 rounded-[2rem] border-2 border-line bg-paper p-6 sm:p-8">
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <Paw className="size-5 text-blush" />
            The animal
          </h2>

          <Input
            label="What is happening?"
            placeholder="Limping puppy near the bus depot"
            value={form.title}
            onChange={set('title')}
            error={errors.title}
            required
            maxLength={120}
          />

          <Textarea
            label="Describe what you see"
            placeholder="Small brown pup, back-right leg looks hurt, hiding under a parked auto. Been there about an hour."
            hint="Colour, size, injuries, whether it can walk — anything that helps a rescuer find and handle it."
            value={form.description}
            onChange={set('description')}
            error={errors.description}
            required
            rows={5}
          />

          <ChipGroup
            label="What kind of animal?"
            multiple={false}
            options={SPECIES.map((s) => ({ value: s, label: SPECIES_LABEL[s], emoji: SPECIES_EMOJI[s] }))}
            value={species}
            onChange={(next) => setSpecies(next.length ? next : ['other'])}
          />

          <div>
            <span className="mb-2 block font-display text-sm font-semibold">How urgent is it?</span>
            <div className="grid gap-2 sm:grid-cols-3">
              {URGENCY.map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setUrgency(level)}
                  aria-pressed={urgency === level}
                  className={`rounded-2xl border-2 p-4 text-left transition-all ${
                    urgency === level
                      ? URGENCY_STYLE[level]
                      : 'border-line bg-paper text-ink-soft hover:border-line-strong'
                  }`}
                >
                  <span className="block font-display font-bold capitalize">{level}</span>
                  <span className="mt-0.5 block text-xs opacity-90">{URGENCY_LABEL[level]}</span>
                </button>
              ))}
            </div>
          </div>

          <PhotoUpload
            bucket="rescues"
            value={photos}
            onChange={setPhotos}
            max={4}
            label="Photos"
            hint="A photo roughly triples the odds someone claims this in the first hour. Take one if it is safe to."
            error={errors.photos}
          />
        </div>

        <div id="location" className="space-y-6 rounded-[2rem] border-2 border-line bg-paper p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold">Where is it?</h2>

          <LocationPicker value={coords} onChange={setCoords} error={errors.lat} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nearest landmark"
              placeholder="Opposite the blue chai stall"
              value={form.landmark}
              onChange={set('landmark')}
              error={errors.landmark}
            />
            <Input
              label="Area or address"
              placeholder="Linking Road, Bandra West"
              value={form.address}
              onChange={set('address')}
              error={errors.address}
            />
            <Input label="City" placeholder="Mumbai" value={form.city} onChange={set('city')} error={errors.city} />
            <Input
              label="Pincode"
              placeholder="400050"
              inputMode="numeric"
              maxLength={6}
              value={form.pincode}
              onChange={set('pincode')}
              error={errors.pincode}
            />
          </div>
        </div>

        <div className="space-y-6 rounded-[2rem] border-2 border-line bg-paper p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold">How can a rescuer reach you?</h2>
          <p className="-mt-3 text-sm text-ink-soft">
            Your number is shown only to verified rescue organizations — never on the public page.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Your name"
              placeholder="Aditi"
              value={form.contactName}
              onChange={set('contactName')}
              error={errors.contactName}
            />
            <Input
              label="Phone number"
              placeholder="98765 43210"
              inputMode="tel"
              value={form.contactPhone}
              onChange={set('contactPhone')}
              error={errors.contactPhone}
              required
            />
          </div>
        </div>

        {errors._ && (
          <p className="rounded-2xl border-2 border-critical bg-critical-soft px-5 py-4 font-semibold text-critical-deep">
            {errors._}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" variant="critical" size="lg" loading={submitting}>
            <Siren className="size-5" />
            {submitting ? 'Sending…' : 'Send this report'}
          </Button>
          <p className="text-sm text-ink-faint">Takes about thirty seconds. Thank you for stopping.</p>
        </div>
      </form>
    </div>
  );
}
