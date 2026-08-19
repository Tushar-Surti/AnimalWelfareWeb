import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowLeft, Phone, MapPin, Clock, Sparkles } from 'lucide-react';
import type { LostFoundPost } from '@aww/shared';
import { SPECIES_LABEL, SPECIES_EMOJI, formatCurrency, formatDistance, timeAgo } from '@aww/shared';
import { api, ApiError } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { StaticMap } from '@/components/map/static-map';
import { HeartDoodle } from '@/components/ui/doodles';

export const dynamic = 'force-dynamic';

async function getPost(id: string): Promise<LostFoundPost | null> {
  try {
    return await api.get<LostFoundPost>(`/api/lost-found/${id}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id).catch(() => null);
  if (!post) return { title: 'Not found' };

  const noun = post.petName ?? SPECIES_LABEL[post.species];
  return {
    title: post.kind === 'lost' ? `Missing: ${noun}` : `Found: ${noun}`,
    description: post.description.slice(0, 155),
    openGraph: { images: post.photos[0] ? [{ url: post.photos[0] }] : undefined },
  };
}

export default async function LostFoundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = await getPost(id);
  if (!post) notFound();

  const lost = post.kind === 'lost';
  const name = post.petName ?? SPECIES_LABEL[post.species];
  const matches = post.matches ?? [];

  return (
    <div className="px-6 pb-24 pt-28">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/lost-found"
          className="inline-flex items-center gap-2 font-display text-sm font-semibold text-ink-soft transition-colors hover:text-lilac-deep"
        >
          <ArrowLeft className="size-4" />
          Back to the board
        </Link>

        {post.status === 'reunited' && (
          <div className="mt-6 flex items-center gap-3 rounded-[1.75rem] border-2 border-sage-deep bg-sage-soft p-5">
            <HeartDoodle className="size-8 shrink-0 text-sage-deep" />
            <p className="font-display text-lg font-semibold text-sage-deep">
              {name} made it home. This post is closed.
            </p>
          </div>
        )}

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={lost ? 'lilac' : 'sky'}>{lost ? 'Missing' : 'Found'}</Badge>
              <Badge tone="neutral">
                {SPECIES_EMOJI[post.species]} {SPECIES_LABEL[post.species]}
              </Badge>
              {post.reward && post.reward > 0 && (
                <Badge tone="butter">{formatCurrency(post.reward)} reward</Badge>
              )}
            </div>

            <h1 className="mt-4 font-display text-[clamp(2rem,5vw,3.5rem)] font-semibold">{name}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-soft">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-4" />
                {lost ? 'Last seen' : 'Found'} {timeAgo(post.seenAt)}
              </span>
              {(post.address || post.city) && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" />
                  {[post.address, post.city].filter(Boolean).join(', ')}
                </span>
              )}
            </div>

            {post.photos.length > 0 && (
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {post.photos.map((photo, i) => (
                  <div
                    key={photo}
                    className={`relative overflow-hidden rounded-[1.75rem] border-2 border-line bg-cream-deep ${
                      i === 0 ? 'sm:col-span-2 aspect-[16/10]' : 'aspect-square'
                    }`}
                  >
                    <Image
                      src={photo}
                      alt={`${name} — photo ${i + 1}`}
                      fill
                      priority={i === 0}
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="mt-8 rounded-[1.75rem] border-2 border-line bg-paper p-6">
              <p className="whitespace-pre-line leading-relaxed text-ink-soft">{post.description}</p>

              {post.distinguishing && (
                <p className="mt-5 rounded-2xl bg-butter-soft px-4 py-3 text-butter-deep">
                  <strong className="font-display font-semibold">Distinctive:</strong> {post.distinguishing}
                </p>
              )}

              <dl className="mt-6 grid grid-cols-2 gap-4 border-t-2 border-line pt-5 text-sm sm:grid-cols-3">
                {post.breed && (
                  <div>
                    <dt className="text-ink-faint">Breed</dt>
                    <dd className="mt-0.5 font-display font-semibold">{post.breed}</dd>
                  </div>
                )}
                {post.colour && (
                  <div>
                    <dt className="text-ink-faint">Colour</dt>
                    <dd className="mt-0.5 font-display font-semibold">{post.colour}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-ink-faint">Sex</dt>
                  <dd className="mt-0.5 font-display font-semibold capitalize">
                    {post.sex === 'unknown' ? 'Not sure' : post.sex}
                  </dd>
                </div>
              </dl>
            </div>

            {/* The whole reason both kinds live in one table. */}
            {matches.length > 0 && (
              <section className="mt-12">
                <h2 className="flex items-center gap-2 font-display text-2xl font-semibold">
                  <Sparkles className="size-6 text-butter-deep" />
                  Possible matches
                </h2>
                <p className="mt-2 text-ink-soft">
                  {lost
                    ? 'These pets were found nearby, around the right time. Worth a look.'
                    : 'Somebody nearby lost a pet like this. One of these could be them.'}
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {matches.map((match) => (
                    <Link
                      key={match.id}
                      href={`/lost-found/${match.id}`}
                      className="group flex gap-4 rounded-[1.5rem] border-2 border-butter bg-butter-soft p-4 transition-transform hover:-translate-y-1"
                    >
                      <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border-2 border-butter/60 bg-paper">
                        {match.photos[0] ? (
                          <Image src={match.photos[0]} alt="" fill sizes="80px" className="object-cover" />
                        ) : (
                          <span className="grid size-full place-items-center text-2xl">
                            {SPECIES_EMOJI[match.species]}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Badge tone={match.kind === 'lost' ? 'lilac' : 'sky'}>
                          {match.kind === 'lost' ? 'Missing' : 'Found'}
                        </Badge>
                        <p className="mt-1.5 truncate font-display font-semibold group-hover:underline">
                          {match.petName ?? SPECIES_LABEL[match.species]}
                        </p>
                        <p className="text-xs text-ink-soft">
                          {formatDistance(match.distanceKm)} · {timeAgo(match.seenAt)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24">
            {post.lat !== null && post.lng !== null && (
              <StaticMap
                lat={post.lat}
                lng={post.lng}
                tone={post.kind}
                emoji={SPECIES_EMOJI[post.species]}
                zoom={14}
                className="h-64"
              />
            )}

            <div className={`rounded-[1.75rem] border-2 p-6 ${lost ? 'border-lilac bg-lilac-soft' : 'border-sky bg-sky-soft'}`}>
              <p className={`text-xs font-bold uppercase tracking-wide ${lost ? 'text-lilac-deep' : 'text-sky-deep'}`}>
                {lost ? 'Seen this pet?' : 'Is this yours?'}
              </p>
              <p className="mt-2 font-display text-xl font-semibold">
                {post.contactName ?? 'The person who posted'}
              </p>
              <a
                href={`tel:${post.contactPhone}`}
                className={`mt-4 flex w-full items-center justify-center gap-2 rounded-full border-2 px-6 py-3.5 font-display font-semibold transition-transform hover:-translate-y-0.5 ${
                  lost
                    ? 'border-lilac-deep bg-lilac text-white shadow-[0.25rem_0.25rem_0_var(--color-lilac-deep)]'
                    : 'border-sky-deep bg-sky text-ink shadow-[0.25rem_0.25rem_0_var(--color-sky-deep)]'
                }`}
              >
                <Phone className="size-5" />
                {post.contactPhone}
              </a>
              <p className="mt-3 text-xs opacity-80">
                Call before you move the animal — the owner may be two streets away.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
