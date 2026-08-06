import { type ArgumentMetadata, Injectable } from '@nestjs/common';
import { ZodValidationPipe } from 'nestjs-zod';
import { z } from 'zod';
import { en, fr } from 'zod/locales';
import { currentLocale } from '../../i18n/locale-context.js';

const localePacks = { en: en(), fr: fr() } as const;

/**
 * Zod ships its own built-in messages ("Invalid email", …). This pipe swaps in
 * the pack matching the request locale so those built-ins are translated too,
 * without every schema having to carry a custom message.
 */
@Injectable()
export class LocaleAwareZodValidationPipe extends ZodValidationPipe {
	override transform(value: unknown, metadata: ArgumentMetadata) {
		const pack = localePacks[currentLocale()];
		const previous = z.config();
		try {
			z.config({ localeError: pack.localeError });
			return super.transform(value, metadata);
		} finally {
			z.config(previous);
		}
	}
}
