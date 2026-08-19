/**
 * Postgres speaks snake_case, TypeScript speaks camelCase. Rather than writing
 * a hand-rolled mapper per table (16 of them, each a place to forget a field),
 * every row crosses the boundary through these two functions.
 */

const toCamel = (key: string) => key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
const toSnake = (key: string) => key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

function convert(value: unknown, mapKey: (key: string) => string): unknown {
  if (Array.isArray(value)) return value.map((v) => convert(v, mapKey));
  // Dates and nulls are values, not records to walk into.
  if (value === null || typeof value !== 'object' || value instanceof Date) return value;

  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    out[mapKey(key)] = convert(val, mapKey);
  }
  return out;
}

export function camelize<T>(input: unknown): T {
  return convert(input, toCamel) as T;
}

export function snakify<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  return convert(input, toSnake) as Record<string, unknown>;
}

/** Drops undefined values so a PATCH with three fields does not null out the
 *  other twenty. */
export function definedOnly<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined));
}
