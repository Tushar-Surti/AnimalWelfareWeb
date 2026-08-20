'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PawPrint, Building2 } from 'lucide-react';
import { createAnimalSchema, SPECIES, SPECIES_LABEL, SPECIES_EMOJI, SEX, SIZE } from '@aww/shared';
import type { Animal, Species, Sex, Size } from '@aww/shared';
import { api, ApiError } from '@/lib/api';
import { useSession } from '@/hooks/use-session';
import { Input, Textarea, Select, ChipGroup } from '@/components/ui/field';
import { Button, ButtonLink } from '@/components/ui/button';
import { PhotoUpload } from '@/components/forms/photo-upload';
import { DashboardShell, NeedsAuth } from '@/components/dashboard/shell';

const TRAITS = ['gentle', 'playful', 'shy', 'cuddly', 'independent', 'goofy', 'calm', 'curious', 'loyal', 'talkative'];
const GOOD_WITH = [
  { value: 'kids' as const, label: 'Kids' },
  { value: 'dogs' as const, label: 'Dogs' },
  { value: 'cats' as const, label: 'Cats' },
  { value: 'seniors' as const, label: 'Seniors' },
  { value: 'apartments' as const, label: 'Apartments' },
];

export default function NewAnimalPage() {
  const router = useRouter();
  const { user, token, loading } = useSession();

  const [orgId, setOrgId] = useState('');
  const [species, setSpecies] = useState<Species[]>(['dog']);
  const [sex, setSex] = useState<Sex>('unknown');
  const [size, setSize] = useState<Size | ''>('');
  const [personality, setPersonality] = useState<string[]>([]);
  const [goodWith, setGoodWith] = useState<Array<(typeof GOOD_WITH)[number]['value']>>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [flags, setFlags] = useState({ vaccinated: false, sterilised: false, dewormed: false, fosterOnly: false });
  const [form, setForm] = useState({
    name: '', breed: '', ageMonths: '', colour: '', story: '', specialNeeds: '', adoptionFee: '0',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  if (loading) return <div className="min-h-dvh" />;
  if (!user) return <NeedsAuth next="/dashboard/animals/new" />;

  const orgs = user.organizations;
  if (orgs.length === 0) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-md rounded-[2.5rem] border-2 border-line bg-paper p-10 text-center">
          <Building2 className="mx-auto size-10 text-ink-faint" />
          <h1 className="mt-4 font-display text-2xl font-semibold">Register a shelter first</h1>
          <p className="mt-3 text-ink-soft">
            Animals are always listed by an organization, so adopters know who is accountable for them.
          </p>
          <ButtonLink href="/organizations/new" size="lg" className="mt-6 w-full">
            List your shelter
          </ButtonLink>
        </div>
      </div>
    );
  }

  const activeOrg = orgId || orgs[0]!.id;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    const parsed = createAnimalSchema.safeParse({
      ...form,
      species: species[0] ?? 'dog',
      sex,
      size: size || undefined,
      ageMonths: form.ageMonths ? Number(form.ageMonths) : undefined,
      adoptionFee: Number(form.adoptionFee || 0),
      personality,
      goodWith,
      photos,
      ...flags,
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
      // Location is omitted on purpose — the API falls back to the
      // organization's own coordinates, which is right for almost every shelter.
      const animal = await api.post<Animal>('/api/animals', { ...parsed.data, orgId: activeOrg }, { token });
      router.push(`/adopt/${animal.id}`);
    } catch (error) {
      if (error instanceof ApiError && error.fields) {
        setErrors(Object.fromEntries(Object.entries(error.fields).map(([k, v]) => [k, v[0] ?? ''])));
      } else {
        setErrors({ _: (error as Error).message });
      }
      setBusy(false);
    }
  }

  return (
    <DashboardShell title="List a friend" subtitle="The better the story, the faster they go home.">
      <form onSubmit={submit} className="max-w-2xl space-y-8">
        {orgs.length > 1 && (
          <Select label="Listing on behalf of" value={activeOrg} onChange={(e) => setOrgId(e.target.value)}>
            {orgs.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </Select>
        )}

        <div className="space-y-6 rounded-[2rem] border-2 border-line bg-paper p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold">Who are they?</h2>

          <PhotoUpload
            bucket="animals"
            value={photos}
            onChange={setPhotos}
            max={8}
            label="Photos"
            hint="The first photo is the one people see on the board. Natural light, eye level, no cage bars if you can help it."
            error={errors.photos}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Name" placeholder="Momo" value={form.name} onChange={set('name')} error={errors.name} required />
            <Input label="Breed" placeholder="Indie / mixed" value={form.breed} onChange={set('breed')} error={errors.breed} />
            <Input
              label="Age in months"
              type="number"
              inputMode="numeric"
              placeholder="8"
              hint="Roughly is fine."
              value={form.ageMonths}
              onChange={set('ageMonths')}
              error={errors.ageMonths}
            />
            <Input label="Colour" placeholder="Tan with a white chest" value={form.colour} onChange={set('colour')} error={errors.colour} />
            <Select label="Sex" value={sex} onChange={(e) => setSex(e.target.value as Sex)}>
              {SEX.map((s) => <option key={s} value={s}>{s === 'unknown' ? 'Not sure' : s}</option>)}
            </Select>
            <Select label="Size" value={size} onChange={(e) => setSize(e.target.value as Size | '')}>
              <option value="">Not sure</option>
              {SIZE.map((s) => <option key={s} value={s}>{s}</option>)}
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
            label="Their story"
            placeholder="Momo came to us off a service road with a fractured hip and a deep suspicion of people. Four months later she leans her whole weight against anyone who sits down near her."
            hint="Write like you are describing them to a friend. Specifics beat adjectives — 'sleeps on your feet' lands harder than 'affectionate'."
            value={form.story}
            onChange={set('story')}
            error={errors.story}
            rows={6}
            required
          />

          <ChipGroup
            label="Personality"
            options={TRAITS.map((t) => ({ value: t, label: t }))}
            value={personality}
            onChange={setPersonality}
          />
        </div>

        <div className="space-y-6 rounded-[2rem] border-2 border-line bg-paper p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold">Health and fit</h2>

          <div className="grid gap-2 sm:grid-cols-2">
            {([
              ['vaccinated', 'Vaccinated'],
              ['sterilised', 'Sterilised'],
              ['dewormed', 'Dewormed'],
              ['fosterOnly', 'Foster only, not adoption'],
            ] as const).map(([key, label]) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-line bg-paper px-4 py-3"
              >
                <input
                  type="checkbox"
                  checked={flags[key]}
                  onChange={(e) => setFlags((p) => ({ ...p, [key]: e.target.checked }))}
                  className="size-5 accent-[var(--color-sage)]"
                />
                <span className="font-display text-sm font-semibold">{label}</span>
              </label>
            ))}
          </div>

          <ChipGroup label="Gets on well with" options={GOOD_WITH} value={goodWith} onChange={setGoodWith} />

          <Textarea
            label="Special needs"
            placeholder="Needs daily medication for a skin condition — about ₹400 a month."
            hint="Be upfront. Adopters who know what they are taking on do not return animals."
            value={form.specialNeeds}
            onChange={set('specialNeeds')}
            error={errors.specialNeeds}
            rows={3}
          />

          <Input
            label="Adoption fee (₹)"
            type="number"
            inputMode="numeric"
            hint="Leave at 0 unless you genuinely need to recover costs."
            value={form.adoptionFee}
            onChange={set('adoptionFee')}
            error={errors.adoptionFee}
          />
        </div>

        {errors._ && (
          <p className="rounded-2xl border-2 border-critical bg-critical-soft px-5 py-4 font-semibold text-critical-deep">
            {errors._}
          </p>
        )}

        <Button type="submit" variant="sage" size="lg" loading={busy}>
          <PawPrint className="size-5" />
          Put them on the board
        </Button>
      </form>
    </DashboardShell>
  );
}
