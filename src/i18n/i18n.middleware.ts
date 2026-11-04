import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { localeContext } from './locale-context.js';
import {
	DEFAULT_LOCALE,
	isSupportedLocale,
	LOCALE_HEADER,
	type Locale,
	SUPPORTED_LOCALES,
} from './settings.js';

/**
 * Resolution order: explicit `x-locale` header > Accept-Language.
 */
@Injectable()
export class I18nMiddleware implements NestMiddleware {
	use(req: Request, _res: Response, next: NextFunction) {
		const fromHeader = req.header(LOCALE_HEADER);
		const fromAccept = (req.header('accept-language') ?? '')
			.split(',')
			.map((entry) => entry.trim().split(';')[0]?.toLowerCase().split('-')[0])
			.find((tag) => SUPPORTED_LOCALES.includes(tag as Locale));

		const locale: Locale = isSupportedLocale(fromHeader)
			? fromHeader
			: isSupportedLocale(fromAccept)
				? fromAccept
				: DEFAULT_LOCALE;

		localeContext.run({ locale }, () => next());
	}
}
