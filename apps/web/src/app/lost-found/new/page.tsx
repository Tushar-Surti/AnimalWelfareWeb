'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Megaphone, HandHeart } from 'lucide-react';
import { lostFoundSchema, SPECIES, SPECIES_LABEL, SPECIES_EMOJI, SEX } from '@aww/shared';
import type { LostFoundPost, Species, Sex, PostKind } from '@aww/shared';
import { api, ApiError } from '@/lib/api';
import { useSession } from '@/hooks/use-session';
import type { Coords } from '@/hooks/use-geolocation';
import { Input, Textarea, ChipGroup, Select } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { PhotoUpload } from '@/components/forms/photo-upload';
import { LocationPicker } from '@/components/map/location-picker';
import { DoodleField } from '@/components/ui/doodles';

const KINDS: Array<{ value: PostKind; title: string; body: string; icon: typeof Megaphone; tone: string }> = [
  {
    value: 'lost',
    title: 'I lost my pet',
    body: 'Get the word out to everyone within a few kilometres.',
    icon: Megaphone,
    tone: 'border-lilac-deep bg-lilac text-white',
  },
  {
    value: 'found',
    title: 'I found a pet',
    body: 'Somebody is out there looking for them right now.',
    icon: HandHeart,
    tone: 'border-sky-deep bg-sky text-ink',
  },
];

