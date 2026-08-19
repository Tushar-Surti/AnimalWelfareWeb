import type { Metadata, Viewport } from 'next';
import { Fredoka, Quicksand } from 'next/font/google';
import { SessionProvider } from '@/hooks/use-session';
import { SmoothScroll } from '@/components/motion/smooth-scroll';
import { Nav } from '@/components/layout/nav';
import { Footer } from '@/components/layout/footer';
import './globals.css';

// Fredoka is rounded and friendly without being a novelty face; Quicksand
// carries the same geometry down into body text so the page reads as one voice.
const fredoka = Fredoka({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-fredoka',
  display: 'swap',
});

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-quicksand',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'A.W.W. Helpers — a home for every paw',
    template: '%s · A.W.W. Helpers',
  },
  description:
    'Report a street animal in trouble and the nearest shelter hears about it in seconds. Adopt, foster, volunteer, fundraise, and reunite lost pets — all in one place.',
  keywords: ['animal rescue', 'pet adoption India', 'stray dog rescue', 'NGO', 'lost pet', 'animal welfare'],
  authors: [{ name: 'Tushar Surti' }],
  openGraph: {
    type: 'website',
    siteName: 'A.W.W. Helpers',
    title: 'A.W.W. Helpers — a home for every paw',
    description: 'Spot an animal in trouble? Report it in 30 seconds. The nearest shelter takes it from there.',
    url: siteUrl,
  },
  twitter: { card: 'summary_large_image', title: 'A.W.W. Helpers', description: 'A home for every paw.' },
  icons: { icon: '/favicon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#FFF6EE',
  colorScheme: 'light',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${quicksand.variable}`}>
      <body className="grain min-h-dvh antialiased">
        <SessionProvider>
          <SmoothScroll>
            {/* Keyboard users land here first; the nav is decorative until then. */}
            <a
              href="#main"
              className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:border-2 focus:border-ink focus:bg-butter focus:px-5 focus:py-3 focus:font-display focus:font-semibold"
            >
              Skip to content
            </a>
            <Nav />
            <main id="main">{children}</main>
            <Footer />
          </SmoothScroll>
        </SessionProvider>
      </body>
    </html>
  );
}
