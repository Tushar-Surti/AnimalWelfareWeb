'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

/** Counts from zero when it scrolls into view. Used for the impact numbers. */
export function CountUp({
  to,
  duration = 1.6,
  format = (n: number) => Math.round(n).toLocaleString('en-IN'),
  className,
}: {
  to: number;
  duration?: number;
  format?: (value: number) => string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10%' });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(() => (reduced ? format(to) : format(0)));

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => setDisplay(format(value)),
    });
    return () => controls.stop();
  }, [inView, to, duration, format, reduced]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
