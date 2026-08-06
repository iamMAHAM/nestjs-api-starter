/** biome-ignore-all lint/suspicious/noExplicitAny: TFunction overload forwarding is intentional; the outer cast preserves the typed signature for callers. */
import { Injectable, type OnModuleInit } from '@nestjs/common';
import type { i18n, TFunction } from 'i18next';
import { initI18next } from './init.js';
import { currentLocale } from './locale-context.js';
import apiEn from './locales/en/api.json' with { type: 'json' };
import authEn from './locales/en/auth.json' with { type: 'json' };
import errorsEn from './locales/en/errors.json' with { type: 'json' };
import usersEn from './locales/en/users.json' with { type: 'json' };
import apiFr from './locales/fr/api.json' with { type: 'json' };
import authFr from './locales/fr/auth.json' with { type: 'json' };
import errorsFr from './locales/fr/errors.json' with { type: 'json' };
import usersFr from './locales/fr/users.json' with { type: 'json' };
import {
	DEFAULT_LOCALE,
	DEFAULT_NAMESPACE,
	type Locale,
	NAMESPACES,
} from './settings.js';

type AllNamespaces = ['api', 'errors', 'auth', 'users'];

@Injectable()
export class I18nService implements OnModuleInit {
	private instance!: i18n;

	async onModuleInit() {
		this.instance = await initI18next({
			locale: DEFAULT_LOCALE,
			ns: NAMESPACES,
			defaultNS: DEFAULT_NAMESPACE,
			resources: {
				en: { api: apiEn, errors: errorsEn, auth: authEn, users: usersEn },
				fr: { api: apiFr, errors: errorsFr, auth: authFr, users: usersFr },
			},
		});
	}

	/** Type-safe translate, using the locale of the current request. */
	t = ((...args: any[]) =>
		(this.instance.getFixedT(currentLocale()) as any)(
			...args,
		)) as TFunction<AllNamespaces>;

	/** Translate a key only known at runtime (error codes, dynamic namespaces). */
	tLoose(key: string, options?: Record<string, unknown>): string {
		const translate = this.instance.getFixedT(currentLocale()) as unknown as (
			k: string,
			o?: Record<string, unknown>,
		) => string;
		return translate(key, options);
	}

	/** Translate for an explicit locale — useful for emails and background jobs. */
	tFor = (locale: Locale): TFunction<AllNamespaces> =>
		this.instance.getFixedT(locale) as TFunction<AllNamespaces>;
}
