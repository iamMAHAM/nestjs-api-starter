import type { ArgumentMetadata } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { localeContext } from '../../i18n/locale-context.js';
import type { Locale } from '../../i18n/settings.js';
import { SchemaValidationException } from '../errors/schema-validation.exception.js';
import { LocaleAwareValidationPipe } from './locale-aware-validation.pipe.js';

const pipe = new LocaleAwareValidationPipe();
const schema = z.object({
	email: z.email(),
	name: z.string().min(1, { error: 'auth:NAME_INVALID' }),
	page: z.coerce.number().default(1),
});
const meta = (s?: z.ZodType): ArgumentMetadata => ({ type: 'body', schema: s });

const issuesFor = (locale: Locale, value: unknown) =>
	localeContext.run({ locale }, () =>
		pipe.transform(value, meta(schema)).then(
			() => [],
			(error: SchemaValidationException) => error.issues,
		),
	);

describe('LocaleAwareValidationPipe', () => {
	it('returns the parsed value', async () => {
		await expect(
			pipe.transform({ email: 'a@b.co', name: 'A' }, meta(schema)),
		).resolves.toEqual({ email: 'a@b.co', name: 'A', page: 1 });
	});

	it('passes values through when the parameter has no schema', async () => {
		await expect(pipe.transform('raw', meta())).resolves.toBe('raw');
	});

	it('localizes Zod built-in messages per request', async () => {
		const [en, fr] = await Promise.all([
			issuesFor('en', { email: 'nope', name: 'A' }),
			issuesFor('fr', { email: 'nope', name: 'A' }),
		]);
		expect(en[0]?.message).toMatch(/invalid/i);
		expect(fr[0]?.message).not.toBe(en[0]?.message);
		expect(fr[0]?.message).toMatch(/invalide/i);
	});

	it('keeps custom i18n keys untouched', async () => {
		const issues = await issuesFor('fr', { email: 'a@b.co', name: '' });
		expect(issues[0]?.message).toBe('auth:NAME_INVALID');
	});
});
