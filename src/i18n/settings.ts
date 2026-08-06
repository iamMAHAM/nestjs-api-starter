import { type Locale, SUPPORTED_LOCALES } from '../validators/shared/locale.js';

export type { Locale };
export { SUPPORTED_LOCALES };

export const DEFAULT_LOCALE: Locale = 'en';
export const FALLBACK_LOCALE: Locale = 'en';
export const LOCALE_HEADER = 'x-locale';

export const NAMESPACES = ['api', 'errors', 'auth', 'users'] as const;
export type Namespace = (typeof NAMESPACES)[number];
export const DEFAULT_NAMESPACE: Namespace = 'errors';

export const isSupportedLocale = (value: unknown): value is Locale =>
	typeof value === 'string' &&
	(SUPPORTED_LOCALES as readonly string[]).includes(value);
