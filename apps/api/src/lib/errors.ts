import type { Context } from 'hono';
import { ZodError } from 'zod';
import { isProd } from './env.js';

/** Anything the client is allowed to see. Everything else becomes a 500. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, fields?: Record<string, string[]>) {
    return new ApiError(400, 'bad_request', message, fields);
  }
  static unauthorized(message = 'Please sign in to continue.') {
    return new ApiError(401, 'unauthorized', message);
  }
  static forbidden(message = 'You do not have access to this.') {
    return new ApiError(403, 'forbidden', message);
  }
  static notFound(message = 'We could not find that.') {
    return new ApiError(404, 'not_found', message);
  }
  static conflict(message: string) {
    return new ApiError(409, 'conflict', message);
  }
  static tooMany(message = 'That is a lot of requests. Give it a moment.') {
    return new ApiError(429, 'rate_limited', message);
  }
}

/** Zod's field errors, flattened into the shape forms expect. */
function zodFields(error: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

export function errorHandler(error: Error, c: Context) {
  if (error instanceof ApiError) {
    return c.json(
      { ok: false, error: { code: error.code, message: error.message, fields: error.fields } },
      error.status as 400,
    );
  }

  if (error instanceof ZodError) {
    const fields = zodFields(error);
    const first = Object.values(fields)[0]?.[0] ?? 'Please check the highlighted fields.';
    return c.json({ ok: false, error: { code: 'validation_failed', message: first, fields } }, 422);
  }

  console.error('[unhandled]', error);
  return c.json(
    {
      ok: false,
      error: {
        code: 'internal_error',
        message: isProd ? 'Something went wrong on our side. Please try again.' : error.message,
      },
    },
    500,
  );
}
