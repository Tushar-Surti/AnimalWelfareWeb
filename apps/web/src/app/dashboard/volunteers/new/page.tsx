'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HandHeart, Building2 } from 'lucide-react';
import { createOpportunitySchema } from '@aww/shared';
import type { VolunteerOpportunity } from '@aww/shared';
import { api, ApiError } from '@/lib/api';
import { useSession } from '@/hooks/use-session';
import type { Coords } from '@/hooks/use-geolocation';
import { Input, Textarea, Select, ChipGroup } from '@/components/ui/field';
import { Button, ButtonLink } from '@/components/ui/button';
import { LocationPicker } from '@/components/map/location-picker';
import { DashboardShell, NeedsAuth } from '@/components/dashboard/shell';

const SKILLS = [
  'Own vehicle', 'Comfortable with dogs', 'Comfortable with cats', 'Photography',
  'Social media', 'Spreadsheets', 'Fundraising', 'Veterinary background',
  'Heavy lifting', 'Weekend availability',
];

export default function NewOpportunityPage() {
  const router = useRouter();
  const { user, token, loading } = useSession();

  const [orgId, setOrgId] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [remote, setRemote] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [form, setForm] = useState({
    title: '', description: '', commitment: '', slots: '1',
    startsAt: '', endsAt: '', address: '', city: '', pincode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  if (loading) return <div className="min-h-dvh" />;
  if (!user) return <NeedsAuth next="/dashboard/volunteers/new" />;

  const orgs = user.organizations;
  if (orgs.length === 0) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-md rounded-[2.5rem] border-2 border-line bg-paper p-10 text-center">
          <Building2 className="mx-auto size-10 text-ink-faint" />
          <h1 className="mt-4 font-display text-2xl font-semibold">Register a shelter first</h1>
          <p className="mt-3 text-ink-soft">
            Opportunities are posted by an organization so volunteers know who they are turning up for.
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

    const parsed = createOpportunitySchema.safeParse({
      ...form,
      skills,
      remote,
      slots: Number(form.slots || 1),
      startsAt: form.startsAt ? new Date(form.startsAt) : undefined,
      endsAt: form.endsAt ? new Date(form.endsAt) : undefined,
      lat: coords?.lat,
      lng: coords?.lng,
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
      const created = await api.post<VolunteerOpportunity>(
        '/api/volunteers',
        { ...parsed.data, orgId: activeOrg },
        { token },
      );
      router.push(`/volunteer/${created.id}`);
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
    <DashboardShell
      title="Post an opportunity"
      subtitle="Be specific about what you need. Vague asks get vague volunteers."
    >
      <form onSubmit={submit} className="max-w-2xl space-y-8">
        {orgs.length > 1 && (
          <Select label="Posting on behalf of" value={activeOrg} onChange={(e) => setOrgId(e.target.value)}>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </Select>
        )}

        <div className="space-y-6 rounded-[2rem] border-2 border-line bg-paper p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold">What do you need?</h2>

          <Input
            label="Title"
            placeholder="Sunday transport driver"
            value={form.title}
            onChange={set('title')}
            error={errors.title}
            required
          />

          <Textarea
            label="What would they actually be doing?"
            placeholder="We move animals between our shelter and partner clinics every Sunday morning. You need a car, about three hours, and no strong feelings about dog hair on your seats."
            hint="Say the awkward parts out loud — early mornings, heavy lifting, difficult cases. It filters for people who will actually stay."
            value={form.description}
            onChange={set('description')}
            error={errors.description}
            rows={6}
            required
          />

          <ChipGroup
            label="Helpful to have"
            options={SKILLS.map((s) => ({ value: s, label: s }))}
            value={skills}
            onChange={setSkills}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Time commitment"
              placeholder="Sunday mornings, 8am–11am"
              value={form.commitment}
              onChange={set('commitment')}
              error={errors.commitment}
            />
            <Input
              label="How many people?"
              type="number"
              inputMode="numeric"
              min={1}
              value={form.slots}
              onChange={set('slots')}
              error={errors.slots}
            />
            <Input label="Starts" type="date" value={form.startsAt} onChange={set('startsAt')} error={errors.startsAt} />
            <Input label="Ends" type="date" value={form.endsAt} onChange={set('endsAt')} error={errors.endsAt} />
          </div>
        </div>

        <div className="space-y-6 rounded-[2rem] border-2 border-line bg-paper p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold">Where?</h2>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-lilac/40 bg-lilac-soft px-4 py-3.5">
            <input
              type="checkbox"
              checked={remote}
              onChange={(e) => setRemote(e.target.checked)}
              className="mt-0.5 size-5 accent-[var(--color-lilac)]"
            />
            <span>
              <span className="block font-display text-sm font-semibold text-lilac-deep">
                This can be done remotely
              </span>
              <span className="mt-0.5 block text-sm text-lilac-deep/80">
                Admin, design, social media, fundraising. Remote listings show up for everyone,
                regardless of distance.
              </span>
            </span>
          </label>

          {!remote && (
            <>
              <LocationPicker value={coords} onChange={setCoords} error={errors.lat} />
              <div className="grid gap-4 sm:grid-cols-3">
                <Input label="Address" value={form.address} onChange={set('address')} error={errors.address} />
                <Input label="City" value={form.city} onChange={set('city')} error={errors.city} />
                <Input
                  label="Pincode"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.pincode}
                  onChange={set('pincode')}
                  error={errors.pincode}
                />
              </div>
            </>
          )}
        </div>

        {errors._ && (
          <p className="rounded-2xl border-2 border-critical bg-critical-soft px-5 py-4 font-semibold text-critical-deep">
            {errors._}
          </p>
        )}

        <Button type="submit" variant="sage" size="lg" loading={busy}>
          <HandHeart className="size-5" />
          Post it
        </Button>
      </form>
    </DashboardShell>
  );
}
