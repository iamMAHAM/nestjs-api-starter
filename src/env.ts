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

	CORS_ORIGINS: csv.default(['http://localhost:3000']),
	API_PREFIX: z.string().default('v1'),

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