export default function NewLostFoundPage() {
  const router = useRouter();
  const { token, user } = useSession();

  const [kind, setKind] = useState<PostKind>('lost');
  const [species, setSpecies] = useState<Species[]>(['dog']);
  const [sex, setSex] = useState<Sex>('unknown');
  const [photos, setPhotos] = useState<string[]>([]);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [form, setForm] = useState({
    petName: '',
    breed: '',
    colour: '',
    description: '',
    distinguishing: '',
    // Datetime-local wants "YYYY-MM-DDTHH:mm" in local time, which is what
    // toISOString() does *not* give you — so build it from the local parts.
    seenAt: new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16),
    address: '',
    city: '',
    pincode: '',
    contactName: user?.profile.fullName ?? '',
    contactPhone: user?.profile.phone ?? '',
    reward: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    if (!coords) {
      setErrors({ lat: kind === 'lost' ? 'Where did you last see them?' : 'Where did you find them?' });
      return;
    }

    const parsed = lostFoundSchema.safeParse({
      ...form,
      kind,
      species: species[0] ?? 'other',
      sex,
      photos,
      lat: coords.lat,
      lng: coords.lng,
      reward: form.reward ? Number(form.reward) : undefined,
      seenAt: new Date(form.seenAt),
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
      const post = await api.post<LostFoundPost>('/api/lost-found', parsed.data, { token });
      router.push(`/lost-found/${post.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        setErrors(Object.fromEntries(Object.entries(error.fields).map(([k, v]) => [k, v[0] ?? ''])));
      } else {
        setErrors({ _: (error as Error).message });
      }
      setBusy(false);
    }
  }

  const lost = kind === 'lost';

  return (
    <div>
      <section className="relative overflow-hidden px-6 pb-6 pt-32">
        <DoodleField className="opacity-60" />
        <div className="relative mx-auto max-w-2xl text-center">
          <h1 className="font-display text-[clamp(2.25rem,5.5vw,3.5rem)] font-semibold">
            Post to the board
          </h1>
          <p className="mt-4 text-lg text-ink-soft">
            The faster this goes up, the smaller the search radius stays.
          </p>
        </div>
      </section>

      <form onSubmit={submit} className="mx-auto max-w-2xl space-y-8 px-6 pb-24">
        <div className="grid gap-3 sm:grid-cols-2">
          {KINDS.map((option) => (
            <motion.button
              key={option.value}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => setKind(option.value)}
              aria-pressed={kind === option.value}
              className={`rounded-[1.75rem] border-2 p-6 text-left transition-all ${
                kind === option.value ? option.tone : 'border-line bg-paper text-ink-soft hover:border-line-strong'
              }`}
            >
              <option.icon className="size-7" />
              <span className="mt-3 block font-display text-xl font-semibold">{option.title}</span>
              <span className="mt-1 block text-sm opacity-90">{option.body}</span>
            </motion.button>
          ))}
        </div>

        <div className="space-y-6 rounded-[2rem] border-2 border-line bg-paper p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold">About the pet</h2>

          <PhotoUpload
            bucket="lostfound"
            value={photos}
            onChange={setPhotos}
            max={6}
            label="Photos"
            hint="This is the single most useful thing on the whole post. Add every clear photo you have."
            error={errors.photos}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={lost ? "Pet's name" : 'Name on the collar, if any'}
              placeholder={lost ? 'Momo' : 'Leave blank if unknown'}
              value={form.petName}
              onChange={set('petName')}
              error={errors.petName}
            />
            <Input
              label="Breed"
              placeholder="Indie / Labrador mix"
              value={form.breed}
              onChange={set('breed')}
              error={errors.breed}
            />
            <Input
              label="Colour and markings"
              placeholder="Tan with a white chest patch"
              value={form.colour}
              onChange={set('colour')}
              error={errors.colour}
            />
            <Select label="Sex" value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
              {SEX.map((s) => (
                <option key={s} value={s}>
                  {s === 'unknown' ? 'Not sure' : s}
                </option>
              ))}
            </Select>
          </div>

          <ChipGroup
            label="Species"
            multiple={false}
            options={SPECIES.map((s) => ({ value: s, label: SPECIES_LABEL[s], emoji: SPECIES_EMOJI[s] }))}
            value={species}
            onChange={(next) => setSpecies(next.length ? next : ['other'])}
          />

          <Textarea
            label={lost ? 'Tell us about them' : 'Describe the pet you found'}
            placeholder={
              lost
                ? 'Very friendly, answers to Momo, wearing a red collar with a bell. Scared of traffic.'
                : 'Young female, well-fed so probably somebody’s pet, wearing a blue collar with no tag.'
            }
            value={form.description}
            onChange={set('description')}
            error={errors.description}
            rows={4}
            required
          />

          <Input
            label="Anything distinctive?"
            placeholder="Notch in the left ear, limps slightly on the back left"
            hint="The detail that makes a match certain rather than probable."
            value={form.distinguishing}
            onChange={set('distinguishing')}
            error={errors.distinguishing}
          />
        </div>

        <div className="space-y-6 rounded-[2rem] border-2 border-line bg-paper p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold">
            {lost ? 'Where did you last see them?' : 'Where did you find them?'}
          </h2>

          <LocationPicker value={coords} onChange={setCoords} error={errors.lat} />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={lost ? 'When did they go missing?' : 'When did you find them?'}
              type="datetime-local"
              value={form.seenAt}
              onChange={set('seenAt')}
              error={errors.seenAt}
              required
            />
            <Input label="Area" placeholder="Koregaon Park" value={form.address} onChange={set('address')} />
            <Input label="City" placeholder="Pune" value={form.city} onChange={set('city')} error={errors.city} />
            <Input
              label="Pincode"
              inputMode="numeric"
              maxLength={6}
              placeholder="411001"
              value={form.pincode}
              onChange={set('pincode')}
              error={errors.pincode}
            />
          </div>
        </div>

        <div className="space-y-6 rounded-[2rem] border-2 border-line bg-paper p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold">How can people reach you?</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Your name" value={form.contactName} onChange={set('contactName')} error={errors.contactName} />
            <Input
              label="Phone number"
              inputMode="tel"
              placeholder="98765 43210"
              value={form.contactPhone}
              onChange={set('contactPhone')}
              error={errors.contactPhone}
              required
            />
            {lost && (
              <Input
                label="Reward (optional)"
                type="number"
                inputMode="numeric"
                placeholder="2000"
                hint="Entirely optional, and never required for someone to help."
                value={form.reward}
                onChange={set('reward')}
                error={errors.reward}
              />
            )}
          </div>
          <p className="text-sm text-ink-soft">
            On this board your number <strong>is</strong> shown publicly — that is how someone who spots
            your pet reaches you in the moment.
          </p>
        </div>

        {errors._ && (
          <p className="rounded-2xl border-2 border-critical bg-critical-soft px-5 py-4 font-semibold text-critical-deep">
            {errors._}
          </p>
        )}

        <Button type="submit" variant={lost ? 'lilac' : 'sky'} size="lg" loading={busy}>
          {lost ? 'Post missing pet' : 'Post found pet'}
        </Button>
      </form>
    </div>
  );
}
