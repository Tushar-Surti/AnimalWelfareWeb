/** Presentation helpers shared by the API (notification copy) and the UI. */

export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount);
}

/** ₹1,25,000 is a lot of glyphs on a progress bar; ₹1.25L is not. */
export function formatCompactINR(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(amount % 10_000_000 === 0 ? 0 : 1)}Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(amount % 100_000 === 0 ? 0 : 1)}L`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(amount % 1_000 === 0 ? 0 : 1)}K`;
  return `₹${amount}`;
}

/** "3 months", "2 years 4 months", "6 weeks" — reads the way people talk about
 *  animals, where a young puppy's age matters in weeks. */
export function formatAge(months: number | null | undefined): string {
  if (months === null || months === undefined) return 'Age unknown';
  if (months === 0) return 'Newborn';
  if (months < 1) return 'A few weeks';
  if (months < 12) return `${months} month${months === 1 ? '' : 's'}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (rest === 0) return `${years} year${years === 1 ? '' : 's'}`;
  return `${years} yr ${rest} mo`;
}

export function formatDistance(km: number | null | undefined): string {
  if (km === null || km === undefined) return '';
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

export function timeAgo(input: string | Date): string {
  const then = typeof input === 'string' ? new Date(input) : input;
  const seconds = Math.floor((Date.now() - then.getTime()) / 1000);
  if (seconds < 45) return 'just now';
  const units: Array<[number, Intl.RelativeTimeFormatUnit]> = [
    [60, 'second'], [3600, 'minute'], [86400, 'hour'],
    [604800, 'day'], [2629800, 'week'], [31557600, 'month'],
  ];
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  let previous = 1;
  for (const [limit, unit] of units) {
    if (seconds < limit) return rtf.format(-Math.floor(seconds / previous), unit);
    previous = limit;
  }
  return rtf.format(-Math.floor(seconds / 31557600), 'year');
}

/** "Happy Tails Foundation" -> "happy-tails-foundation". Mirrors the SQL
 *  slugify() so client-side previews match what the database stores. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function initials(name: string | null | undefined): string {
  if (!name) return '🐾';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
