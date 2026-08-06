import { z } from 'zod';

/**
 * Response-side date field.
 *
 * Prisma hands back `Date` objects, but the wire format is an ISO string and
 * `z.date()` has no JSON Schema representation — it makes Swagger generation
 * throw. This accepts either and always emits the ISO string.
 */
export const isoDate = z.preprocess(
	(value) => (value instanceof Date ? value.toISOString() : value),
	z.iso.datetime(),
);
