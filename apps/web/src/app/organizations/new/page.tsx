'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, PartyPopper } from 'lucide-react';
import { createOrganizationSchema } from '@aww/shared';
import type { Organization } from '@aww/shared';
import { api, ApiError } from '@/lib/api';
import { useSession } from '@/hooks/use-session';
import type { Coords } from '@/hooks/use-geolocation';
import { Input, Textarea, ChipGroup } from '@/components/ui/field';
import { Button, ButtonLink } from '@/components/ui/button';
import { PhotoUpload } from '@/components/forms/photo-upload';
import { LocationPicker } from '@/components/map/location-picker';
import { DoodleField } from '@/components/ui/doodles';

const SERVICES = [
  'Street rescue', 'Veterinary care', 'Sterilisation', 'Adoption', 'Fostering',
  'Boarding', 'Ambulance', 'Feeding programme', 'Wildlife', 'Cattle care',
] as const;

export default function NewOrganizationPage() {
  const router = useRouter();
  const { user, token, loading } = useSession();

  const [form, setForm] = useState({
    name: '', tagline: '', description: '', email: '', phone: '', website: '',
    registrationNo: '', addressLine1: '', addressLine2: '', landmark: '',
    city: '', state: '', pincode: '',
  });
  const [services, setServices] = useState<string[]>([]);
  const [acceptsRescues, setAcceptsRescues] = useState(true);
  const [logo, setLogo] = useState<string[]>([]);
  const [cover, setCover] = useState<string[]>([]);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<Organization | null>(null);

  // Prefill from the account rather than making them retype it.
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({
      ...prev,
      email: prev.email || user.email,
      phone: prev.phone || user.profile.phone || '',
    }));
  }, [user]);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  if (loading) return <div className="min-h-dvh" />;

  if (!user) {
    return (
      <div className="grid min-h-dvh place-items-center px-6">
        <div className="max-w-md rounded-[2.5rem] border-2 border-line bg-paper p-10 text-center">
          <Building2 className="mx-auto size-10 text-ink-faint" />
          <h1 className="mt-4 font-display text-2xl font-semibold">Make an account first</h1>
          <p className="mt-3 text-ink-soft">
            Organizations are tied to a person, so there is always someone accountable for a claimed
            rescue.
          </p>
          <ButtonLink href="/sign-up?role=ngo" size="lg" className="mt-6 w-full">
            Create an organization account
          </ButtonLink>
        </div>
      </div>
    );
  }

  if (created) {
    return (
      <div className="relative grid min-h-dvh place-items-center px-6">
        <DoodleField />
        <div className="relative max-w-lg rounded-[2.5rem] border-2 border-sage-deep bg-paper p-10 text-center shadow-[0.5rem_0.5rem_0_var(--color-sage-deep)]">
          <span className="mx-auto grid size-20 place-items-center rounded-full border-2 border-sage-deep bg-sage text-white">
            <PartyPopper className="size-10" />
          </span>
          <h1 className="mt-6 font-display text-3xl font-semibold">{created.name} is live.</h1>
          <p className="mt-3 text-ink-soft">
            You can claim rescues nearby right now. Verification takes a day or two — verified shelters
            appear first in every list.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/dashboard" variant="sage" size="lg">
              Go to dashboard
            </ButtonLink>
            <ButtonLink href="/rescues" variant="paper" size="lg">
              See open rescues
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setErrors({});

    if (!coords) {
      setErrors({ lat: 'Drop a pin so people can find you.' });
      return;
    }

    const parsed = createOrganizationSchema.safeParse({
      ...form,
      services,
      acceptsRescues,
      lat: coords.lat,
      lng: coords.lng,
      logoUrl: logo[0],
      coverUrl: cover[0],
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
      setCreated(await api.post<Organization>('/api/organizations', parsed.data, { token }));
      router.refresh();
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
    <div>
      <section className="relative overflow-hidden px-6 pb-6 pt-32">
        <DoodleField className="opacity-60" />
        <div className="relative mx-auto max-w-2xl text-center">
          <h1 className="font-display text-[clamp(2.25rem,5.5vw,3.5rem)] font-semibold">
            List your shelter
          </h1>
          <p className="mt-4 text-lg text-ink-soft">
            Once you are on the map, every rescue report within range reaches you.
          </p>
        </div>
      </section>

      <form onSubmit={submit} className="mx-auto max-w-2xl space-y-8 px-6 pb-24">
        <div className="space-y-6 rounded-[2rem] border-2 border-line bg-paper p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold">The basics</h2>

          <Input label="Organization name" placeholder="Happy Tails Foundation" value={form.name} onChange={set('name')} error={errors.name} required />
          <Input label="One-line tagline" placeholder="Street rescue and rehoming across east Pune" value={form.tagline} onChange={set('tagline')} error={errors.tagline} />
          <Textarea
            label="What do you do?"
            placeholder="We run a 24/7 street rescue line, a 40-bed shelter, and a weekly sterilisation camp."
            hint="This is what a worried stranger reads before deciding to call you."
            value={form.description}
            onChange={set('description')}
            error={errors.description}
            rows={5}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <PhotoUpload bucket="orgs" value={logo} onChange={setLogo} max={1} label="Logo" error={errors.logoUrl} />
            <PhotoUpload bucket="orgs" value={cover} onChange={setCover} max={1} label="Cover photo" error={errors.coverUrl} />
          </div>

          <ChipGroup label="What do you offer?" options={SERVICES.map((s) => ({ value: s, label: s }))} value={services} onChange={setServices} />

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border-2 border-critical/40 bg-critical-soft px-4 py-3.5">
            <input
              type="checkbox"
              checked={acceptsRescues}
              onChange={(e) => setAcceptsRescues(e.target.checked)}
              className="mt-0.5 size-5 accent-[var(--color-critical)]"
            />
            <span>
              <span className="block font-display text-sm font-semibold text-critical-deep">
                We take street rescue calls
              </span>
              <span className="mt-0.5 block text-sm text-critical-deep/80">
                Turn this on and new reports near you show up in your dashboard, with the reporter&apos;s number.
              </span>
            </span>
          </label>
        </div>

        <div className="space-y-6 rounded-[2rem] border-2 border-line bg-paper p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold">How people reach you</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errors.email} required />
            <Input label="Phone" inputMode="tel" placeholder="98765 43210" value={form.phone} onChange={set('phone')} error={errors.phone} required />
            <Input label="Website" placeholder="https://happytails.org" value={form.website} onChange={set('website')} error={errors.website} />
            <Input label="Registration number" placeholder="Optional, speeds up verification" value={form.registrationNo} onChange={set('registrationNo')} error={errors.registrationNo} />
          </div>
        </div>

        <div className="space-y-6 rounded-[2rem] border-2 border-line bg-paper p-6 sm:p-8">
          <h2 className="font-display text-xl font-semibold">Where are you?</h2>
          <LocationPicker value={coords} onChange={setCoords} error={errors.lat} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Address line 1" value={form.addressLine1} onChange={set('addressLine1')} error={errors.addressLine1} required />
            <Input label="Address line 2" value={form.addressLine2} onChange={set('addressLine2')} error={errors.addressLine2} />
            <Input label="Landmark" value={form.landmark} onChange={set('landmark')} error={errors.landmark} />
            <Input label="City" value={form.city} onChange={set('city')} error={errors.city} required />
            <Input label="State" value={form.state} onChange={set('state')} error={errors.state} required />
            <Input label="Pincode" inputMode="numeric" maxLength={6} value={form.pincode} onChange={set('pincode')} error={errors.pincode} required />
          </div>
        </div>

        {errors._ && (
          <p className="rounded-2xl border-2 border-critical bg-critical-soft px-5 py-4 font-semibold text-critical-deep">
            {errors._}
          </p>
        )}

        <Button type="submit" variant="butter" size="lg" loading={busy}>
          <Building2 className="size-5" />
          Put us on the map
        </Button>
      </form>
    </div>
  );
}
