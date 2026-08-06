import { AsyncLocalStorage } from 'node:async_hooks';
import { DEFAULT_LOCALE, type Locale } from './settings.js';

export const localeContext = new AsyncLocalStorage<{ locale: Locale }>();

export const currentLocale = (): Locale =>
	localeContext.getStore()?.locale ?? DEFAULT_LOCALE;
