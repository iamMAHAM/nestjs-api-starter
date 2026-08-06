import { Test } from '@nestjs/testing';
import { beforeAll, describe, expect, it } from 'vitest';
import { I18nService } from './i18n.service.js';
import { localeContext } from './locale-context.js';

describe('I18nService', () => {
	let i18n: I18nService;

	beforeAll(async () => {
		const moduleRef = await Test.createTestingModule({
			providers: [I18nService],
		}).compile();
		await moduleRef.init();
		i18n = moduleRef.get(I18nService);
	});

	it('falls back to the default locale outside a request', () => {
		expect(i18n.tLoose('errors:NOT_FOUND')).toBe(
			'The requested resource was not found.',
		);
	});

	it('uses the locale stored for the current request', () => {
		localeContext.run({ locale: 'fr' }, () => {
			expect(i18n.tLoose('errors:NOT_FOUND')).toBe(
				'La ressource demandée est introuvable.',
			);
		});
	});

	it('interpolates values', () => {
		expect(i18n.tLoose('users:USER_NOT_FOUND', { id: 'abc' })).toContain('abc');
	});

	it('translates for an explicit locale', () => {
		expect(i18n.tFor('fr')('auth:EMAIL_TAKEN')).toBe(
			'Un compte avec cet e-mail existe déjà.',
		);
	});
});
