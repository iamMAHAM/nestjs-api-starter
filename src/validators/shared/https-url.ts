import { z } from 'zod';

export const httpsUrlSchema = z.url({ protocol: /^https$/ }).max(2048);

export const isHttpsUrl = (value: unknown): value is string =>
	httpsUrlSchema.safeParse(value).success;
