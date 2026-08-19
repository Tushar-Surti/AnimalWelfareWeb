'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * Lenis drives the scroll position; GSAP's ScrollTrigger reads it.
 *
 * Wiring them together is the fiddly part: ScrollTrigger has to be told to ask
 * Lenis for the scroll offset, and Lenis has to be ticked from GSAP's rAF loop
 * rather than its own, or the two run on separate frames and pinned sections
 * visibly lag the content around them.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Honour the OS setting: no smoothing, no scroll animation, native scroll.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.05,
      // Gentle exponential ease — long enough to feel silky, short enough that
      // clicking an anchor still feels responsive.
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      // Never hijack touch scrolling; phone users expect their own OS physics.
      syncTouch: false,
      touchMultiplier: 1.6,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    ScrollTrigger.scrollerProxy(document.body, {
      scrollTop: (value) =>
        value === undefined ? lenis.scroll : lenis.scrollTo(value, { immediate: true }) as unknown as number,
    });

    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  // Every route change invalidates measured trigger positions.
  useEffect(() => {
    ScrollTrigger.refresh();
    window.scrollTo(0, 0);
  }, [pathname]);

  return <>{children}</>;
}
