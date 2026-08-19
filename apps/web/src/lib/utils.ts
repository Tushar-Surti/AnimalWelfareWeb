import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Deterministic pick from a list, keyed by a string. Used so a given animal or
 *  organization always gets the same accent colour and the same card tilt,
 *  rather than reshuffling on every render. */
export function pickBy<T>(key: string, options: readonly T[]): T {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return options[hash % options.length] as T;
}

export const ACCENTS = ['blush', 'peach', 'butter', 'sage', 'sky', 'lilac'] as const;
export type Accent = (typeof ACCENTS)[number];

export const TILTS = ['tilt-1', 'tilt-2', 'tilt-3'] as const;
