import Link from 'next/link';
import Image from 'next/image';
import { Paw, Sparkle, HeartDoodle } from '@/components/ui/doodles';

/** Split layout shared by sign-in and sign-up: form on the left, a photo and a
 *  reason to bother on the right. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  photo = '/photos/cat.png',
  quote,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  photo?: string;
  quote: string;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-28">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="grid size-11 place-items-center rounded-full border-2 border-blush-deep bg-blush text-white shadow-[0.2rem_0.2rem_0_var(--color-blush-deep)]">
              <Paw className="size-6" />
            </span>
            <span className="font-display text-xl font-semibold">
              A.W.W.<span className="text-blush"> Helpers</span>
            </span>
          </Link>

          <h1 className="mt-10 font-display text-4xl font-semibold">{title}</h1>
          <p className="mt-3 text-ink-soft">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-8 text-sm text-ink-soft">{footer}</div>
        </div>
      </div>

      {/* Decorative half. Hidden on small screens rather than stacked — a photo
          above the fold on a phone just pushes the form off it. */}
      <div className="relative hidden overflow-hidden bg-blush-soft lg:block">
        <Image src={photo} alt="" fill sizes="50vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />

        <Sparkle className="absolute right-16 top-20 size-10 animate-[float_5s_ease-in-out_infinite] text-butter" />
        <HeartDoodle className="absolute left-14 top-40 size-12 rotate-12 animate-[float_7s_ease-in-out_infinite] text-white/40" />

        <blockquote className="absolute inset-x-10 bottom-12 rounded-[2rem] border-2 border-white/25 bg-white/15 p-7 text-white backdrop-blur-md">
          <p className="font-display text-2xl font-semibold leading-snug">{quote}</p>
        </blockquote>
      </div>
    </div>
  );
}
