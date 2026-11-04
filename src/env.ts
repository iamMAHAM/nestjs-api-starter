import { isIP } from 'node:net';
import type { ConfigService } from '@nestjs/config';
import { z } from 'zod';

const csv = z
	.string()
	.transform((value) =>
		value
			.split(',')
			.map((entry) => entry.trim())
			.filter(Boolean),
	)
	.pipe(z.array(z.string()).min(1));

const PROXY_RANGE_KEYWORDS = new Set(['loopback', 'linklocal', 'uniquelocal']);

const isIpOrCidr = (entry: string) => {
	const [address = '', prefix, ...rest] = entry.split('/');
	const version = isIP(address);
	if (version === 0 || rest.length > 0) return false;
	if (prefix === undefined) return true;
	if (!/^\d+$/.test(prefix)) return false;
	return Number(prefix) <= (version === 4 ? 32 : 128);
};

// Express `trust proxy`: `false`, a hop count, or IPs/CIDRs/keywords.
const trustProxy = z
	.string()
	.default('false')
	.transform((raw, ctx): false | number | string[] => {
		const value = raw.trim();
		if (value === '' || value === 'false') return false;
		if (/^\d+$/.test(value)) return Number(value);
		if (value === 'true') {
			ctx.addIssue({
				code: 'custom',
				message:
					'TRUST_PROXY=true lets any client spoof its IP through X-Forwarded-For. Use a hop count (e.g. 1) or the proxy addresses instead.',
			});
			return z.NEVER;
		}
		const entries = value
			.split(',')
			.map((entry) => entry.trim())
			.filter(Boolean);
		const invalid = entries.filter(
			(entry) => !PROXY_RANGE_KEYWORDS.has(entry) && !isIpOrCidr(entry),
		);
		if (invalid.length > 0) {
			ctx.addIssue({
				code: 'custom',
				message: `TRUST_PROXY has entries that are neither an IP, a CIDR nor loopback/linklocal/uniquelocal: ${invalid.join(', ')}`,
			});
			return z.NEVER;
		}
		return entries;
	});

export const envSchema = z.object({
	NODE_ENV: z
		.enum(['development', 'test', 'production'])
		.default('development'),
	PORT: z.coerce.number().int().positive().default(4000),
	LOG_LEVEL: z
		.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
		.default('info'),

	DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),

	BETTER_AUTH_SECRET: z.string().min(32, {
		error:
			'BETTER_AUTH_SECRET must be at least 32 chars (openssl rand -base64 32).',
	}),
	BETTER_AUTH_URL: z.url().default('http://localhost:4000'),
	// `.default()` on a piped schema takes the *output* type, hence the arrays.
	BETTER_AUTH_TRUSTED_ORIGINS: csv.default(['http://localhost:3000']),
	AUTH_COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),

	CORS_ORIGINS: csv.default(['http://localhost:3000']),
	API_PREFIX: z.string().default('v1'),
	TRUST_PROXY: trustProxy,

	THROTTLE_TTL: z.coerce.number().int().positive().default(60_000),
	THROTTLE_LIMIT: z.coerce.number().int().positive().default(100),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Type `ConfigService` with this to get exact types out of `get()`:
 *
 * ```ts
 * constructor(private readonly config: AppConfigService) {}
 * this.config.get('PORT', { infer: true }); // number, not string | undefined
 * ```
 *
 * The `true` marks the config as validated, which drops `undefined` from the
 * return type — safe because `validateEnv` throws on a bad environment.
 */
export type AppConfigService = ConfigService<Env, true>;

/**
 * Passed to `ConfigModule.forRoot({ validate })`. The returned object becomes
 * the validated config, so `ConfigService.get` hands back the *parsed* values
 * (numbers, string arrays) rather than the raw strings from `process.env`.
 */
export const validateEnv = (raw: Record<string, unknown>): Env => {
	const parsed = envSchema.safeParse(raw);
	if (!parsed.success) {
		// Fail loudly and early — a half-configured API is worse than no API.
		throw new Error(
			`Invalid environment variables:\n${z.prettifyError(parsed.error)}`,
		);
	}
	return parsed.data;
};
