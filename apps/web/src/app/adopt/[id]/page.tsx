import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, ShieldCheck, MapPin, Syringe, Scissors, Pill, Sparkles } from 'lucide-react';
import type { Animal } from '@aww/shared';
import { SPECIES_EMOJI, SPECIES_LABEL, formatAge, formatCurrency, formatDistance } from '@aww/shared';
import { api, ApiError } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { AdoptForm } from '@/components/animals/adopt-form';
import { AnimalCard } from '@/components/cards/animal-card';
import { HeartDoodle, Paw } from '@/components/ui/doodles';

type AnimalDetail = Animal & { siblings?: Animal[] };

export const dynamic = 'force-dynamic';

async function getAnimal(id: string): Promise<AnimalDetail | null> {
  try {
    return await api.get<AnimalDetail>(`/api/animals/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const animal = await getAnimal(id).catch(() => null);
  if (!animal) return { title: 'Not found' };

  return {
    title: `Adopt ${animal.name}`,
    description: animal.story.slice(0, 155),
    openGraph: {
      title: `${animal.name} is looking for a home`,
      description: animal.story.slice(0, 155),
      images: animal.photos[0] ? [{ url: animal.photos[0] }] : undefined,
    },
  };
}

const CARE = [
  { key: 'vaccinated', icon: Syringe, label: 'Vaccinated' },
  { key: 'sterilised', icon: Scissors, label: 'Sterilised' },
  { key: 'dewormed', icon: Pill, label: 'Dewormed' },
] as const;

export default async function AnimalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const animal = await getAnimal(id);
  if (!animal) notFound();

  const facts = [
    { label: 'Age', value: formatAge(animal.ageMonths) },
    { label: 'Sex', value: animal.sex === 'unknown' ? 'Not sure' : animal.sex },
    { label: 'Breed', value: animal.breed ?? 'Indie / mixed' },
    { label: 'Size', value: animal.size ?? 'Medium-ish' },
    { label: 'Colour', value: animal.colour ?? '—' },
    {
      label: 'Adoption fee',
      value: animal.adoptionFee > 0 ? formatCurrency(animal.adoptionFee) : 'Free',
    },
  ].filter((f) => f.value !== '—');

  return (
    <div className="px-6 pb-24 pt-28">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/adopt"
          className="inline-flex items-center gap-2 font-display text-sm font-semibold text-ink-soft transition-colors hover:text-blush"
        >
          <ArrowLeft className="size-4" />
          Back to everyone
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div>
            {/* Photo wall. The cover photo leads at full width; the rest tile
                beneath so a shelter with eight photos does not push the story
                off the screen. */}
            <div className="grid gap-3">
              <div className="relative aspect-[16/11] overflow-hidden rounded-[2.5rem] border-2 border-line bg-cream-deep">
                {animal.photos[0] ? (
                  <Image
                    src={animal.photos[0]}
                    alt={animal.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid size-full place-items-center text-8xl">
                    {SPECIES_EMOJI[animal.species]}
                  </span>
                )}
              </div>

              {animal.photos.length > 1 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {animal.photos.slice(1).map((photo, i) => (
                    <div
                      key={photo}
                      className="relative aspect-square overflow-hidden rounded-2xl border-2 border-line bg-cream-deep"
                    >
                      <Image
                        src={photo}
                        alt={`${animal.name} — photo ${i + 2}`}
                        fill
                        sizes="25vw"
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-10">
              <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
                <HeartDoodle className="size-6 text-blush" />
                {animal.name}&apos;s story
              </h2>
              <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-ink-soft">{animal.story}</p>
            </div>

            {animal.specialNeeds && (
              <div className="mt-8 rounded-[1.75rem] border-2 border-butter bg-butter-soft p-6">
                <h3 className="font-display text-lg font-semibold text-butter-deep">
                  Things to know before you commit
                </h3>
                <p className="mt-2 text-butter-deep/90">{animal.specialNeeds}</p>
              </div>
            )}

            <dl className="mt-10 grid grid-cols-2 gap-4 rounded-[1.75rem] border-2 border-line bg-paper p-6 sm:grid-cols-3">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-sm text-ink-faint">{fact.label}</dt>
                  <dd className="mt-0.5 font-display font-semibold capitalize">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="rounded-[2rem] border-2 border-line bg-paper p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="blush">
                  {SPECIES_EMOJI[animal.species]} {SPECIES_LABEL[animal.species]}
                </Badge>
                {animal.fosterOnly && <Badge tone="lilac">Foster only</Badge>}
              </div>

              <h1 className="mt-3 font-display text-4xl font-semibold">{animal.name}</h1>
              <p className="mt-1 text-ink-soft">
                {formatAge(animal.ageMonths)}
                {animal.breed ? ` · ${animal.breed}` : ''}
              </p>

              {animal.personality.length > 0 && (
                <div className="mt-5">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ink-faint">
                    <Sparkles className="size-3.5" />
                    Personality
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {animal.personality.map((trait) => (
                      <Badge key={trait} tone="butter">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {CARE.filter((c) => animal[c.key]).map((c) => (
                  <span
                    key={c.key}
                    className="inline-flex items-center gap-1.5 rounded-full border-2 border-sage/40 bg-sage-soft px-3 py-1.5 text-xs font-semibold text-sage-deep"
                  >
                    <c.icon className="size-3.5" />
                    {c.label}
                  </span>
                ))}
              </div>

              {animal.goodWith.length > 0 && (
                <p className="mt-5 rounded-2xl bg-cream-deep px-4 py-3 text-sm text-ink-soft">
                  <strong className="font-display font-semibold text-ink">Gets on well with:</strong>{' '}
                  {animal.goodWith.join(', ')}
                </p>
              )}

              {animal.organization && (
                <Link
                  href={`/organizations/${animal.organization.slug}`}
                  className="mt-5 flex items-center justify-between gap-3 rounded-2xl border-2 border-line px-4 py-3 transition-colors hover:border-blush"
                >
                  <span className="min-w-0">
                    <span className="block text-xs text-ink-faint">Cared for by</span>
                    <span className="flex items-center gap-1.5 truncate font-display font-semibold">
                      {animal.organization.name}
                      {animal.organization.verified && (
                        <ShieldCheck className="size-4 shrink-0 text-sage-deep" />
                      )}
                    </span>
                  </span>
                  {animal.distanceKm !== undefined && (
                    <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-blush">
                      <MapPin className="size-3.5" />
                      {formatDistance(animal.distanceKm)}
                    </span>
                  )}
                </Link>
              )}
            </div>

            <AdoptForm animal={animal} />
          </aside>
        </div>

        {animal.siblings && animal.siblings.length > 0 && (
          <section className="mt-20">
            <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
              <Paw className="size-6 text-sage" />
              Others from the same shelter
            </h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {animal.siblings.map((sibling, i) => (
                <AnimalCard key={sibling.id} animal={sibling} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
