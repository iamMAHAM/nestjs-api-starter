import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { type AppConfigService, validateEnv } from './env.js';

const VALID = {
	DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/app',
	BETTER_AUTH_SECRET: 'x'.repeat(32),
};

describe('env validation', () => {
	it('rejects a bad environment with the offending fields named', () => {
		expect(() => validateEnv({ ...VALID, PORT: 'nope' })).toThrow(/PORT/);
		expect(() => validateEnv({ DATABASE_URL: VALID.DATABASE_URL })).toThrow(
			/BETTER_AUTH_SECRET/,
		);
	});

	it('applies defaults and parses CSV into arrays', () => {
		const env = validateEnv({ ...VALID, CORS_ORIGINS: 'a.com, b.com' });
		expect(env.PORT).toBe(4000);
		expect(env.CORS_ORIGINS).toEqual(['a.com', 'b.com']);
	});

	it.each([
		[undefined, false],
		['false', false],
		['1', 1],
		[
			'10.0.0.0/8, loopback, 192.168.1.10',
			['10.0.0.0/8', 'loopback', '192.168.1.10'],
		],
		['fd00::/8', ['fd00::/8']],
	])('parses TRUST_PROXY=%s', (TRUST_PROXY, expected) => {
		expect(validateEnv({ ...VALID, TRUST_PROXY }).TRUST_PROXY).toEqual(
			expected,
		);
	});

	it.each(['true', 'proxy.local', '10.0.0.0/33'])(
		'rejects TRUST_PROXY=%s',
		(TRUST_PROXY) => {
			expect(() => validateEnv({ ...VALID, TRUST_PROXY })).toThrow(
				/TRUST_PROXY/,
			);
		},
	);

	it('defaults auth cookies to SameSite=Lax', () => {
		expect(validateEnv(VALID).AUTH_COOKIE_SAME_SITE).toBe('lax');
	});

	// ConfigService.get must hand back the *parsed* value, not the raw string
	// still sitting in process.env — that ordering is what makes typed config work.
	it('serves parsed values through ConfigService', async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [
				ConfigModule.forRoot({
					ignoreEnvFile: true,
					load: [],
					validate: () =>
						validateEnv({
							...VALID,
							PORT: '5555',
							CORS_ORIGINS: 'a.com,b.com',
						}),
				}),
			],
		}).compile();

		const config = moduleRef.get(ConfigService) as AppConfigService;
		expect(config.get('PORT', { infer: true })).toBe(5555);
		expect(config.get('CORS_ORIGINS', { infer: true })).toEqual([
			'a.com',
			'b.com',
		]);
	});
});
