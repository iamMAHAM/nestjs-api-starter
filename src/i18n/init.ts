import i18next, { type i18n, type Resource } from 'i18next';
import {
	DEFAULT_NAMESPACE,
	FALLBACK_LOCALE,
	type Locale,
	SUPPORTED_LOCALES,
} from './settings.js';

export type InitI18nOptions = {
	locale: Locale;
	resources: Resource;
	defaultNS?: string;
	ns?: readonly string[];
};

export const initI18next = async (opts: InitI18nOptions): Promise<i18n> => {
	const instance = i18next.createInstance();
	await instance.init({
		lng: opts.locale,
		fallbackLng: FALLBACK_LOCALE,
		supportedLngs: [...SUPPORTED_LOCALES],
		resources: opts.resources,
		defaultNS: opts.defaultNS ?? DEFAULT_NAMESPACE,
		ns: opts.ns ? [...opts.ns] : undefined,
		interpolation: { escapeValue: false },
	});
	return instance;
};
