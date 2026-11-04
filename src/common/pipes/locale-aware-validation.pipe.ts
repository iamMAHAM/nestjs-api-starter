import { Injectable, StandardSchemaValidationPipe } from '@nestjs/common';
import type { StandardSchemaV1 } from '@standard-schema/spec';
import { z } from 'zod';
import { en, fr } from 'zod/locales';
import { currentLocale } from '../../i18n/locale-context.js';
import { SchemaValidationException } from '../errors/schema-validation.exception.js';

const localePacks = { en: en(), fr: fr() } as const;

/**
 * Nest's Standard Schema pipe, with Zod's built-in messages ("Invalid email",
 * …) in the request locale. The locale is passed per parse, never globally.
 */
@Injectable()
export class LocaleAwareValidationPipe extends StandardSchemaValidationPipe {
	constructor() {
		super({
			exceptionFactory: (issues) => new SchemaValidationException(issues),
		});
	}

	protected override async validate<T = unknown>(
		value: unknown,
		schema: StandardSchemaV1,
		options?: Record<string, unknown>,
	): Promise<StandardSchemaV1.Result<T>> {
		if (!(schema instanceof z.ZodType)) {
			return super.validate<T>(value, schema, options);
		}
		const result = await schema.safeParseAsync(value, {
			error: localePacks[currentLocale()].localeError,
		});
		return result.success
			? { value: result.data as T }
			: { issues: result.error.issues };
	}
}
